import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/demo-banner";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSE Portfolio Tracker",
  description:
    "Personal Colombo Stock Exchange portfolio tracker with analytics",
  keywords: [
    "CSE",
    "Colombo Stock Exchange",
    "portfolio",
    "stocks",
    "investing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950`}
      >
        <Providers>
          <DemoBanner />
          <div className="flex min-h-screen flex-col lg:flex-row">
            <Sidebar />
            <MobileSidebar />
            <main className="flex-1 p-4 md:px-16 lg:ml-64 lg:p-8 lg:px-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
