import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { computeStats, formatNumber, type Trade } from "@/lib/trade-utils";
import { TrendingUp, TrendingDown, Target, Percent, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "داشبورد | ژورنال کلاب" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trades", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false });
      if (error) throw error;
      return data as Trade[];
    },
  });

  const trades = data ?? [];
  const s = computeStats(trades);

  const cards = [
    { label: "تعداد کل معاملات", value: formatNumber(s.total, 0), Icon: Target, color: "text-chart-3" },
    { label: "نرخ برد", value: `${formatNumber(s.winRate, 1)}٪`, Icon: Percent, color: "text-primary" },
    { label: "میانگین R:R", value: formatNumber(s.avgRR, 2), Icon: TrendingUp, color: "text-warning" },
    {
      label: "سود/زیان کل",
      value: formatNumber(s.totalPL, 2),
      Icon: s.totalPL >= 0 ? TrendingUp : TrendingDown,
      color: s.totalPL >= 0 ? "text-primary" : "text-destructive",
    },
  ];

  return (
    <AppShell title="داشبورد">
      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ label, value, Icon, color }) => (
              <div key={label} className="gradient-card rounded-2xl border border-border/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div className={`text-2xl font-bold num ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 gradient-card rounded-2xl border border-border/60 p-5">
              <h3 className="font-semibold mb-4">عملکرد ماهانه</h3>
              {s.monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">هنوز داده‌ای وجود ندارد.</p>
              ) : (
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={s.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.025 252)" />
                      <XAxis dataKey="month" stroke="oklch(0.66 0.03 250)" fontSize={12} />
                      <YAxis stroke="oklch(0.66 0.03 250)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(0.21 0.025 252)",
                          border: "1px solid oklch(0.28 0.025 252)",
                          borderRadius: 8,
                          color: "oklch(0.96 0.01 250)",
                        }}
                      />
                      <Bar dataKey="pl" radius={[8, 8, 0, 0]}>
                        {s.monthly.map((m, i) => (
                          <Bar key={i} dataKey="pl" fill={m.pl >= 0 ? "oklch(0.72 0.17 165)" : "oklch(0.65 0.22 25)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="gradient-card rounded-2xl border border-border/60 p-5">
              <h3 className="font-semibold mb-4">خلاصه</h3>
              <div className="space-y-3 text-sm">
                <Row label="معاملات بسته شده" value={formatNumber(s.closed, 0)} />
                <Row label="معاملات برنده" value={formatNumber(s.wins, 0)} positive />
                <Row label="معاملات بازنده" value={formatNumber(s.losses, 0)} negative />
              </div>
              <Link to="/trades/new" className="mt-5 inline-flex items-center justify-center gap-2 w-full rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
                ثبت معامله جدید <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>

          <div className="gradient-card rounded-2xl border border-border/60 p-5">
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
                      <span className="font-medium">{t.asset_name}</span>
                      <span className="text-xs text-muted-foreground">{t.side === "buy" ? "خرید" : "فروش"}</span>
                    </div>
                    <span className={`num font-semibold ${(t.profit_loss ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                      {t.profit_loss === null ? "باز" : formatNumber(t.profit_loss, 2)}
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
