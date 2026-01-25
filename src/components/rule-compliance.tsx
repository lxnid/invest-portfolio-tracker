"use client";

import { use, memo } from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RuleViolation } from "@/lib/rule-engine";

interface ComplianceCardProps {
  isValid: boolean;
  violations: RuleViolation[];
  newTotals?: {
    cashPercent: number;
    cashBalance: number;
    totalCapital: number;
  };
}

export function RuleComplianceCard({
  isValid,
  violations = [],
  newTotals,
}: ComplianceCardProps) {
  const criticalViolations = violations.filter(
    (v) => v.severity === "critical",
  );
  const warningViolations = violations.filter((v) => v.severity === "warning");

  const cashStatusColor =
    newTotals && newTotals.cashPercent >= 20
      ? "text-[#4ade80]"
      : "text-[#f87171]";

  return (
    <Card className="border-[#333333] bg-[#1a1a1a]">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f5f5f5] flex items-center gap-2">
            <ShieldCheck
              className={`h-4 w-4 ${isValid ? "text-[#4ade80]" : "text-[#f87171]"}`}
            />
            Rule Compliance Check
          </h3>
          <Badge variant={isValid ? "success" : "destructive"}>
            {isValid ? "Approved" : "Violations Found"}
          </Badge>
        </div>

        {newTotals && (
          <div className="p-3 rounded-lg bg-[#262626] border border-[#333333] flex justify-between items-center text-xs">
            <span className="text-[#a8a8a8]">Post-Trade Cash</span>
            <div className="text-right">
              <p className={`font-mono font-bold ${cashStatusColor}`}>
                {newTotals.cashPercent.toFixed(1)}%
              </p>
              <p className="text-[#a8a8a8]">
                {newTotals.cashBalance.toLocaleString()} /{" "}
                {newTotals.totalCapital.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {violations.length > 0 ? (
          <div className="space-y-3">
            {criticalViolations.map((v, i) => (
              <div
                key={`crit-${i}`}
                className="p-3 rounded-lg bg-[#f87171]/10 border border-[#f87171]/30"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[#f87171] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#f87171]">
                      {v.ruleName}
                    </p>
                    <p className="text-xs text-[#f5f5f5] mt-1">{v.message}</p>
                    {v.impact && (
                      <p className="text-xs text-[#f87171] mt-1">{v.impact}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {warningViolations.map((v, i) => (
              <div
                key={`warn-${i}`}
                className="p-3 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/30"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#fbbf24] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#fbbf24]">
                      {v.ruleName}
                    </p>
                    <p className="text-xs text-[#f5f5f5] mt-1">{v.message}</p>
                    {v.impact && (
                      <p className="text-xs text-[#fbbf24] mt-1 border-t border-[#fbbf24]/20 pt-1">
                        {v.impact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isValid ? (
          <div className="flex items-center gap-2 text-[#4ade80] text-sm p-3 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20">
            <CheckCircle className="h-4 w-4" />
            <p>Trade complies with all investment rules.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
