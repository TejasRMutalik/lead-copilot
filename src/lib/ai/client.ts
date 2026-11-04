// The only place that calls an AI model. Tries Gemini, then the Gemini fallback model, then Groq (if a key is set).
// generateJson() always returns validated data or throws an AiError. API keys are read on the server only.

import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { z } from "zod";

export type AiErrorCode = "AI_RATE_LIMIT" | "AI_BAD_OUTPUT" | "AI_UNAVAILABLE";

export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

type Provider = { kind: "gemini" | "groq"; model: string };

const TIMEOUT_MS = 25_000;
const WAIT_BEFORE_FALLBACK_MS = 2_000;

// Gemini model, Gemini fallback model, then Groq if configured.
function getProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const fallback = process.env.GEMINI_FALLBACK_MODEL;
    providers.push({ kind: "gemini", model });
    if (fallback && fallback !== model) providers.push({ kind: "gemini", model: fallback });
  }
  if (process.env.GROQ_API_KEY && process.env.GROQ_MODEL) {
    providers.push({ kind: "groq", model: process.env.GROQ_MODEL });
  }
  return providers;
}

type CallRequest = {
  system: string;
  turns: ChatTurn[];
  temperature: number;
  jsonSchema?: Record<string, unknown>; // set when we want JSON back
};

// One model call with a 25 second timeout. Returns the raw text.
async function callProvider(provider: Provider, req: CallRequest): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    if (provider.kind === "gemini") {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: provider.model,
        contents: req.turns.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.content }],
        })),
        config: {
          systemInstruction: req.system,
          temperature: req.temperature,
          abortSignal: controller.signal,
          ...(req.jsonSchema
            ? { responseMimeType: "application/json", responseJsonSchema: req.jsonSchema }
            : {}),
        },
      });
      return response.text ?? "";
    }

    // Groq's JSON mode does not enforce a schema, so describe the schema in the prompt.
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const system = req.jsonSchema
      ? `${req.system}\n\nReturn only a JSON object that matches this JSON schema:\n${JSON.stringify(req.jsonSchema)}`
      : req.system;
    const completion = await groq.chat.completions.create(
      {
        model: provider.model,
        temperature: req.temperature,
        messages: [{ role: "system", content: system }, ...req.turns],
        ...(req.jsonSchema ? { response_format: { type: "json_object" as const } } : {}),
      },
      { signal: controller.signal },
    );
    return completion.choices[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}

// Models sometimes wrap JSON in ``` fences. Strip them before parsing.
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pick the error to show when every provider failed.
function finalError(sawRateLimit: boolean): AiError {
  return sawRateLimit
    ? new AiError("AI_RATE_LIMIT", "The AI is busy right now. Please try again in a minute.")
    : new AiError("AI_UNAVAILABLE", "The AI service is not available right now.");
}

function isRateLimit(err: unknown): boolean {
  return (err as { status?: number })?.status === 429;
}

// Runs `attempt` against each provider in order until one works.
async function runChain<T>(
  label: string,
  attempt: (provider: Provider) => Promise<T>,
): Promise<{ result: T; model: string }> {
  const providers = getProviders();
  if (providers.length === 0) throw new AiError("AI_UNAVAILABLE", "No AI provider is configured.");

  let sawRateLimit = false;
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const started = Date.now();
    try {
      const result = await attempt(provider);
      console.log(`[ai] ${label} ok model=${provider.model} ms=${Date.now() - started} provider_try=${i + 1}`);
      return { result, model: provider.model };
    } catch (err) {
      // A bad answer after the retry is final; switching models will not fix it.
      if (err instanceof AiError) throw err;
      if (isRateLimit(err)) sawRateLimit = true;
      console.warn(
        `[ai] ${label} failed model=${provider.model} ms=${Date.now() - started} status=${(err as { status?: number })?.status ?? "none"}`,
      );
      if (i < providers.length - 1) await wait(WAIT_BEFORE_FALLBACK_MS);
    }
  }
  throw finalError(sawRateLimit);
}

type GenerateJsonArgs<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  jsonSchema: Record<string, unknown>;
  temperature?: number;
};

export async function generateJson<T>(args: GenerateJsonArgs<T>): Promise<{ data: T; model: string }> {
  const temperature = args.temperature ?? 0.3;

  // Ask once; if the answer fails validation, ask again with the error included.
  const askAndValidate = async (provider: Provider): Promise<T> => {
    const base: CallRequest = {
      system: args.system,
      turns: [{ role: "user", content: args.user }],
      temperature,
      jsonSchema: args.jsonSchema,
    };

    let problem = "";
    for (let tryNumber = 1; tryNumber <= 2; tryNumber++) {
      const req =
        tryNumber === 1
          ? base
          : {
              ...base,
              turns: [
                {
                  role: "user" as const,
                  content: `${args.user}\n\nYour last output failed validation: ${problem}. Return only valid JSON.`,
                },
              ],
            };
      const text = await callProvider(provider, req);
      try {
        return args.schema.parse(JSON.parse(stripFences(text)));
      } catch (err) {
        problem = err instanceof z.ZodError ? z.prettifyError(err) : "the output was not valid JSON";
        console.warn(`[ai] invalid output model=${provider.model} try=${tryNumber}`);
      }
    }
    throw new AiError("AI_BAD_OUTPUT", "The AI returned an answer we could not use. Please try again.");
  };

  const { result, model } = await runChain("json", askAndValidate);
  return { data: result, model };
}

export async function generateText(args: {
  system: string;
  messages: ChatTurn[];
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const { result, model } = await runChain("text", async (provider) => {
    const text = await callProvider(provider, {
      system: args.system,
      turns: args.messages,
      temperature: args.temperature ?? 0.5,
    });
    if (!text.trim()) throw new Error("empty reply");
    return text.trim();
  });
  return { text: result, model };
}
