// CSE API Client
// Base URL: https://www.cse.lk/api/
// All endpoints use POST requests with application/x-www-form-urlencoded data

const CSE_API_BASE = "https://www.cse.lk/api";

interface CSEApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Custom timeout error class
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

interface CSEOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

async function cseRequest<T>(
  endpoint: string,
  params?: Record<string, string>,
  options: CSEOptions = {},
): Promise<CSEApiResponse<T>> {
  const { timeout = 15000, retries = 3, ...fetchOptions } = options;

  let lastError: string = "Unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${CSE_API_BASE}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params ? new URLSearchParams(params).toString() : undefined,
        next: { revalidate: 60 }, // Cache for 60 seconds
        signal: controller.signal,
        ...fetchOptions,
      });

      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`CSE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      // Determine if we should retry
      const isAbort = error instanceof Error && error.name === "AbortError";
      const errorMessage = isAbort
        ? `Request timed out after ${timeout}ms`
        : error instanceof Error
          ? error.message
          : "Unknown error";

      lastError = errorMessage;

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = 500 * Math.pow(2, attempt);
      console.warn(
        `[CSE API] Attempt ${attempt + 1}/${retries + 1} failed (${errorMessage}). Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    data: null,
    error: lastError,
  };
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
  return cseRequest<ASPIData>("aspiData");
}

export async function getSP20(): Promise<CSEApiResponse<ASPIData>> {
  return cseRequest<ASPIData>("snpData");
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
  const response = await cseRequest<DetailedTradesResponse>("detailedTrades", {
    symbol,
  });
  if (response.data?.reqDetailTrades) {
    // The CSE API might ignore the symbol param and return all, so we double-check/filter here
    const filtered = response.data.reqDetailTrades.filter(
      (t) => t.symbol === symbol,
    );
    return {
      ...response,
      data: {
        reqDetailTrades: filtered,
      },
    };
  }
  return response;
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
    lastTradedPrice?: number;
    change?: number;
    changePercentage?: number;
    marketCapPercentage?: number;
    tdyShareVolume?: number;
    tdyTradeVolume?: number;
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

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    notation: "compact",
    maximumFractionDigits: 2,
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
