import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { ensureDefaultsSeeded } from "@/lib/seed-defaults";
import {
  setupStats, sessionStats, emotionStats, checklistStats,
  qualityStats, ruleStats,
  formatNumber, formatPercent,
  type Account, type ChecklistItem, type Trade, type TradingRule,
} from "@/lib/trade-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "تحلیل پیشرفته | ژورنال کلاب" }] }),
  component: AnalyticsPage,
});

const BAR_COLOR = "#1D9E75";
const BAR_COLOR_2 = "#60a5fa";
const MUTED = "rgba(255,255,255,0.4)";
const GRID = "rgba(255,255,255,0.06)";

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

function AnalyticsPage() {
  const { user } = useAuth();
  useEffect(() => { if (user) ensureDefaultsSeeded(user.id).catch(() => {}); }, [user]);

  const tradesQ = useQuery({
    queryKey: ["trades", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    enabled: !!user,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
    enabled: !!user,
  });
  const checklistQ = useQuery({
    queryKey: ["checklist_items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("checklist_items").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
    enabled: !!user,
  });
  const rulesQ = useQuery({
    queryKey: ["trading_rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trading_rules").select("*");
      if (error) throw error;
      return (data ?? []) as TradingRule[];
    },
    enabled: !!user,
  });

  const trades = tradesQ.data ?? [];
  const accounts = accountsQ.data ?? [];
  const items = checklistQ.data ?? [];
  const rules = rulesQ.data ?? [];
  const loading = tradesQ.isLoading || accountsQ.isLoading || checklistQ.isLoading || rulesQ.isLoading;

  const setups  = useMemo(() => setupStats(trades, accounts), [trades, accounts]);
  const sessions = useMemo(() => sessionStats(trades, accounts), [trades, accounts]);
  const emoB   = useMemo(() => emotionStats(trades, "before"), [trades]);
  const emoA   = useMemo(() => emotionStats(trades, "after"), [trades]);
  const chk    = useMemo(() => checklistStats(trades, items), [trades, items]);
  const qual   = useMemo(() => qualityStats(trades, accounts), [trades, accounts]);
  const rs     = useMemo(() => ruleStats(trades, rules), [trades, rules]);

  if (loading) {
    return (
      <AppShell title="تحلیل پیشرفته">
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="تحلیل پیشرفته">
      <Tabs defaultValue="setups">
        <div className="flex justify-end">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="setups">ستاپ‌ها</TabsTrigger>
            <TabsTrigger value="sessions">سشن‌ها</TabsTrigger>
            <TabsTrigger value="psych">روان‌شناسی</TabsTrigger>
            <TabsTrigger value="checklist">چک‌لیست</TabsTrigger>
            <TabsTrigger value="quality">کیفیت</TabsTrigger>
            <TabsTrigger value="rules">قوانین</TabsTrigger>
          </TabsList>
        </div>

        {/* ستاپ‌ها */}
        <TabsContent value="setups" className="mt-4 space-y-4">
          <Card title="عملکرد ستاپ‌ها (نرخ برد)">
            {setups.length === 0 ? <Empty /> : (
              <Chart>
                <BarChart
                  data={setups.map((s) => ({ name: s.name, winRate: +s.winRate.toFixed(1) }))}
                  barSize={36}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v}٪`, "نرخ برد"]}
                  />
                  <Bar dataKey="winRate" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {setups.map((_, i) => <Cell key={i} fill={BAR_COLOR} />)}
                  </Bar>
                </BarChart>
              </Chart>
            )}
          </Card>
          <Card title="رتبه‌بندی ستاپ‌ها">
            <Table
              head={["ستاپ", "تعداد", "نرخ برد", "میانگین سود", "میانگین ریسک"]}
              rows={setups.map((s) => [
                s.name,
                formatNumber(s.trades, 0),
                formatPercent(s.winRate, 1),
                formatPercent(s.avgPL),
                formatPercent(s.avgRisk),
              ])}
            />
          </Card>
        </TabsContent>

        {/* سشن‌ها */}
        <TabsContent value="sessions" className="mt-4 space-y-4">
          <Card title="مقایسه سشن‌های معاملاتی">
            <Chart>
              <BarChart
                data={sessions.map((s) => ({
                  name: s.label,
                  winRate: +s.winRate.toFixed(1),
                  growth: +s.growth.toFixed(2),
                }))}
                barSize={28}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [
                    `${v}${name === "winRate" ? "٪" : ""}`,
                    name === "winRate" ? "نرخ برد" : "رشد",
                  ]}
                />
                <Bar dataKey="winRate" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="growth" fill={BAR_COLOR_2} radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </Chart>
          </Card>
          <Card title="آمار به‌تفکیک سشن">
            <Table
              head={["سشن", "تعداد", "نرخ برد", "میانگین ریسک", "رشد"]}
              rows={sessions.map((s) => [
                s.label,
                formatNumber(s.trades, 0),
                formatPercent(s.winRate, 1),
                formatPercent(s.avgRisk),
                formatPercent(s.growth),
              ])}
            />
          </Card>
        </TabsContent>

        {/* روان‌شناسی */}
        <TabsContent value="psych" className="mt-4 space-y-4">
          <Card title="نرخ برد بر اساس احساس پیش از معامله">
            {emoB.length === 0 ? <Empty /> : (
              <Table
                head={["احساس", "تعداد", "نرخ برد", "نرخ باخت"]}
                rows={emoB.map((e) => [
                  e.label,
                  formatNumber(e.count, 0),
                  formatPercent(e.winRate, 1),
                  formatPercent(e.lossRate, 1),
                ])}
              />
            )}
          </Card>
          <Card title="نرخ برد بر اساس احساس پس از معامله">
            {emoA.length === 0 ? <Empty /> : (
              <Table
                head={["احساس", "تعداد", "نرخ برد", "نرخ باخت"]}
                rows={emoA.map((e) => [
                  e.label,
                  formatNumber(e.count, 0),
                  formatPercent(e.winRate, 1),
                  formatPercent(e.lossRate, 1),
                ])}
              />
            )}
          </Card>
        </TabsContent>

        {/* چک‌لیست */}
        <TabsContent value="checklist" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Stat label="نرخ برد با چک‌لیست کامل" value={formatPercent(chk.fullWinRate, 1)} sub={`${chk.fullCount} معامله`} positive />
            <Stat label="نرخ برد بدون چک‌لیست کامل" value={formatPercent(chk.partialWinRate, 1)} sub={`${chk.partialCount} معامله`} negative />
            <Stat label="امتیاز انضباط چک‌لیست" value={formatPercent(chk.discipline, 0)} />
          </div>
          <Card title="مواردی که بیشتر نادیده گرفته شده‌اند">
            <Table
              head={["مورد", "دفعات نادیده‌گرفتن"]}
              rows={chk.mostIgnored.map((i) => [i.label, formatNumber(i.ignoredCount, 0)])}
            />
          </Card>
        </TabsContent>

        {/* کیفیت */}
        <TabsContent value="quality" className="mt-4 space-y-4">
          <Card title="نرخ برد بر اساس کیفیت معامله">
            <Chart>
              <BarChart
                data={qual.map((q) => ({ name: q.quality, winRate: +q.winRate.toFixed(1) }))}
                barSize={36}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v}٪`, "نرخ برد"]}
                />
                <Bar dataKey="winRate" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {qual.map((_, i) => <Cell key={i} fill={BAR_COLOR} />)}
                </Bar>
              </BarChart>
            </Chart>
          </Card>
          <Card title="عملکرد به‌تفکیک کیفیت">
            <Table
              head={["کیفیت", "تعداد", "نرخ برد", "میانگین سود"]}
              rows={qual.map((q) => [
                q.quality,
                formatNumber(q.trades, 0),
                formatPercent(q.winRate, 1),
                formatPercent(q.avgPL),
              ])}
            />
          </Card>
        </TabsContent>

        {/* قوانین */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Stat label="امتیاز انضباط" value={`${rs.discipline}/۱۰۰`} positive />
            <Stat label="قوانین رعایت‌شده" value={formatPercent(rs.followedPct, 0)} positive />
            <Stat label="قوانین نقض‌شده" value={formatPercent(rs.brokenPct, 0)} negative />
          </div>
          <Card title="آمار به‌تفکیک قانون">
            <Table
              head={["قانون", "تعداد نقض", "تعداد رعایت"]}
              rows={rs.perRule.map((p) => [
                p.title,
                formatNumber(p.brokenCount, 0),
                formatNumber(p.followedCount, 0),
              ])}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gradient-card rounded-2xl border border-border/60 p-5">
      <h3 className="font-semibold mb-4 text-right">{title}</h3>
      {children}
    </div>
  );
}

function Chart({ children }: { children: React.ReactElement }) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground py-8 text-center">داده‌ای برای نمایش وجود ندارد.</p>;
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border/40">
            {head.map((h) => (
              <th key={h} className="text-right py-2.5 px-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/20 hover:bg-accent/20 transition">
              {r.map((c, j) => (
                <td key={j} className={`py-2.5 px-3 ${j === 0 ? "font-medium text-right" : "num text-right"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, sub, positive, negative }: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="gradient-card rounded-2xl border border-border/60 p-5 text-right">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className={`text-2xl font-bold num ${positive ? "text-primary" : negative ? "text-destructive" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
