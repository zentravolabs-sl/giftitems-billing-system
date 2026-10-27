import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "Oak Bloom — Lights, Flowers & Home Décor | Handcrafted & Timeless",
  description:
    "A thoughtfully curated collection of handcrafted wooden lights, artificial flowers, and elegant home décor pieces – designed to bring warmth, beauty, and timeless charm into your space.",
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
    <html lang="en" className={`h-full antialiased ${lora.variable} ${dmSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8F6B2A" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${lora.variable} ${dmSans.variable} font-sans min-h-full flex flex-col bg-[#FAF7F2] text-[#2B2625]`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
