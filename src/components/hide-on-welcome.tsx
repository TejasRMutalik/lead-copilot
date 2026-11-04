"use client";

// Wraps the site header so it is not shown on the welcome page, which has its own layout.

import { usePathname } from "next/navigation";

export function HideOnWelcome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/welcome" ? null : children;
}
