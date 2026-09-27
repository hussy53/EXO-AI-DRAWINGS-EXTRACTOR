import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exo Drawings Extractor",
  description: "Review glass and aluminium schedules extracted from drawing PDFs.",
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
