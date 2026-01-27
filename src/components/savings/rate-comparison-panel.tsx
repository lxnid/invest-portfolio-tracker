import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BANK_RATES, BankRate } from "@/lib/bank-rates-data";
import { TrendingUp, ArrowUpDown } from "lucide-react";

export function RateComparisonPanel() {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BankRate;
    direction: "asc" | "desc";
  }>({ key: "rate", direction: "desc" });

  const sortedRates = useMemo(() => {
    const sortableRates = [...BANK_RATES];
    if (sortConfig !== null) {
      sortableRates.sort((a, b) => {
        if (a[sortConfig.key]! < b[sortConfig.key]!) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key]! > b[sortConfig.key]!) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRates;
  }, [sortConfig]);

  const requestSort = (key: keyof BankRate) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getCategoryData = (type: string) => {
    return sortedRates.filter((rate) => rate.type === type);
  };

  // Matrix View for Fixed Deposits
  const renderFDMatrix = () => {
    const periodOrder = [
      "1 Month",
      "3 Months",
      "4 Months",
      "6 Months",
      "9 Months",
      "1 Year",
    ];
    const banks = Array.from(
      new Set(
        BANK_RATES.filter((r) => r.type === "FIXED_DEPOSIT").map((r) => r.bank),
      ),
    ).sort();

    return (
      <div className="rounded-md border border-zinc-800 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50">
              <TableHead className="w-[150px]">Bank</TableHead>
              {periodOrder.map((period) => (
                <TableHead
                  key={period}
                  className="text-right whitespace-nowrap"
                >
                  {period}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {banks.map((bank) => (
              <TableRow key={bank} className="hover:bg-zinc-800/50">
                <TableCell className="font-medium text-zinc-50">
                  {bank}
                </TableCell>
                {periodOrder.map((period) => {
                  const rateData = BANK_RATES.find(
                    (r) =>
                      r.type === "FIXED_DEPOSIT" &&
                      r.bank === bank &&
                      r.period === period,
                  );
                  return (
                    <TableCell key={`${bank}-${period}`} className="text-right">
                      {rateData ? (
                        <div className="flex flex-col items-end">
                          <Badge
                            variant="default"
                            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 whitespace-nowrap"
                          >
                            {rateData.rate.toFixed(2)}%
                          </Badge>
                          {rateData.notes && (
                            <span className="text-[10px] text-zinc-600 mt-1">
                              {rateData.notes}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-700">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Standard List View for others
  const renderTable = (data: BankRate[], isFd: boolean = false) => {
    if (isFd) return renderFDMatrix();

    return (
      <div className="rounded-md border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-900/50 hover:bg-zinc-900/50">
              <TableHead className="w-[150px]">Institution</TableHead>
              <TableHead>Product</TableHead>
              <TableHead
                className="text-right cursor-pointer"
                onClick={() => requestSort("rate")}
              >
                <div className="flex items-center justify-end gap-1 hover:text-white">
                  Rate <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index} className="hover:bg-zinc-800/50">
                <TableCell className="font-medium text-zinc-50">
                  {item.bank}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.notes && (
                      <span className="text-[10px] text-zinc-500">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={index < 2 ? "default" : "outline"}
                    className={
                      index < 2
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : ""
                    }
                  >
                    {item.rate.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell text-zinc-400 text-xs">
                  {item.period === "Annualized" ? "Annualized" : item.period}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <CardTitle>Market Rates Comparison</CardTitle>
        </div>
        <CardDescription>
          Compare current interest rates across major Sri Lankan banks and funds
          (2025/2026).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="FIXED_DEPOSIT" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
            <TabsTrigger value="FIXED_DEPOSIT">Fixed Deposits</TabsTrigger>
            <TabsTrigger value="MONEY_MARKET">Money Market</TabsTrigger>
            <TabsTrigger value="SAVINGS">Savings</TabsTrigger>
          </TabsList>
          <TabsContent value="FIXED_DEPOSIT" className="mt-4">
            {renderTable(getCategoryData("FIXED_DEPOSIT"), true)}
          </TabsContent>
          <TabsContent value="MONEY_MARKET" className="mt-4">
            {renderTable(getCategoryData("MONEY_MARKET"))}
          </TabsContent>
          <TabsContent value="SAVINGS" className="mt-4">
            {renderTable(getCategoryData("SAVINGS"))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
