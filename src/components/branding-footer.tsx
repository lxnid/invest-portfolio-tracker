"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "./feedback-modal";

import { cn } from "@/lib/utils";

interface BrandingFooterProps {
  className?: string;
  mobile?: boolean;
}

export function BrandingFooter({ className, mobile }: BrandingFooterProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <div className={cn("mt-auto pt-4 border-t border-[#2f2f2f]", className)}>
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#a8a8a8] hover:bg-[#2a2a2a] hover:text-[#5eead4] transition-all duration-200 group"
      >
        <MessageSquarePlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
        {mobile ? "Send Feedback / Bug Report" : "Feedback"}
      </button>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}
