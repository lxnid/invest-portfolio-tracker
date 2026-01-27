import { Metadata } from "next";
import { MarketView } from "@/components/views/market-view";

export const metadata: Metadata = {
  title: "Market Explorer",
  description:
    "Explore Colombo Stock Exchange (CSE) market data, indices (ASPI, S&P SL20), and listed companies.",
};

export default function MarketPage() {
  return <MarketView />;
}
