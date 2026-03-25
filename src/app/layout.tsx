import type { Metadata, Viewport } from "next";
import "@fontsource/press-start-2p";
import "./globals.css";

export const metadata: Metadata = {
  title: "SearchSquatch — The Internet's Only Cryptid-Powered Search Engine",
  description: "Search the web with a Sasquatch. He reads your results out loud, roasts every headline, and has opinions about everything. Cryptid-powered queries, delivered fresh from the forest.",
  openGraph: {
    title: "SearchSquatch — Cryptid-Powered Queries",
    description: "A Sasquatch in a suit reads your search results out loud and gives his unfiltered 400-year-old opinion on every headline. Try it.",
    url: "https://searchsquatch.netlify.app",
    siteName: "SearchSquatch",
    images: [
      {
        url: "https://searchsquatch.netlify.app/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "SearchSquatch — Cryptid-Powered Queries",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SearchSquatch — Cryptid-Powered Queries",
    description: "A Sasquatch in a suit reads your search results out loud. The internet's only bigfoot search engine.",
    images: ["https://searchsquatch.netlify.app/images/og-share.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="sasquatch-avatar" style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, background: "#000" }} />
        {children}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="module"
          src="https://agent.d-id.com/v2/index.js"
          data-mode="full"
          data-client-key="ck_q1v6Qu1g6SBFG49DkmlyX"
          data-agent-id="v2_agt_osfGFBOL"
          data-name="did-agent"
          data-monitor="true"
          data-target-id="sasquatch-avatar"
        />
      </body>
    </html>
  );
}
