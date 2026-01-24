// CSE API Client
// Base URL: https://www.cse.lk/api/
// All endpoints use POST requests with application/x-www-form-urlencoded data

const CSE_API_BASE = "https://www.cse.lk/api";

interface CSEApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function cseRequest<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<CSEApiResponse<T>> {
  try {
    const response = await fetch(`${CSE_API_BASE}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params ? new URLSearchParams(params).toString() : undefined,
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`CSE API error: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// MARKET DATA
// ============================================================================

export interface MarketStatus {
  status: string;
}

export async function getMarketStatus(): Promise<CSEApiResponse<MarketStatus>> {
  return cseRequest<MarketStatus>("marketStatus");
}

export interface ASPIData {
  value: number;
  change: number;
  changePercentage?: number;
}

export async function getASPI(): Promise<CSEApiResponse<ASPIData>> {
  return cseRequest<ASPIData>("sASPI");
}

export async function getSP20(): Promise<CSEApiResponse<ASPIData>> {
  return cseRequest<ASPIData>("sSP20");
}

// ============================================================================
// STOCK DATA
// ============================================================================

export interface StockTrade {
  id: number;
  securityId: number | null;
  name: string;
  symbol: string;
  price: number;
  qty: number;
  trades: number;
  change: number;
  changePercentage: number;
}

export interface DetailedTradesResponse {
  reqDetailTrades: StockTrade[];
}

export async function getAllStockPrices(): Promise<
  CSEApiResponse<DetailedTradesResponse>
> {
  return cseRequest<DetailedTradesResponse>("detailedTrades");
}

export async function getStockPrice(
  symbol: string,
): Promise<CSEApiResponse<DetailedTradesResponse>> {
  return cseRequest<DetailedTradesResponse>("detailedTrades", { symbol });
}

// ============================================================================
// COMPANY INFO
// ============================================================================

export interface CompanyInfo {
  reqLogo: { path: string };
  reqSymbolInfo: {
    symbol: string;
    name: string;
    sector?: string;
    [key: string]: unknown;
  };
}

export async function getCompanyInfo(
  symbol: string,
): Promise<CSEApiResponse<CompanyInfo>> {
  return cseRequest<CompanyInfo>("companyInfoSummery", { symbol });
}

// ============================================================================
// MARKET SUMMARY
// ============================================================================

export interface DailyMarketSummary {
  id: number;
  tradeDate: number;
  marketTurnover: number;
  marketTrades: number;
  volumeOfTurnOverNumber: number;
  listedCompanyNumber: number;
  tradeCompanyNumber: number;
  marketCap: number;
  asi: number;
  spp: number;
  per: number;
  pbv: number;
  dy: number;
}

export async function getDailyMarketSummary(): Promise<
  CSEApiResponse<DailyMarketSummary[][]>
> {
  return cseRequest<DailyMarketSummary[][]>("dailyMarketSummery");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function getChangeColor(change: number): string {
  if (change > 0) return "text-green-500";
  if (change < 0) return "text-red-500";
  return "text-gray-500";
}
