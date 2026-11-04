// Reads a WhatsApp export in the browser: either the .zip ("Export chat") or the _chat.txt inside it.
// Returns the chat text, cut to the newest part if it is longer than the parser accepts.

import { strFromU8, unzipSync } from "fflate";

export const CHAT_TEXT_MAX = 15000; // same limit as POST /api/intake/parse
const FILE_SIZE_MAX = 25 * 1024 * 1024; // exports with photos and voice notes can be large

export async function readChatFile(file: File): Promise<{ text: string; trimmed: boolean }> {
  if (file.size > FILE_SIZE_MAX) throw new Error("That file is too large. Export the chat without media.");

  let text: string;
  if (file.name.toLowerCase().endsWith(".zip")) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let files: Record<string, Uint8Array>;
    try {
      // The filter skips photos and voice notes, so only the text file is unpacked.
      files = unzipSync(bytes, { filter: (entry) => entry.name.toLowerCase().endsWith(".txt") });
    } catch {
      throw new Error("Could not open the zip file.");
    }
    const names = Object.keys(files);
    if (names.length === 0) throw new Error("No chat text file found inside the zip.");
    // WhatsApp names it _chat.txt (iPhone) or "WhatsApp Chat with ....txt" (Android); use the biggest one.
    const biggest = names.sort((a, b) => files[b].length - files[a].length)[0];
    text = strFromU8(files[biggest]);
  } else if (file.name.toLowerCase().endsWith(".txt")) {
    text = await file.text();
  } else {
    throw new Error("Upload the WhatsApp export (.zip) or its chat text file (.txt).");
  }

  text = text.trim();
  if (text.length <= CHAT_TEXT_MAX) return { text, trimmed: false };

  // Keep the newest messages, starting at a line boundary so no message is cut in half.
  const tail = text.slice(-CHAT_TEXT_MAX);
  const firstNewline = tail.indexOf("\n");
  return { text: firstNewline === -1 ? tail : tail.slice(firstNewline + 1), trimmed: true };
}
