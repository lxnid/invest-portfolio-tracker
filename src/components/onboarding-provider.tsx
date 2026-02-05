"use client";

import { OnboardingModal, useOnboarding } from "@/components/onboarding-modal";
import { createContext, useContext, ReactNode } from "react";

interface OnboardingContextType {
  openOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within OnboardingProvider",
    );
  }
  return context;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const {
    showOnboarding,
    hasChecked,
    completeOnboarding,
    openOnboarding,
    closeOnboarding,
  } = useOnboarding();

  return (
    <OnboardingContext.Provider value={{ openOnboarding }}>
      {children}
      {hasChecked && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={closeOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </OnboardingContext.Provider>
  );
}
