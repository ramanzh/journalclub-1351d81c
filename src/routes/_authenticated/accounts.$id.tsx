import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { accountStats, accountTypeLabel, buildEquityCurve, formatPercent, type Account, type Trade } from "@/lib/trade-utils";
import { EquityCurve } from "@/components/equity-curve";
import { CountUp } from "@/components/count-up";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  head: () => ({ meta: [{ title: "حساب | ژورنال کلاب" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const accountQ = useQuery({
    queryKey: ["account", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Account | null;
    },
  });
  const tradesQ = useQuery({
    queryKey: ["trades", "account", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").eq("account_id", id).order("trade_date", { ascending: false });
      if (error) throw error;
      return data as Trade[];
    },
  });

  if (accountQ.isLoading) return <AppShell title="حساب"><Loader2 className="size-6 animate-spin text-primary mx-auto my-12" /></AppShell>;
  const account = accountQ.data;
  if (!account) return <AppShell title="حساب"><p className="text-muted-foreground">حساب پیدا نشد.</p></AppShell>;

  const trades = tradesQ.data ?? [];
  const s = accountStats(account, trades);
  const curve = buildEquityCurve(trades, account.initial_balance);

  const handleDelete = async () => {
    if (!confirm("حذف این حساب؟ معاملات بدون حساب باقی می‌مانند.")) return;
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    qc.invalidateQueries({ queryKey: ["accounts"] });
    navigate({ to: "/accounts" });
  };

  return (
    <AppShell title={account.name}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{accountTypeLabel[account.account_type]}{account.broker ? ` • ${account.broker}` : ""}</p>
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
          <Trash2 className="size-4 ml-2" /> حذف
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="موجودی فعلی" value={s.currentBalance} decimals={2} />
        <Stat label="موجودی اولیه" value={s.initialBalance} decimals={2} />
        <Stat label="نرخ برد" value={s.winRate} decimals={1} suffix="٪" />
        <Stat label="تعداد معاملات" value={s.total} decimals={0} />
        <Stat label="میانگین ریسک" value={s.avgRisk} decimals={2} suffix="٪" />
        <Stat label="ثبات ریسک" value={s.riskConsistency} decimals={0} suffix="٪" />
        <Stat label="انضباط ریسک" value={s.riskDiscipline} decimals={0} suffix="٪" />
        <Stat label="معاملات بسته" value={s.closed} decimals={0} />
      </div>

      <div className="gradient-card rounded-2xl border border-border/60 p-5 mb-6">
        <h3 className="font-semibold mb-4">نمودار اکوییتی</h3>
        <EquityCurve data={curve} />
      </div>

      <div className="gradient-card rounded-2xl border border-border/60 p-5">
        <h3 className="font-semibold mb-4">معاملات حساب</h3>
        {trades.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">هنوز معامله‌ای در این حساب نیست.</p>
        ) : (
          <div className="space-y-2">
            {trades.map((t) => (
              <Link key={t.id} to="/trades/$id" params={{ id: t.id }}
                className="flex items-center justify-between rounded-lg border border-border/40 p-3 hover:bg-accent/40 transition">
                <div className="flex items-center gap-3">
                  <span className={`size-2 rounded-full ${t.side === "buy" ? "bg-primary" : "bg-destructive"}`} />
                  <span className="font-medium" dir="ltr">{t.asset_name}</span>
                </div>
                <span className="num font-semibold text-muted-foreground text-xs">
                  {t.risk_percent === null || t.risk_percent === undefined ? "—" : `ریسک ${formatPercent(t.risk_percent)}`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, decimals, suffix, colored }: { label: string; value: number; decimals: number; suffix?: string; colored?: boolean }) {
  const color = colored ? (value >= 0 ? "text-primary" : "text-destructive") : "text-foreground";
  return (
    <div className="gradient-card rounded-2xl border border-border/60 p-4">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className={`text-xl font-bold num ${color}`}>
        <CountUp value={value} decimals={decimals} suffix={suffix ?? ""} />
      </div>
    </div>
  );
}
