import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, Info, ChevronDown, PlusCircle } from "lucide-react";
import { formatNumber, formatPercent, marketLabel, type Account, type Trade } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "تقویم معاملات | ژورنال کلاب" }] }),
  component: CalendarPage,
});

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

// تعطیلات فارکس (ماه/روز) — میلادی
const FOREX_HOLIDAYS_2024_2025: string[] = [
  "2024-01-01", "2024-03-29", "2024-04-01", "2024-05-27",
  "2024-06-19", "2024-07-04", "2024-09-02", "2024-11-28",
  "2024-12-25",
  "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-26",
  "2025-06-19", "2025-07-04", "2025-09-01", "2025-11-27",
  "2025-12-25",
];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6; // شنبه و یکشنبه
}

function isForexHoliday(d: Date) {
  return FOREX_HOLIDAYS_2024_2025.includes(dayKey(d));
}

function isMarketClosed(d: Date) {
  return isWeekend(d) || isForexHoliday(d);
}

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function CalendarPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string | null>(null);
  const [accFilter, setAccFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

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
      return true;
    });
  }, [trades, accFilter, marketFilter]);

  const byDay = useMemo(() => {
    const map = new Map<string, Trade[]>();
    for (const t of filtered) {
      const k = dayKey(new Date(t.trade_date));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return map;
  }, [filtered]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 1) % 7;
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

  const dayPctSum = (d: Date) => (byDay.get(dayKey(d)) ?? []).reduce((s, t) => s + (t.profit_loss_percent ?? 0), 0);

  const selectedTrades = selected ? byDay.get(selected) ?? [] : [];
  const selectedPL = selectedTrades.reduce((s, t) => s + (t.profit_loss ?? 0), 0);
  const selectedPct = selectedTrades.reduce((s, t) => s + (t.profit_loss_percent ?? 0), 0);

  // تون رنگی سلول
  const cellTone = (d: Date) => {
    const k = dayKey(d);
    const dayTrades = byDay.get(k) ?? [];
    const closed = dayTrades.filter((t) => t.profit_loss !== null);

    if (isMarketClosed(d)) return "market-closed";
    if (dayTrades.length === 0) return "empty";

    // اگه همه حساب‌ها انتخاب شده، بی‌رنگ
    if (accFilter === "all") return "neutral";

    const pct = dayPctSum(d);
    if (pct > 0) return "win";
    if (pct < 0) return "loss";
    return "neutral";
  };

  if (tradesQ.isLoading || accountsQ.isLoading) {
    return <AppShell title="تقویم معاملات"><div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div></AppShell>;
  }

  return (
    <AppShell title="تقویم معاملات">
      <div className="space-y-4">

        {/* توضیحات */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="size-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            هر روز معاملاتی را در یک نگاه ببینید. روی هر روز کلیک کنید تا جزئیات معاملات آن روز نمایش داده شود.
            رنگ‌بندی سبز/قرمز فقط در حالت فیلتر یک حساب خاص فعال است.
            روزهای تعطیل بازار فارکس با پس‌زمینه متفاوت مشخص شده‌اند.
          </p>
        </div>

        {/* کنترل‌ها */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 relative">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronRight className="size-4" />
            </Button>

            {/* کلیک روی ماه/سال */}
            <button
              type="button"
              onClick={() => { setShowMonthPicker((p) => !p); setPickerYear(cursor.getFullYear()); }}
              className="px-3 py-1.5 rounded-lg border border-border/50 text-sm font-semibold min-w-40 text-center flex items-center justify-center gap-1 hover:border-primary/50 transition"
            >
              {monthLabel}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>

            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>امروز</Button>

            {/* پیکر ماه/سال */}
            {showMonthPicker && (
              <div className="absolute top-12 right-0 z-50 bg-background border border-border/60 rounded-xl shadow-xl p-4 w-72">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setPickerYear((y) => y - 1)} className="p-1 hover:bg-accent rounded"><ChevronRight className="size-4" /></button>
                  <span className="text-sm font-semibold">{new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date(pickerYear, 0, 1))}</span>
                  <button type="button" onClick={() => setPickerYear((y) => y + 1)} className="p-1 hover:bg-accent rounded"><ChevronLeft className="size-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(pickerYear, i, 1);
                    const label = new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(d);
                    const active = cursor.getFullYear() === pickerYear && cursor.getMonth() === i;
                    return (
                      <button key={i} type="button"
                        onClick={() => { setCursor(new Date(pickerYear, i, 1)); setShowMonthPicker(false); }}
                        className={`py-1.5 rounded-lg text-xs transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
          </div>
        </div>

        {/* تقویم */}
        <div className="gradient-card rounded-2xl border border-border/60 p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-[11px] text-muted-foreground text-center py-1 font-medium">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              const k = dayKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const dayTrades = byDay.get(k) ?? [];
              const tone = cellTone(d);
              const isSelected = selected === k;
              const closed = isMarketClosed(d);
              const isToday = dayKey(d) === dayKey(new Date());

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : k)}
                  className={`
                    rounded-lg border p-1.5 text-right transition-all duration-150
                    ${closed
                      ? "bg-muted/10 border-border/10 cursor-default"
                      : tone === "win" ? "bg-primary/15 border-primary/30 hover:bg-primary/25"
                      : tone === "loss" ? "bg-destructive/15 border-destructive/30 hover:bg-destructive/25"
                      : tone === "neutral" ? "bg-accent/20 border-border/30 hover:bg-accent/40"
                      : "bg-transparent border-border/20 hover:bg-accent/20"}
                    ${!inMonth ? "opacity-30" : ""}
                    ${isSelected ? "ring-2 ring-primary" : ""}
                    ${isToday ? "ring-1 ring-primary/50" : ""}
                  `}
                  style={{ minHeight: "52px" }}
                >
                  <div className={`text-[11px] num font-medium
                    ${tone === "win" ? "text-primary"
                    : tone === "loss" ? "text-destructive"
                    : closed ? "text-muted-foreground/40"
                    : "text-foreground/70"}`}>
                    {new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(d)}
                  </div>
                  {closed && (
                    <div className="text-[9px] text-muted-foreground/40 mt-0.5">تعطیل</div>
                  )}
                  {!closed && dayTrades.length > 0 && (
                    <>
                      <div className="text-[10px] font-semibold mt-0.5 num
                        ${tone === 'win' ? 'text-primary' : tone === 'loss' ? 'text-destructive' : 'text-foreground/80'}">
                        {dayTrades.length} معامله
                      </div>
                      {accFilter !== "all" && (
                        <div className={`text-[9px] num font-medium
                          ${tone === "win" ? "text-primary/80" : tone === "loss" ? "text-destructive/80" : "text-muted-foreground"}`}>
                          {formatPercent(dayPctSum(d))}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* راهنما */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="size-3 rounded bg-primary/20 border border-primary/30" /> سودده
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="size-3 rounded bg-destructive/20 border border-destructive/30" /> زیان‌ده
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="size-3 rounded bg-accent/30 border border-border/30" /> معامله بدون نتیجه
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="size-3 rounded bg-muted/10 border border-border/10" /> تعطیل بازار
            </div>
          </div>
        </div>

        {/* جزئیات روز انتخابی */}
        {selected && (
  <div className="gradient-card rounded-2xl border border-border/60 p-5 animate-fade-in">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(new Date(selected))}</h3>
      <div className="text-sm flex items-center gap-4">
        {accFilter !== "all" && (
          <span className={selectedPL > 0 ? "text-primary" : selectedPL < 0 ? "text-destructive" : ""}>
            مجموع: {formatPercent(selectedPct)}
          </span>
        )}
        <span className="text-muted-foreground">{formatNumber(selectedTrades.length, 0)} معامله</span>
        {/* دکمه معامله جدید — فقط برای روزهای گذشته */}
        {new Date(selected) < new Date(dayKey(new Date())) && (
          
            href={`/trades/new?date=${selected}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition"
          >
            <PlusCircle className="size-3.5" />
            معامله جدید
          </a>
        )}
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
