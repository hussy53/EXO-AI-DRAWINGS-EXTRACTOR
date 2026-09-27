import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exo AI Drawings Extractor",
  description: "Extract reviewable mirror and glass takeoffs from plans, sections, elevations, and detail drawings.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
