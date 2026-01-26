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
  const allViolations = violations || [];
  const criticalViolations = allViolations.filter(
    (v) => v.severity === "critical",
  );
  const warningViolations = allViolations.filter(
    (v) => v.severity === "warning",
  );
  // Catch any violations that didn't match the standard severities
  const otherViolations = allViolations.filter(
    (v) => v.severity !== "critical" && v.severity !== "warning",
  );

  const cashStatusColor =
    newTotals && newTotals.cashPercent >= 20
      ? "text-emerald-500"
      : "text-red-500";

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-50 flex items-center gap-2">
            <ShieldCheck
              className={`h-4 w-4 ${isValid ? "text-emerald-500" : "text-red-500"}`}
            />
            Rule Compliance Check
          </h3>
          <Badge variant={isValid ? "success" : "destructive"}>
            {isValid ? "Approved" : "Violations Found"}
          </Badge>
        </div>

        {newTotals && (
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Post-Trade Cash</span>
            <div className="text-right">
              <p className={`font-mono font-bold ${cashStatusColor}`}>
                {newTotals.cashPercent.toFixed(1)}%
              </p>
              <p className="text-zinc-500">
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
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-500">
                      {v.ruleName}
                    </p>
                    <p className="text-xs text-zinc-50 mt-1">{v.message}</p>
                    {v.impact && (
                      <p className="text-xs text-red-400 mt-1">{v.impact}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {warningViolations.map((v, i) => (
              <div
                key={`warn-${i}`}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-500">
                      {v.ruleName}
                    </p>
                    <p className="text-xs text-zinc-50 mt-1">{v.message}</p>
                    {v.impact && (
                      <p className="text-xs text-amber-500 mt-1 border-t border-amber-500/20 pt-1">
                        {v.impact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {otherViolations.map((v, i) => (
              <div
                key={`other-${i}`}
                className="p-3 rounded-lg bg-zinc-800 border border-zinc-700"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">
                      {v.ruleName || "Policy Violation"}
                    </p>
                    <p className="text-xs text-zinc-50 mt-1">{v.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !isValid ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>Transaction violates rules. Please check constraints.</p>
            </div>
          </div>
        ) : isValid ? (
          <div className="flex items-center gap-2 text-emerald-500 text-sm p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-4 w-4" />
            <p>Trade complies with all investment rules.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
