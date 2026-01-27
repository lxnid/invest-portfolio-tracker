import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateSavingsEntry,
  useUpdateSavingsEntry,
  SavingsEntry,
} from "@/lib/hooks";

interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: SavingsEntry | null;
}

export function AddSavingsModal({
  isOpen,
  onClose,
  entryToEdit,
}: AddSavingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(entryToEdit?.name || "");
  const [bankName, setBankName] = useState(entryToEdit?.bankName || "");
  const [type, setType] = useState(entryToEdit?.type || "SAVINGS");
  const [amount, setAmount] = useState(entryToEdit?.amount || "");
  const [interestRate, setInterestRate] = useState(
    entryToEdit?.interestRate || "",
  );
  const [startDate, setStartDate] = useState(
    entryToEdit?.startDate
      ? new Date(entryToEdit.startDate).toISOString().split("T")[0]
      : "",
  );
  const [maturityDate, setMaturityDate] = useState(
    entryToEdit?.maturityDate
      ? new Date(entryToEdit.maturityDate).toISOString().split("T")[0]
      : "",
  );
  const [notes, setNotes] = useState(entryToEdit?.notes || "");

  const createMutation = useCreateSavingsEntry();
  const updateMutation = useUpdateSavingsEntry();

  const banks = [
    "HNB",
    "Commercial Bank",
    "Sampath Bank",
    "NTB (Nations Trust)",
    "Seylan Bank",
    "NDB",
    "DFCC",
    "Amana Bank",
    "NSB",
    "BOC",
    "Peoples Bank",
    "Pan Asia Bank",
    "Union Bank",
    "Cargills Bank",
    "Other",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Calculations
  const principal = parseFloat(amount) || 0;
  const rate = parseFloat(interestRate) || 0;

  // FD Calculations
  let fdInterest = 0;
  let fdFinalValue = 0;
  let tenureMonths = 0;

  if (type === "FIXED_DEPOSIT" && startDate && maturityDate) {
    const start = new Date(startDate);
    const end = new Date(maturityDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    tenureMonths = diffDays / 30.44; // Approximation

    // Simple Interest Formula for FD: Principal * Rate * (Days / 365) / 100
    // Or approximate (Months/12)
    fdInterest = (principal * rate * (diffDays / 365)) / 100;
    fdFinalValue = principal + fdInterest;
  }

  // Money Market / Savings Weekly Calculation
  const weeklyInterest = (principal * (rate / 100)) / 52;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name,
        bankName,
        type,
        amount,
        interestRate,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        maturityDate: maturityDate
          ? new Date(maturityDate).toISOString()
          : undefined,
        notes,
      };

      if (entryToEdit) {
        await updateMutation.mutateAsync({
          id: entryToEdit.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save entry", error);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4">
          <CardTitle className="text-zinc-50">
            {entryToEdit ? "Edit Savings / Deposit" : "Add Savings / Deposit"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Account / Deposit Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Bank</Label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-50"
              >
                <option value="" disabled>
                  Select a Bank
                </option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {["SAVINGS", "FIXED_DEPOSIT", "MONEY_MARKET"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 px-2 py-2 rounded-md text-[10px] sm:text-xs font-medium transition-colors border ${
                      type === t
                        ? "bg-blue-500/10 border-blue-500 text-blue-500"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                    }`}
                  >
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (LKR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Fixed Deposit Specific Fields */}
            {type === "FIXED_DEPOSIT" && (
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maturity Date</Label>
                    <Input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-800/50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Duration:</span>
                    <span className="text-zinc-50">
                      ~{tenureMonths.toFixed(1)} Months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Interest:</span>
                    <span className="text-emerald-500 font-medium">
                      +
                      {fdInterest.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      LKR
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-700 pt-2">
                    <span className="text-zinc-50 font-medium">
                      Final Value:
                    </span>
                    <span className="text-zinc-50 font-bold">
                      {fdFinalValue.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      LKR
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Money Market / Savings Specific Info */}
            {(type === "MONEY_MARKET" || type === "SAVINGS") &&
              amount &&
              interestRate && (
                <div className="rounded-lg bg-zinc-800/50 p-3 flex justify-between text-sm">
                  <span className="text-zinc-400">Est. Weekly Interest:</span>
                  <span className="text-emerald-500 font-medium">
                    +
                    {weeklyInterest.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    LKR
                  </span>
                </div>
              )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="hover:bg-zinc-800 text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {entryToEdit ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
