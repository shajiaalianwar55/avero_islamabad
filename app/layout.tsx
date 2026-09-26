import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { DemoControls } from "@/components/demo/demo-controls";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avero — Islamabad home incident first responder",
  description:
    "When something breaks at home in Islamabad, know what to do next. AI triage, safe DIY, and coordinated professional help.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-body)] text-[var(--avero-ink)]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <DemoControls />
      </body>
    </html>
  );
}
