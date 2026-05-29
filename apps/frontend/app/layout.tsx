import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context.tsx";

export const metadata: Metadata = {
  title: "Argus — Unified Intelligence",
  description:
    "A hundred eyes on the web. Every eye sees a different signal. Three lenses, one truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full antialiased" lang="en">
      <head>
        <link
          crossOrigin="anonymous"
          href="https://api.fontshare.com"
          rel="preconnect"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=clash-display@200,300,400,500,600,700&f[]=commit-mono@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-base text-text-primary">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
