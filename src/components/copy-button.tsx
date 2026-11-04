"use client";

// Button that copies the given text to the clipboard and briefly shows "Copied" (or "Copy failed").

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Older or locked-down browsers block navigator.clipboard; a hidden textarea still works there.
function copyWithTextarea(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }
}

export function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState("Copy");

  async function copy() {
    let done = false;
    try {
      await navigator.clipboard.writeText(text);
      done = true;
    } catch {
      done = copyWithTextarea(text);
    }
    setLabel(done ? "Copied" : "Copy failed");
    setTimeout(() => setLabel("Copy"), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {label}
    </Button>
  );
}
