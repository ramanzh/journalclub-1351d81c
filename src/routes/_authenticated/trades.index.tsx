import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { formatDate, formatNumber, marketLabel, sideLabel, type Account, type Trade } from "@/lib/trade-utils";
import { PlusCircle, Loader2, MoreVertical, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trades/")({
  head: () => ({ meta: [{ title: "معاملات | ژورنال کلاب" }] }),
  component: TradesPage,
});

function TradesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [starred, setStarred] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem("starred_trades");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });

  const tradesQ = useQuery({
    queryKey: ["trades", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("trade_date", { ascending: false });
      if (error) throw error;
      return data as Trade[];
    },
  });
  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return data as Account[];
    },
  });

  const trades = tradesQ.data ?? [];
  const accMap = new Map((accountsQ.data ?? []).map((a) => [a.id, a]));

  // معاملات مهم بالا، بقیه پایین
  const sorted = [
    ...trades.filter((t) => starred.has(t.id)),
    ...trades.filter((t) => !starred.has(t.id)),
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("این معامله حذف شود؟")) return;
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    toast.success("معامله حذف شد");
    qc.invalidateQueries({ queryKey: ["trades"] });
    setMenuOpen(null);
  };

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("starred_trades", JSON.stringify([...next]));
      return next;
    });
    setMenuOpen(null);
  };

  return (
    <AppShell title="معاملات">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{formatNumber(trades.length, 0)} معامله ثبت شده</p>
        <Link to="/trades/new" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <PlusCircle className="size-4" /> معامله جدید
        </Link>
      </div>

      {tradesQ.isLoading ? (
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
                  <th className="px-4 py-3 font-medium text-right w-8"></th>
                  <th className="px-4 py-3 font-medium text-right">ارز</th>
                  <th className="px-4 py-3 font-medium text-right">بازار</th>
                  <th className="px-4 py-3 font-medium text-right">جهت</th>
                  <th className="px-4 py-3 font-medium text-right">حساب</th>
                  <th className="px-4 py-3 font-medium text-right">ورود</th>
                  <th className="px-4 py-3 font-medium text-right">خروج</th>
                  <th className="px-4 py-3 font-medium text-right">ریسک</th>
                  <th className="px-4 py-3 font-medium text-right">تاریخ</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-t border-border/40 hover:bg-accent/30 transition cursor-pointer ${starred.has(t.id) ? "bg-primary/5" : ""}`}
                  >
                    {/* ستاره مهم */}
                    <td className="px-2 py-3 w-8">
                      {starred.has(t.id) && (
                        <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                      )}
                    </td>

                    <td className="px-4 py-3 font-semibold" dir="ltr"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {t.asset_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {marketLabel[t.market]}
                    </td>
                    <td className="px-4 py-3"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      <Badge
                        variant={t.side === "buy" ? "default" : "destructive"}
                        className={t.side === "buy" ? "bg-primary/15 text-primary border-primary/30" : ""}
                      >
                        {sideLabel[t.side]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {t.account_id ? accMap.get(t.account_id)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 num"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {formatNumber(t.entry_price, 4)}
                    </td>
                    <td className="px-4 py-3 num"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {t.exit_price === null ? "—" : formatNumber(t.exit_price, 4)}
                    </td>
                    <td className="px-4 py-3 num text-muted-foreground"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {t.risk_percent === null || t.risk_percent === undefined
                        ? "—"
                        : `${formatNumber(t.risk_percent, 2)}٪`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap"
                      onClick={() => navigate({ to: "/trades/$id", params: { id: t.id } })}>
                      {formatDate(t.trade_date)}
                    </td>

                    {/* منوی سه نقطه */}
                    <td className="px-2 py-3 w-8 relative">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                        className="p-1 rounded hover:bg-accent/50 transition"
                      >
                        <MoreVertical className="size-4 text-muted-foreground" />
                      </button>

                      {menuOpen === t.id && (
                        <div className="absolute left-0 top-8 z-50 bg-background border border-border/60 rounded-xl shadow-xl overflow-hidden w-44"
                          onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleStar(t.id)}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-accent/40 transition text-right"
                          >
                            <Star className={`size-4 ${starred.has(t.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            {starred.has(t.id) ? "حذف از مهم‌ها" : "افزودن به مهم‌ها"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition text-right"
                          >
                            <Trash2 className="size-4" />
                            حذف معامله
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* بستن منو با کلیک بیرون */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
      )}
    </AppShell>
  );
}
