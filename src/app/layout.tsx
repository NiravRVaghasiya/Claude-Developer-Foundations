import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { getTopicsByDomain } from "@/lib/content";

export const metadata: Metadata = {
  title: "CCDV-F Study — Claude Certified Developer: Foundations",
  description:
    "Interactive study platform for the Claude Certified Developer: Foundations (CCDV-F) exam. Read topics, drill flashcards, and take a scored practice quiz.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const groups = getTopicsByDomain();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <AppShell groups={groups}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
