import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelForge",
  description: "AI product videos that sell. Turn a product URL into faceless short-form video ads."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
