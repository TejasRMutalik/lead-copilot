import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { HideOnWelcome } from "@/components/hide-on-welcome";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lead Copilot",
  description: "Prioritize inbound real-estate leads and act on them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The header is also the fallback, so pages with a dynamic URL show it right away. */}
        <Suspense fallback={<SiteHeader />}>
          <HideOnWelcome>
            <SiteHeader />
          </HideOnWelcome>
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
