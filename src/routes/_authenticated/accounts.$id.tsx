import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import {
  accountStats,
  accountHealth,
  accountTypeLabel,
  buildEquityCurve,
  formatNumber,
  formatPercent,
  type Account,
  type AccountStatus,
  type Trade,
} from "@/lib/trade-utils";
import { EquityCurve } from "@/components/equity-curve";
import { CountUp } from "@/components/count-up";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trash2, Pencil, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AccountForm } from "./accounts.index";

// ترجمه اختصاصی و بهینه‌شده وضعیت‌های حساب برای نمایش روان در فرانت‌اند
const customAccountStatusLabel: Record<AccountStatus, string> = {
  active: "مرحله ۱ فعال",
  target1: "تارگت ۱ پاس شد (مرحله ۲ فعال)",
  target2: "چالش پاس شد 🎉",
  failed: "ناموفق (فیلد شده)",
};

const statusStyle: Record<AccountStatus, string> = {
  active: "bg-muted text-foreground border-border",
  target1: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  target2: "bg-primary/25 text-primary border-primary/40",
  failed: "bg-destructive/15 text-destructive border-destructive/40",
};

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  head: () => ({ meta: [{ title: "حساب | ژورنال کلاب" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

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
  const h = accountHealth(account, trades);
  const curve = buildEquityCurve(trades.filter((t) => t.account_id === account.id), account.initial_balance);
  const showRules = account.account_type !== "demo";

  // ✅ حساب زمانی قفل می‌شود که وضعیت خروجی از فرمول جدید ما رسماً "target2" شده باشد
  const isLocked = account.account_type === "prop" && h.status === "target2";

  const handleDelete = async () => {
    if (!confirm("حذف این حساب؟ معاملات بدون حساب باقی می‌مانند.")) return;
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    qc.invalidateQueries({ queryKey: ["accounts"] });
    navigate({ to: "/accounts" });
  };

  return (
    <AppShell title={account.name}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{accountTypeLabel[account.account_type]}{account.broker ? ` • ${account.broker}` : ""}</p>
          {showRules && (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle[h.status]}`}>
              {customAccountStatusLabel[h.status]}
            </span>
          )}
          {/* ✅ نشان قفل بودن حساب بعد از پاس شدن چالش */}
          {isLocked && (
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-semibold">
              🎯 چالش تکمیل شد — حساب قفل است
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4 ml-2" /> ویرایش
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
            <Trash2 className="size-4 ml-2" /> حذف
          </Button>
        </div>
      </div>

      {/* ✅ هشدار قفل بودن حساب */}
      {isLocked && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4 text-sm text-primary text-center">
          این حساب به تارگت نهایی رسیده و قفل شده است. برای ثبت معامله جدید باید حساب جدید بسازید.
        </div>
      )}

      {showRules && (h.drawdownLimit != null || account.daily_drawdown_limit != null || h.target != null) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {h.drawdownLimit != null && (
            <>
              <Stat label="حد ضرر استفاده‌شده" value={h.maxDrawdown} decimals={2} suffix="٪" />
              <Stat label="حد ضرر باقی‌مانده" value={h.drawdownRemaining ?? 0} decimals={2} suffix="٪" />
            </>
          )}
          {account.daily_drawdown_limit != null && (
            <Stat label="بیشترین حد ضرر روزانه" value={h.maxDailyDrawdown} decimals={2} suffix="٪" />
          )}
          {h.target != null && (
            <div className="gradient-card rounded-2xl border border-border/60 p-4">
              {/* ✅ نمایش هوشمند عنوان نوار پیشرفت بر اساس مرحله جاری چالش */}
              <div className="text-xs text-muted-foreground mb-2">
                {account.account_type === "prop" && h.status === "target1" 
                  ? `پیشرفت تارگت مرحله دو (${formatPercent(h.target, 0)})` 
                  : `پیشرفت تارگت مرحله یک (${formatPercent(h.target, 0)})`
                }
              </div>
              <div className="text-xl font-bold num mb-2">
                <CountUp value={h.targetProgress ?? 0} decimals={0} suffix="٪" />
              </div>
              <Progress value={h.targetProgress ?? 0} className="h-1.5" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="موجودی فعلی" value={h.currentBalance} decimals={2} />
        <Stat label="موجودی اولیه" value={s.initialBalance} decimals={2} />
        <Stat label="رشد کل حساب" value={h.growthPct} decimals={2} suffix="٪" colored />
        <Stat label="نرخ برد" value={s.winRate} decimals={1} suffix="٪" />
        <Stat label="تعداد معاملات" value={s.total} decimals={0} />
        <Stat label="میانگین ریسک" value={s.avgRisk} decimals={2} suffix="٪" />
        <Stat label="ثبات ریسک" value={s.riskConsistency} decimals={0} suffix="٪" />
        <Stat label="انضباط قوانین" value={s.riskDiscipline} decimals={0} suffix="٪" />
        <Stat label="معاملات بسته" value={s.closed} decimals={0} />
      </div>

      <div className="gradient-card rounded-2xl border border-border/60 p-5 mb-6">
        <h3 className="font-semibold mb-4">نمودار اکوییتی</h3>
        <EquityCurve data={curve} />
      </div>

      <div className="gradient-card rounded-2xl border border-border/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">معاملات حساب</h3>
          {!isLocked && (
            <Link to="/trades/new" className="text-xs text-primary hover:underline flex items-center gap-1">
              <LinkIcon className="size-3" /> معامله جدید
            </Link>
          )}
        </div>
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
                  {t.risk_percent === null || t.risk_percent === undefined ? "—" : `ریسک ${formatNumber(t.risk_percent, 2)}٪`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>ویرایش حساب</DialogTitle></DialogHeader>
          {user && (
            <AccountForm
              userId={user.id}
              initial={account}
              onDone={() => {
                setEditOpen(false);
                qc.invalidateQueries({ queryKey: ["account", id] });
                qc.invalidateQueries({ queryKey: ["accounts"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Stat({ label, value, decimals, suffix, colored }: {
  label: string;
  value: number;
  decimals: number;
  suffix?: string;
  colored?: boolean;
}) {
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
