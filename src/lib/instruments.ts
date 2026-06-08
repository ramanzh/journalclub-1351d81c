import type { Trade } from "./trade-utils";

export const INSTRUMENTS: Record<Trade["market"], string[]> = {
  forex: [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD",
    "NZDUSD", "USDCHF", "XAUUSD", "XAGUSD",
  ],
  crypto: ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK"],
  stock: ["AAPL", "MSFT", "NVDA", "AMZN", "TSLA", "META", "GOOGL"],
};
