"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Shield, Bell, BarChart3, Wallet, Zap } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Real-time Market Data",
    description:
      "Live ASPI, S&P SL20 indices and individual stock prices directly from CSE.",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Portfolio Analytics",
    description:
      "Track holdings, average buy prices, P/L, and capital allocation at a glance.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Trading Rules Engine",
    description:
      "Set compliance rules for position sizing, stop-loss, and trade frequency.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "TradingView Charts",
    description:
      "Professional-grade interactive charts with technical indicators.",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Smart Alerts",
    description:
      "Get notified about price movements and rule violations automatically.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Edge-deployed on Cloudflare for minimal latency worldwide.",
  },
];

interface FeatureCardProps {
  feature: Feature;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function FeatureCard({ feature, index, isActive, onClick }: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 md:p-6 rounded-2xl border transition-all duration-300 ${
        isActive
          ? "bg-zinc-900/80 border-blue-500/50 shadow-lg shadow-blue-500/10"
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl transition-colors duration-300 ${
            isActive
              ? "bg-blue-500/20 text-blue-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {feature.icon}
        </div>
        <div className="flex-1">
          <h3
            className={`font-semibold mb-1 transition-colors duration-300 ${
              isActive ? "text-zinc-50" : "text-zinc-300"
            }`}
          >
            {feature.title}
          </h3>
          <p
            className={`text-sm transition-all duration-300 ${
              isActive
                ? "text-zinc-400 max-h-20 opacity-100"
                : "text-zinc-500 max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            {feature.description}
          </p>
        </div>
        <div
          className={`transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
        >
          <svg
            className="w-5 h-5 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div
          className={`text-center mb-12 md:mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 mb-4">
            Everything you need.
            <br />
            <span className="text-zinc-400">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Built specifically for CSE investors who want clarity, not
            complexity.
          </p>
        </div>

        {/* Features layout - Google Pixel style */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Feature visual */}
          <div
            className={`relative transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="sticky top-24 md:top-32">
              {/* Glassmorphism card */}
              <div className="relative aspect-square rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-500/20" />
                <div className="absolute inset-0 backdrop-blur-xl bg-zinc-900/40 border border-zinc-700/50" />

                {/* Feature illustration placeholder */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div
                    className={`text-center transition-all duration-500 ${
                      activeFeature !== undefined
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                    }`}
                  >
                    <div className="inline-flex p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700 mb-6">
                      <div className="text-blue-400 scale-150">
                        {features[activeFeature]?.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-50 mb-2">
                      {features[activeFeature]?.title}
                    </h3>
                    <p className="text-zinc-400 max-w-xs mx-auto">
                      {features[activeFeature]?.description}
                    </p>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="absolute bottom-4 left-4 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
              </div>
            </div>
          </div>

          {/* Right: Accordion features */}
          <div
            className={`space-y-3 transition-all duration-700 delay-300 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                index={index}
                isActive={activeFeature === index}
                onClick={() => setActiveFeature(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
