import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twutor — AI Tutor Feed",
  description: "A Twitter/X-inspired social learning feed for platform engineering and AI engineering."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
