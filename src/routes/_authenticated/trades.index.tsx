import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { formatDate, formatNumber, marketLabel, sideLabel, type Trade } from "@/lib/trade-utils";
import { PlusCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/trades/")({
  head: () => ({ meta: [{ title: "معاملات | ژورنال کلاب" }] }),
  component: TradesPage,
});

function TradesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["trades", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("trade_date", { ascending: false });
      if (error) throw error;
      return data as Trade[];
    },
  });

  const trades = data ?? [];

  return (
    <AppShell title="معاملات">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{formatNumber(trades.length, 0)} معامله ثبت شده</p>
        <Link to="/trades/new" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <PlusCircle className="size-4" /> معامله جدید
        </Link>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : trades.length === 0 ? (
        <div className="gradient-card rounded-2xl border border-border/60 p-12 text-center">
          <p className="text-muted-foreground mb-4">هنوز معامله‌ای ندارید.</p>
          <Link to="/trades/new" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            ثبت اولین معامله
          </Link>
        </div>
      ) : (
        <div className="gradient-card rounded-2xl border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium text-right">دارایی</th>
                  <th className="px-4 py-3 font-medium text-right">بازار</th>
                  <th className="px-4 py-3 font-medium text-right">جهت</th>
                  <th className="px-4 py-3 font-medium text-right">ورود</th>
                  <th className="px-4 py-3 font-medium text-right">خروج</th>
                  <th className="px-4 py-3 font-medium text-right">سود/زیان</th>
                  <th className="px-4 py-3 font-medium text-right">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}
                    className="border-t border-border/40 hover:bg-accent/30 transition cursor-pointer"
                  >
                    <td className="px-4 py-3 font-semibold">{t.asset_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{marketLabel[t.market]}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={t.side === "buy" ? "default" : "destructive"}
                        className={t.side === "buy" ? "bg-primary/15 text-primary border-primary/30" : ""}
                      >
                        {sideLabel[t.side]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 num">{formatNumber(t.entry_price, 4)}</td>
                    <td className="px-4 py-3 num">{t.exit_price === null ? "—" : formatNumber(t.exit_price, 4)}</td>
                    <td
                      className={`px-4 py-3 num font-semibold ${
                        t.profit_loss === null
                          ? "text-muted-foreground"
                          : (t.profit_loss ?? 0) >= 0
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {t.profit_loss === null ? "باز" : formatNumber(t.profit_loss, 2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(t.trade_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
