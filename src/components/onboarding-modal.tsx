"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  PiggyBank,
  HelpCircle,
} from "lucide-react";

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  screenshot: string;
}

const steps: OnboardingStep[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    description:
      "Get a bird's-eye view of your portfolio. See total value, P/L, market charts, and quick insights at a glance.",
    color: "text-blue-500",
    screenshot: "/onboarding/dashboard.png",
  },
  {
    icon: Briefcase,
    title: "Portfolio Tracking",
    description:
      "Track all your stock holdings with real-time prices. View detailed analytics for each position.",
    color: "text-violet-500",
    screenshot: "/onboarding/portfolio.png",
  },
  {
    icon: ShieldCheck,
    title: "Trading Alerts",
    description:
      "Set up trading rules with thresholds. Monitor violations and maintain your discipline score.",
    color: "text-emerald-500",
    screenshot: "/onboarding/alerts.png",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description:
      "Visualize performance over time. Track sector allocation and compare against market indices.",
    color: "text-cyan-500",
    screenshot: "/onboarding/analytics.png",
  },
  {
    icon: PiggyBank,
    title: "Savings Tracker",
    description:
      "Monitor savings accounts and fixed deposits. Compare interest rates across banks.",
    color: "text-amber-500",
    screenshot: "/onboarding/savings.png",
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="CSE Tracker"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="text-sm font-medium text-zinc-400">
              Welcome to CSE Tracker
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Screenshot */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 mb-6">
            <Image
              src={step.screenshot}
              alt={step.title}
              fill
              className="object-cover object-top"
              priority
            />
          </div>

          {/* Title & Description */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 shrink-0 rounded-xl bg-zinc-800/80 flex items-center justify-center ${step.color}`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-50 mb-1">
                {step.title}
              </h2>
              <p className="text-zinc-400 text-sm">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? "bg-blue-500 w-6"
                    : "bg-zinc-700 hover:bg-zinc-600"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all"
              >
                {isLastStep ? "Get Started" : "Next"}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch("/api/user/onboarding");
      if (res.ok) {
        const data = await res.json();
        setShowOnboarding(!data.completed);
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    } finally {
      setHasChecked(true);
    }
  };

  const completeOnboarding = async () => {
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
      });
      setShowOnboarding(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setShowOnboarding(false);
    }
  };

  const openOnboarding = () => {
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    hasChecked,
    completeOnboarding,
    openOnboarding,
    closeOnboarding,
  };
}
