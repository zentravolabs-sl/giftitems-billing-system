import type { Metadata } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Zentravo — Artisanal Gift Hampers & Luxury Keepsakes",
  description:
    "Curated luxury gift hampers, hand-poured botanical candles, eternal preserved blooms, and bespoke keepsakes for life's cherished moments.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#B85D4D" />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
