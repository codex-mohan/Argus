import type { Metadata } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Argus — See the Entire Web Through One Memory",
  description:
    "Unified enterprise intelligence platform. Five agents scrape continuously. Three lenses analyze. One persistent graph connects every signal. GTM, Finance, and Security — stored once, analyzed three ways.",
  keywords: [
    "enterprise intelligence",
    "web scraping",
    "competitive analysis",
    "financial signals",
    "security monitoring",
    "AI agents",
    "knowledge graph",
    "GTM intelligence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${instrumentSerif.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      lang="en"
    >
      <body
        className="flex min-h-full flex-col"
        style={{
          fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
