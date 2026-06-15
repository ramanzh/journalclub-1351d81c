export type TradeQuality = "A+" | "A" | "B" | "C";
export const TRADE_QUALITIES: TradeQuality[] = ["A+", "A", "B", "C"];

export type Trade = {
  id: string;
  user_id: string;
  account_id: string | null;
  asset_name: string;
  market: "forex" | "crypto" | "stock";
  side: "buy" | "sell";
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  position_size: number;
  profit_loss: number | null;
  profit_loss_percent: number | null;
  risk_percent: number | null;
  screenshot_url: string | null;
  emotion_before: string | null;
  emotion_after: string | null;
  mistakes: string | null;
  lessons: string | null;
  notes: string | null;
  trade_date: string;
  created_at: string;
  updated_at: string;
  setup_tags: string[];
  session: Session | null;
  checklist: Record<string, boolean>;
  quality: TradeQuality | null;
  broken_rules: string[];
};

export type TradingRule = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TradeSetup = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  market: string | null;
  notes: string | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  account_type: "demo" | "prop" | "real";
  initial_balance: number;
  broker: string | null;
  daily_drawdown_limit: number | null;
  max_drawdown_limit: number | null;
  profit_target_1: number | null;
  profit_target_2: number | null;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  image_urls: string[] | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
};

export type FavoriteInstrument = {
  id: string;
  user_id: string;
  market: Trade["market"];
  symbol: string;
};

export type SetupTag = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  user_id: string;
  key: string;
  label: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
};

export const SESSIONS = ["london", "newyork", "tokyo", "sydney", "overlap"] as const;
export type Session = (typeof SESSIONS)[number];
export const sessionLabel: Record<Session, string> = {
  london: "لندن",
  newyork: "نیویورک",
  tokyo: "توکیو",
  sydney: "سیدنی",
  overlap: "همپوشانی",
};

export const EMOTIONS_BEFORE = [
  "calm", "confident", "fearful", "fomo", "overconfident", "frustrated", "revenge", "impulsive",
] as const;
export const EMOTIONS_AFTER = [
  "happy", "neutral", "regret", "frustrated", "confident", "angry",
] as const;
export const emotionLabel: Record<string, string> = {
  calm: "آرام",
  confident: "مطمئن",
  fearful: "ترسیده",
  fomo: "FOMO",
  overconfident: "بیش‌ازحد مطمئن",
  frustrated: "ناامید",
  revenge: "انتقامی",
  impulsive: "احساسی",
  happy: "خوشحال",
  neutral: "خنثی",
  regret: "پشیمان",
  angry: "عصبانی",
};

export const DEFAULT_SETUP_TAGS = [
  "FVG", "Reversal", "Range", "Scalping",
];

export const DEFAULT_CHECKLIST: { key: string; label: string }[] = [
  { key: "trend", label: "تأیید روند" },
  { key: "setup", label: "تأیید ستاپ" },
  { key: "risk", label: "ریسک در محدوده پلن" },
  { key: "sl", label: "حد ضرر مشخص شده" },
  { key: "entry", label: "ورود طبق استراتژی" },
  { key: "market", label: "شرایط بازار مناسب" },
];

export const formatNumber = (n: number | null | undefined, frac = 2) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac,
  }).format(Number(n));
};

export const formatPercent = (n: number | null | undefined, frac = 2) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  const v = Number(n);
  const sign = v > 0 ? "+" : "";
  return `${sign}${formatNumber(v, frac)}٪`;
};

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(iso));

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export const marketLabel: Record<Trade["market"], string> = {
  forex: "فارکس",
  crypto: "کریپتو",
  stock: "سهام",
};

export const sideLabel: Record<Trade["side"], string> = {
  buy: "خرید",
  sell: "فروش",
};

export const accountTypeLabel: Record<Account["account_type"], string> = {
  demo: "دمو",
  prop: "پراپ فرم",
  real: "حساب واقعی",
};

export function computeStats(trades: Trade[], accounts: Account[] = []) {
  const closed = trades.filter((t) => t.profit_loss !== null);
  const wins = closed.filter((t) => (t.profit_loss ?? 0) > 0);
  const losses = closed.filter((t) => (t.profit_loss ?? 0) < 0);
  const totalPL = closed.reduce((s, t) => s + (t.profit_loss ?? 0), 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const percents = closed.map((t) => {
    if (t.profit_loss_percent !== null && t.profit_loss_percent !== undefined) return t.profit_loss_percent;
    const acc = t.account_id ? accountMap.get(t.account_id) : null;
    if (acc && acc.initial_balance > 0) return ((t.profit_loss ?? 0) / acc.initial_balance) * 100;
    return null;
  }).filter((v): v is number => v !== null);
  const totalReturnPct = percents.reduce((s, v) => s + v, 0);
  const avgReturnPct = percents.length ? totalReturnPct / percents.length : 0;

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

  const risks = trades
    .map((t) => t.risk_percent)
    .filter((v): v is number => v !== null && v !== undefined && isFinite(v));
  const avgRisk = risks.length ? risks.reduce((s, v) => s + v, 0) / risks.length : 0;

  let riskConsistency = 0;
  if (risks.length >= 2 && avgRisk > 0) {
    const variance = risks.reduce((s, v) => s + (v - avgRisk) ** 2, 0) / risks.length;
    const cv = (Math.sqrt(variance) / avgRisk) * 100;
    riskConsistency = Math.max(0, Math.min(100, 100 - cv));
  } else if (risks.length === 1) {
    riskConsistency = 100;
  }

  let riskDiscipline = 0;
  if (risks.length && avgRisk > 0) {
    const within = risks.filter((v) => Math.abs(v - avgRisk) / avgRisk <= 0.25).length;
    riskDiscipline = (within / risks.length) * 100;
  }

  return {
    total: trades.length,
    closed: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    avgRR,
    avgRisk,
    riskConsistency,
    riskDiscipline,
    totalPL,
    totalReturnPct,
    avgReturnPct,
  };
}

export function buildEquityCurve(trades: Trade[], initialBalance: number) {
  const closed = [...trades]
    .filter((t) => t.profit_loss !== null)
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  let balance = initialBalance;
  const points: { date: string; balance: number; label: string }[] = [
    { date: "start", balance: initialBalance, label: "شروع" },
  ];
  for (const t of closed) {
    balance += t.profit_loss ?? 0;
    points.push({
      date: t.trade_date,
      balance: Number(balance.toFixed(2)),
      label: new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(t.trade_date)),
    });
  }
  return points;
}

export function accountStats(account: Account, trades: Trade[]) {
  const own = trades.filter((t) => t.account_id === account.id);
  const stats = computeStats(own, [account]);
  const currentBalance = account.initial_balance + stats.totalPL;
  const growthPct = account.initial_balance > 0 ? (stats.totalPL / account.initial_balance) * 100 : 0;
  return {
    ...stats,
    currentBalance,
    growthPct,
    initialBalance: account.initial_balance,
  };
}

export type AccountStatus = "active" | "target1" | "target2" | "failed";
export const accountStatusLabel: Record<AccountStatus, string> = {
  active: "فعال",
  target1: "تارگت ۱ رد شد",
  target2: "تارگت ۲ رد شد",
  failed: "ناموفق",
};

export function accountHealth(account: Account, trades: Trade[]) {
  const own = trades
    .filter((t) => t.account_id === account.id && t.profit_loss !== null)
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  const initial = Number(account.initial_balance) || 0;
  let balance = initial;
  let peak = initial;
  let maxDD = 0;

  const dayMap = new Map<string, { start: number; low: number }>();
  for (const t of own) {
    const key = new Date(t.trade_date).toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, { start: balance, low: balance });
    balance += t.profit_loss ?? 0;
    if (balance > peak) peak = balance;
    const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    const d = dayMap.get(key)!;
    if (balance < d.low) d.low = balance;
  }

  let maxDailyDD = 0;
  for (const d of dayMap.values()) {
    const dd = d.start > 0 ? ((d.start - d.low) / d.start) * 100 : 0;
    if (dd > maxDailyDD) maxDailyDD = dd;
  }

  const currentBalance = balance;
  const growthPct = initial > 0 ? ((currentBalance - initial) / initial) * 100 : 0;

  let status: AccountStatus = "active";
if (account.account_type === "prop") {
  if (account.daily_drawdown_limit != null && maxDailyDD >= account.daily_drawdown_limit) {
    status = "failed";
  } else if (account.max_drawdown_limit != null && maxDD >= account.max_drawdown_limit) {
    status = "failed";
  } else if (account.profit_target_2 != null && growthPct >= account.profit_target_2) {
    status = "target2";
  } else if (account.profit_target_1 != null && growthPct >= account.profit_target_1) {
    // فقط اگه target2 وجود نداره یا بهش نرسیده
    if (account.profit_target_2 == null || growthPct < account.profit_target_2) {
      status = "target1";
    }
  }
} else if (account.account_type === "real") {
    if (account.max_drawdown_limit != null && maxDD >= account.max_drawdown_limit) status = "failed";
  }

  const ddLimit = account.max_drawdown_limit ?? null;
  const drawdownRemaining = ddLimit != null ? Math.max(0, ddLimit - maxDD) : null;
  // target بر اساس وضعیت فعلی — اگه target1 زده شده، target2 نشون بده
const target = status === "target1"
  ? (account.profit_target_2 ?? account.profit_target_1 ?? null)
  : (account.profit_target_2 ?? account.profit_target_1 ?? null);
  const targetProgress = target != null && target > 0 ? Math.max(0, Math.min(100, (growthPct / target) * 100)) : null;

  return {
    status,
    currentBalance,
    initialBalance: initial,
    growthPct,
    maxDrawdown: maxDD,
    maxDailyDrawdown: maxDailyDD,
    drawdownLimit: ddLimit,
    drawdownRemaining,
    target,
    targetProgress,
  };
}

// ---- Advanced analytics ----

const tradePct = (t: Trade, accountMap: Map<string, Account>) => {
  if (t.profit_loss_percent != null) return t.profit_loss_percent;
  const acc = t.account_id ? accountMap.get(t.account_id) : null;
  if (acc && acc.initial_balance > 0 && t.profit_loss != null) {
    return (t.profit_loss / acc.initial_balance) * 100;
  }
  return null;
};

export function setupStats(trades: Trade[], accounts: Account[] = []) {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    for (const tag of t.setup_tags ?? []) {
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag)!.push(t);
    }
  }
  const result = [...groups.entries()].map(([name, list]) => {
    const closed = list.filter((t) => t.profit_loss !== null);
    const wins = closed.filter((t) => (t.profit_loss ?? 0) > 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    const pcts = closed.map((t) => tradePct(t, accountMap)).filter((v): v is number => v != null);
    const avgPL = pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length : 0;
    const risks = list.map((t) => t.risk_percent).filter((v): v is number => v != null);
    const avgRisk = risks.length ? risks.reduce((s, v) => s + v, 0) / risks.length : 0;
    return { name, trades: list.length, winRate, avgPL, avgRisk };
  });
  return result.sort((a, b) => b.winRate - a.winRate);
}

export function sessionStats(trades: Trade[], accounts: Account[] = []) {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  return SESSIONS.map((sess) => {
    const list = trades.filter((t) => t.session === sess);
    const closed = list.filter((t) => t.profit_loss !== null);
    const wins = closed.filter((t) => (t.profit_loss ?? 0) > 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    const risks = list.map((t) => t.risk_percent).filter((v): v is number => v != null);
    const avgRisk = risks.length ? risks.reduce((s, v) => s + v, 0) / risks.length : 0;
    const pcts = closed.map((t) => tradePct(t, accountMap)).filter((v): v is number => v != null);
    const growth = pcts.reduce((s, v) => s + v, 0);
    return { session: sess, label: sessionLabel[sess], trades: list.length, winRate, avgRisk, growth };
  });
}

export function emotionStats(trades: Trade[], phase: "before" | "after") {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = phase === "before" ? t.emotion_before : t.emotion_after;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const list = [...groups.entries()].map(([key, items]) => {
    const closed = items.filter((t) => t.profit_loss !== null);
    const wins = closed.filter((t) => (t.profit_loss ?? 0) > 0).length;
    const losses = closed.filter((t) => (t.profit_loss ?? 0) < 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    const lossRate = closed.length ? (losses / closed.length) * 100 : 0;
    return { key, label: emotionLabel[key] ?? key, count: items.length, winRate, lossRate };
  });
  return list.sort((a, b) => b.count - a.count);
}

export function checklistStats(trades: Trade[], items: ChecklistItem[]) {
  const closed = trades.filter((t) => t.profit_loss !== null);
  const totalItems = items.length || 1;

  const withFull = closed.filter((t) => {
    const c = t.checklist ?? {};
    return items.every((it) => c[it.key]);
  });
  const without = closed.filter((t) => {
    const c = t.checklist ?? {};
    return !items.every((it) => c[it.key]);
  });
  const wr = (arr: Trade[]) =>
    arr.length ? (arr.filter((t) => (t.profit_loss ?? 0) > 0).length / arr.length) * 100 : 0;

  const ignored = items.map((it) => {
    const ignoredCount = trades.filter((t) => !(t.checklist ?? {})[it.key]).length;
    return { key: it.key, label: it.label, ignoredCount };
  }).sort((a, b) => b.ignoredCount - a.ignoredCount);

  const discipline = trades.length
    ? (trades.reduce((sum, t) => {
        const c = t.checklist ?? {};
        const done = items.filter((it) => c[it.key]).length;
        return sum + done / totalItems;
      }, 0) / trades.length) * 100
    : 0;

  return {
    fullWinRate: wr(withFull),
    fullCount: withFull.length,
    partialWinRate: wr(without),
    partialCount: without.length,
    mostIgnored: ignored,
    discipline,
  };
}

export function qualityStats(trades: Trade[], accounts: Account[] = []) {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  return TRADE_QUALITIES.map((q) => {
    const list = trades.filter((t) => t.quality === q);
    const closed = list.filter((t) => t.profit_loss !== null);
    const wins = closed.filter((t) => (t.profit_loss ?? 0) > 0).length;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    const pcts = closed.map((t) => tradePct(t, accountMap)).filter((v): v is number => v != null);
    const avgPL = pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length : 0;
    return { quality: q, trades: list.length, winRate, avgPL };
  });
}

export function ruleStats(trades: Trade[], rules: TradingRule[]) {
  const totalRuleApplications = trades.length * Math.max(1, rules.length);
  const totalBroken = trades.reduce((s, t) => s + (t.broken_rules?.length ?? 0), 0);
  const followedPct = totalRuleApplications
    ? Math.max(0, Math.min(100, ((totalRuleApplications - totalBroken) / totalRuleApplications) * 100))
    : 100;
  const brokenPct = 100 - followedPct;

  const perRule = rules.map((r) => {
    const brokenCount = trades.filter((t) => (t.broken_rules ?? []).includes(r.id)).length;
    return { id: r.id, title: r.title, brokenCount, followedCount: trades.length - brokenCount };
  }).sort((a, b) => b.brokenCount - a.brokenCount);

  const mostBroken = perRule[0] ?? null;
  // Discipline = followed% weighted, penalize compounding breaks
  const discipline = Math.round(followedPct);

  return { followedPct, brokenPct, perRule, mostBroken, discipline, totalBroken };
}
