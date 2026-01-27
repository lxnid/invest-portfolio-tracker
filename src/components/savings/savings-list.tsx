import { useState } from "react";
import { Plus, Edit2, Trash2, Loader2, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSavings, useDeleteSavingsEntry, SavingsEntry } from "@/lib/hooks";
import { AddSavingsModal } from "./add-savings-modal";

export function SavingsList() {
  const { data: savings, isLoading } = useSavings();
  const deleteMutation = useDeleteSavingsEntry();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEdit = (entry: SavingsEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-blue-500" />
          <CardTitle>Savings Accounts</CardTitle>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Savings
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : !savings || savings.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No savings accounts yet</p>
            <p className="text-sm">
              Add your first savings account to start tracking.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Projection</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savings.map((entry) => {
                // Calculations for display
                const principal = parseFloat(entry.amount);
                const rate = parseFloat(entry.interestRate);
                let projection = null;
                let projectionLabel = "";

                if (
                  entry.type === "FIXED_DEPOSIT" &&
                  entry.startDate &&
                  entry.maturityDate
                ) {
                  const start = new Date(entry.startDate);
                  const end = new Date(entry.maturityDate);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const interest = (principal * rate * (diffDays / 365)) / 100;
                  projection = principal + interest;
                  projectionLabel = "Maturity Value";
                } else if (
                  entry.type === "MONEY_MARKET" ||
                  entry.type === "SAVINGS"
                ) {
                  const weekly = (principal * (rate / 100)) / 52;
                  projection = weekly;
                  projectionLabel = "Weekly Interest";
                }

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-zinc-50">
                      <div>{entry.name}</div>
                      {entry.type === "FIXED_DEPOSIT" && entry.maturityDate && (
                        <div className="text-xs text-zinc-500">
                          Matures:{" "}
                          {new Date(entry.maturityDate).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{entry.bankName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(entry.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                      <div className="text-xs text-zinc-500">
                        {entry.currency}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-emerald-500">
                      {entry.interestRate}%
                    </TableCell>
                    <TableCell className="text-right text-zinc-400 text-sm">
                      {projection ? (
                        <div>
                          <div className="text-zinc-50 font-medium">
                            {projection.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-[10px] uppercase">
                            {projectionLabel}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entry)}
                          className="h-8 w-8 text-zinc-400 hover:text-blue-500"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-zinc-400 hover:text-red-500"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddSavingsModal
        key={
          isModalOpen
            ? editingEntry
              ? `edit-${editingEntry.id}`
              : "add-new"
            : "closed"
        }
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entryToEdit={editingEntry}
      />
    </Card>
  );
}
