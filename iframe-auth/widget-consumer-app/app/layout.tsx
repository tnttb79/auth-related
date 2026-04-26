import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat iframe consumer demo",
  description: "Demo shell for testing a producer-hosted chat iframe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
