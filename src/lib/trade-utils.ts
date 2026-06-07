export type Trade = {
  id: string;
  user_id: string;
  asset_name: string;
  market: "forex" | "crypto" | "stock";
  side: "buy" | "sell";
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  position_size: number;
  profit_loss: number | null;
  screenshot_url: string | null;
  emotion_before: string | null;
  emotion_after: string | null;
  mistakes: string | null;
  lessons: string | null;
  notes: string | null;
  trade_date: string;
  created_at: string;
  updated_at: string;
};

export const formatNumber = (n: number | null | undefined, frac = 2) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac,
  }).format(Number(n));
};

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(iso));

export const marketLabel: Record<Trade["market"], string> = {
  forex: "فارکس",
  crypto: "کریپتو",
  stock: "سهام",
};

export const sideLabel: Record<Trade["side"], string> = {
  buy: "خرید",
  sell: "فروش",
};

export function computeStats(trades: Trade[]) {
  const closed = trades.filter((t) => t.profit_loss !== null);
  const wins = closed.filter((t) => (t.profit_loss ?? 0) > 0);
  const losses = closed.filter((t) => (t.profit_loss ?? 0) < 0);
  const totalPL = closed.reduce((s, t) => s + (t.profit_loss ?? 0), 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;

  const rrValues = trades
    .map((t) => {
      if (!t.stop_loss || !t.take_profit) return null;
      const risk = Math.abs(t.entry_price - t.stop_loss);
      const reward = Math.abs(t.take_profit - t.entry_price);
      if (risk === 0) return null;
      return reward / risk;
    })
    .filter((v): v is number => v !== null && isFinite(v));
  const avgRR = rrValues.length ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;

  // Monthly performance for last 6 months
  const monthly = new Map<string, number>();
  closed.forEach((t) => {
    const d = new Date(t.trade_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(key, (monthly.get(key) ?? 0) + (t.profit_loss ?? 0));
  });
  const monthlyArr = Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, pl]) => {
      const [y, m] = month.split("-").map(Number);
      const label = new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(new Date(y, m - 1, 1));
      return { month: label, pl: Number(pl.toFixed(2)) };
    });

  return {
    total: trades.length,
    closed: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    avgRR,
    totalPL,
    monthly: monthlyArr,
  };
}
