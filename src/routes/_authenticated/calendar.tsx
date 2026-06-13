import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatNumber, formatPercent, marketLabel, type Account, type Trade } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "تقویم معاملات | ژورنال کلاب" }] }),
  component: CalendarPage,
});

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string | null>(null);
  const [accFilter, setAccFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [setupFilter, setSetupFilter] = useState<string>("all");

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

  const trades = tradesQ.data ?? [];
  const accounts = accountsQ.data ?? [];

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (accFilter !== "all" && t.account_id !== accFilter) return false;
      if (marketFilter !== "all" && t.market !== marketFilter) return false;
      if (setupFilter !== "all" && !(t.setup_tags ?? []).includes(setupFilter)) return false;
      return true;
    });
  }, [trades, accFilter, marketFilter, setupFilter]);

  const allSetups = useMemo(() => {
    const s = new Set<string>();
    trades.forEach((t) => (t.setup_tags ?? []).forEach((x) => s.add(x)));
    return [...s];
  }, [trades]);

  const byDay = useMemo(() => {
    const map = new Map<string, Trade[]>();
    for (const t of filtered) {
      const k = dayKey(new Date(t.trade_date));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return map;
  }, [filtered]);

  // grid: start from Saturday on/before the 1st (Persian week)
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    // JS getDay: Sun=0 ... Sat=6. Persian week starts Saturday.
    const offset = (first.getDay() + 1) % 7; // Sat→0, Sun→1...
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(cursor);

  const dayPL = (d: Date) => (byDay.get(dayKey(d)) ?? []).reduce((s, t) => s + (t.profit_loss ?? 0), 0);
  const dayPctSum = (d: Date) => (byDay.get(dayKey(d)) ?? []).reduce((s, t) => s + (t.profit_loss_percent ?? 0), 0);

  const selectedTrades = selected ? byDay.get(selected) ?? [] : [];
  const selectedPL = selectedTrades.reduce((s, t) => s + (t.profit_loss ?? 0), 0);
  const selectedPct = selectedTrades.reduce((s, t) => s + (t.profit_loss_percent ?? 0), 0);

  if (tradesQ.isLoading || accountsQ.isLoading) {
    return <AppShell title="تقویم معاملات"><div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div></AppShell>;
  }

  return (
    <AppShell title="تقویم معاملات">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronRight className="size-4" /></Button>
            <div className="px-3 py-1.5 rounded-lg border border-border/50 text-sm font-semibold min-w-40 text-center">{monthLabel}</div>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronLeft className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>امروز</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={accFilter} onValueChange={setAccFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="حساب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه حساب‌ها</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="بازار" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه بازارها</SelectItem>
                <SelectItem value="forex">فارکس</SelectItem>
                <SelectItem value="crypto">کریپتو</SelectItem>
                <SelectItem value="stock">سهام</SelectItem>
              </SelectContent>
            </Select>
            <Select value={setupFilter} onValueChange={setSetupFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="ستاپ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه ستاپ‌ها</SelectItem>
                {allSetups.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="gradient-card rounded-2xl border border-border/60 p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w) => <div key={w} className="text-xs text-muted-foreground text-center py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              const k = dayKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const trades = byDay.get(k) ?? [];
              const pl = dayPL(d);
              const tone = trades.length === 0
                ? "bg-muted/20 text-muted-foreground"
                : pl > 0 ? "bg-primary/15 border-primary/40 text-primary"
                : pl < 0 ? "bg-destructive/15 border-destructive/40 text-destructive"
                : "bg-muted/30";
              const isSelected = selected === k;
              return (
                <button key={i} type="button" onClick={() => setSelected(k)}
                  className={`aspect-square rounded-lg border border-border/30 p-1.5 text-right transition hover:opacity-80 ${tone} ${!inMonth ? "opacity-40" : ""} ${isSelected ? "ring-2 ring-primary" : ""}`}>
                  <div className="text-xs num">{new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(d)}</div>
                  {trades.length > 0 && (
                    <div className="mt-1 text-[10px] font-semibold num">
                      {trades.length} معامله
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="gradient-card rounded-2xl border border-border/60 p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(new Date(selected))}</h3>
              <div className="text-sm flex gap-4">
                <span className={selectedPL > 0 ? "text-primary" : selectedPL < 0 ? "text-destructive" : ""}>
                  مجموع: {formatPercent(selectedPct)}
                </span>
                <span className="text-muted-foreground">{formatNumber(selectedTrades.length, 0)} معامله</span>
              </div>
            </div>
            {selectedTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">معامله‌ای ثبت نشده.</p>
            ) : (
              <div className="space-y-2">
                {selectedTrades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`size-2 rounded-full ${t.side === "buy" ? "bg-primary" : "bg-destructive"}`} />
                      <span className="font-medium" dir="ltr">{t.asset_name}</span>
                      <span className="text-xs text-muted-foreground">{marketLabel[t.market]}</span>
                      {(t.setup_tags ?? []).slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/40">{s}</span>
                      ))}
                    </div>
                    <span className={`num ${(t.profit_loss ?? 0) > 0 ? "text-primary" : (t.profit_loss ?? 0) < 0 ? "text-destructive" : ""}`}>
                      {formatPercent(t.profit_loss_percent)}
                    </span>
                  </div>
                ))}
                {selectedTrades.some((t) => t.notes) && (
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                    <div className="text-xs text-muted-foreground">یادداشت‌ها:</div>
                    {selectedTrades.filter((t) => t.notes).map((t) => (
                      <div key={t.id} className="text-xs text-muted-foreground">• {t.notes}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
