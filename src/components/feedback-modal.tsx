import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<"FEATURE" | "BUG" | "OTHER">("FEATURE");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("IDLE");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("SUCCESS");
      setTimeout(() => {
        onClose();
        setMessage("");
        setStatus("IDLE");
      }, 2000);
    } catch (error) {
      setStatus("ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <Card className="w-full max-w-md bg-[#1e1e1e] border-[#333333] shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#2f2f2f] pb-4">
          <CardTitle className="text-[#f5f5f5]">Share Feedback</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-[#a8a8a8] hover:text-[#f5f5f5]"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {status === "SUCCESS" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-[#f5f5f5]">Thank You!</h3>
              <p className="text-[#a8a8a8]">
                Your feedback has been received and will be reviewed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#a8a8a8]">Feedback Type</Label>
                <div className="flex gap-2">
                  {(["FEATURE", "BUG", "OTHER"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                        type === t
                          ? "bg-[#5eead4]/10 border-[#5eead4] text-[#5eead4]"
                          : "bg-[#262626] border-[#333333] text-[#a8a8a8] hover:bg-[#333333]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#a8a8a8]">Message</Label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-[#333333] bg-[#262626] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5eead4] disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us what you think..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {status === "ERROR" && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20">
                  <AlertCircle className="h-4 w-4" />
                  Something went wrong. Please try again.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="hover:bg-[#333333] text-[#a8a8a8]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="bg-linear-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
