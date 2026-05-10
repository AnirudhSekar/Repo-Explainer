import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "RepoLens — GitHub Repository Explainer",
  description: "Paste a GitHub URL and get AI-powered architecture diagrams, file explanations, setup instructions, and a junior engineer guide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* IBM Plex Mono — self-hosted by Google, loads on Vercel/prod */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
