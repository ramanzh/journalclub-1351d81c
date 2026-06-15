import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { buildEquityCurve, computeStats, formatNumber, type Account, type Trade } from "@/lib/trade-utils";
import { Target, Percent, ArrowLeft, Loader2, ShieldCheck, Activity, Gauge } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { EquityCurve } from "@/components/equity-curve";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "داشبورد | ژورنال کلاب" }] }),
  component: DashboardPage,
});

type Filter = "demo" | "prop" | "real" | string;

// فرمت درصد بدون مثبت
function fPct(n: number | null | undefined, frac = 1) {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  return `${formatNumber(n, frac)}٪`;
}

function DashboardPage() {
  const tradesQ = useQuery({
    queryKey: ["trades", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("trade_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    retry: 1,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
    retry: 1,
  });

  const trades = tradesQ.data ?? [];
  const accounts = accountsQ.data ?? [];
  const isLoading = tradesQ.isLoading || accountsQ.isLoading;
  const s = computeStats(trades, accounts);

  const [filter, setFilter] = useState<Filter>("");

  useEffect(() => {
    if (accounts.length > 0 && filter === "") {
      setFilter(accounts[0].id);
    }
  }, [accounts]);

  const { curve } = useMemo(() => {
    let selectedAccounts: Account[] = accounts;
    if (filter === "demo" || filter === "prop" || filter === "real") {
      selectedAccounts = accounts.filter((a) => a.account_type === filter);
    } else if (filter !== "") {
      selectedAccounts = accounts.filter((a) => a.id === filter);
    }
    const ids = new Set(selectedAccounts.map((a) => a.id));
    const scopedTrades = trades.filter((t) => t.account_id && ids.has(t.account_id));
    const initial = selectedAccounts.reduce((sum, a) => sum + Number(a.initial_balance || 0), 0);
    return { curve: buildEquityCurve(scopedTrades, initial) };
  }, [filter, trades, accounts]);

  const cards = [
    { label: "تعداد کل معاملات", value: s.total, decimals: 0, Icon: Target, color: "text-foreground" },
    { label: "نرخ برد", value: s.winRate, decimals: 1, suffix: "٪", Icon: Percent, color: "text-primary" },
    { label: "میانگین ریسک", value: s.avgRisk, decimals: 2, suffix: "٪", Icon: Activity, color: "text-foreground" },
    { label: "ثبات ریسک", value: s.riskConsistency, decimals: 0, suffix: "٪", Icon: Gauge, color: s.riskConsistency >= 70 ? "text-primary" : s.riskConsistency >= 40 ? "text-foreground" : "text-destructive" },
    // ✅ انضباط قوانین به جای انضباط ریسک
    { label: "انضباط قوانین", value: s.riskDiscipline, decimals: 0, suffix: "٪", Icon: ShieldCheck, color: s.riskDiscipline >= 70 ? "text-primary" : s.riskDiscipline >= 40 ? "text-foreground" : "text-destructive" },
  ];

  return (
    <AppShell title="داشبورد">
      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map(({ label, value, decimals, suffix, Icon, color }, i) => (
              <div
                key={label}
                className="gradient-card rounded-2xl border border-border/60 p-5 animate-fade-in opacity-0"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div className={`text-2xl font-bold num ${color}`}>
                  <CountUp value={value} decimals={decimals} suffix={suffix ?? ""} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 gradient-card rounded-2xl border border-border/60 p-5 animate-fade-in opacity-0"
              style={{ animationDelay: "320ms", animationFillMode: "forwards" }}>
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-semibold">نمودار اکوییتی</h3>
                <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="انتخاب حساب" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">حساب‌های دمو</SelectItem>
                    <SelectItem value="prop">حساب‌های پراپ</SelectItem>
                    <SelectItem value="real">حساب‌های واقعی</SelectItem>
                    {accounts.length > 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1 pt-2">— حساب‌های من —</div>
                    )}
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <EquityCurve data={curve} />
            </div>

            <div className="gradient-card rounded-2xl border border-border/60 p-5 animate-fade-in opacity-0"
              style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
              <h3 className="font-semibold mb-4">خلاصه</h3>
              <div className="space-y-3 text-sm">
                <Row label="حساب‌ها" value={formatNumber(accounts.length, 0)} />
                <Row label="معاملات بسته" value={formatNumber(s.closed, 0)} />
                <Row label="برنده" value={formatNumber(s.wins, 0)} positive />
                <Row label="بازنده" value={formatNumber(s.losses, 0)} negative />
                {/* ✅ میانگین R:R حذف شد */}
                {/* ✅ میانگین ریسک بدون مثبت */}
                <Row label="میانگین ریسک" value={fPct(s.avgRisk)} />
              </div>
              <Link to="/trades/new" className="mt-5 inline-flex items-center justify-center gap-2 w-full rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
                ثبت معامله جدید <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>

          <div className="gradient-card rounded-2xl border border-border/60 p-5 animate-fade-in opacity-0"
            style={{ animationDelay: "480ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">آخرین معاملات</h3>
              <Link to="/trades" className="text-xs text-primary hover:underline">مشاهده همه</Link>
            </div>
            {trades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">هنوز معامله‌ای ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {trades.slice(0, 5).map((t) => (
                  <Link key={t.id} to="/trades/$id" params={{ id: t.id }}
                    className="flex items-center justify-between rounded-lg border border-border/40 p-3 hover:bg-accent/40 transition">
                    <div className="flex items-center gap-3">
                      <span className={`size-2 rounded-full ${t.side === "buy" ? "bg-primary" : "bg-destructive"}`} />
                      <span className="font-medium" dir="ltr">{t.asset_name}</span>
                      <span className="text-xs text-muted-foreground">{t.side === "buy" ? "خرید" : "فروش"}</span>
                    </div>
                    {/* ✅ بدون مثبت کنار درصد ریسک */}
                    <span className="text-xs text-muted-foreground num">
                      {t.risk_percent !== null && t.risk_percent !== undefined
                        ? `ریسک ${formatNumber(t.risk_percent, 2)}٪`
                        : "—"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`num font-semibold ${positive ? "text-primary" : negative ? "text-destructive" : ""}`}>{value}</span>
    </div>
  );
}
