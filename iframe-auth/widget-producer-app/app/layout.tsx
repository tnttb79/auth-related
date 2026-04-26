import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Widget Producer",
  description: "Producer dashboard and iframe chat APIs for the iframe-auth demo.",
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
