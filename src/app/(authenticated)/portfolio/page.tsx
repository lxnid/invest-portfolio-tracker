import { Metadata } from "next";
import { PortfolioView } from "@/components/views/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Manage your investment portfolio, track holdings, and analyze performance.",
};

export default function PortfolioPage() {
  return <PortfolioView />;
}
