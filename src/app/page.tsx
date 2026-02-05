import { Metadata } from "next";
import {
  Hero,
  FeaturesSection,
  DemoPreview,
  CTASection,
  Footer,
  LandingHeader,
} from "@/components/landing";

export const metadata: Metadata = {
  title:
    "CSE Portfolio Tracker - Track Your Colombo Stock Exchange Investments",
  description:
    "A personal investment tracker built for the Colombo Stock Exchange. Real-time market data, portfolio analytics, trading rules engine, and TradingView integration.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <LandingHeader />
      <Hero />
      <FeaturesSection />
      <DemoPreview />
      <CTASection />
      <Footer />
    </main>
  );
}
