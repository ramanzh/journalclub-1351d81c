import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import {
  accountHealth,
  accountStatusLabel,
  accountTypeLabel,
  formatNumber,
  formatPercent,
  type Account,
  type AccountStatus,
  type Trade,
} from "@/lib/trade-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Wallet, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts/")({
  head: () => ({ meta: [{ title: "حساب‌ها | ژورنال کلاب" }] }),
  component: AccountsPage,
});

const statusStyle: Record<AccountStatus, string> = {
  active: "bg-muted text-foreground border-border",
  target1: "bg-primary/15 text-primary border-primary/30",
  target2: "bg-primary/25 text-primary border-primary/40",
  failed: "bg-destructive/15 text-destructive border-destructive/40",
};

function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const accountsQ = useQuery({
    enabled: !!user,
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
    retry: 1,
  });
  const tradesQ = useQuery({
    enabled: !!user,
    queryKey: ["trades", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    retry: 1,
  });

  const accounts = accountsQ.data ?? [];
  const trades = tradesQ.data ?? [];
  const loadError = accountsQ.error || tradesQ.error;
  const isLoading = authLoading || accountsQ.isLoading || tradesQ.isLoading;

  return (
    <AppShell title="حساب‌ها">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{formatNumber(accounts.length, 0)} حساب</p>
        <Dialog open={open} onOpenChange={(v) => { if (v && !user) return; setOpen(v); }}>
          <DialogTrigger asChild>
            <Button disabled={!user} className="gradient-primary text-primary-foreground gap-2">
              <Plus className="size-4" /> حساب جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>افزودن حساب جدید</DialogTitle></DialogHeader>
            {user && (
              <AccountForm
                userId={user.id}
                onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["accounts"] }); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : loadError ? (
        <div className="gradient-card rounded-2xl border border-destructive/40 p-8 text-center space-y-3">
          <p className="text-destructive font-semibold">خطا در بارگذاری حساب‌ها</p>
          <Button onClick={() => { accountsQ.refetch(); tradesQ.refetch(); }} variant="outline" size="sm">تلاش دوباره</Button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="gradient-card rounded-2xl border border-border/60 p-12 text-center">
          <Wallet className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">هنوز حسابی نساخته‌اید.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const h = accountHealth(a, trades);
            const showStatus = a.account_type !== "demo";
            return (
              <Link key={a.id} to="/accounts/$id" params={{ id: a.id }}
                className="gradient-card rounded-2xl border border-border/60 p-5 hover:border-primary/40 transition group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{a.name}</h3>
                    <span className="text-xs text-muted-foreground">{accountTypeLabel[a.account_type]}{a.broker ? ` • ${a.broker}` : ""}</span>
                  </div>
                  <ArrowLeft className="size-4 text-muted-foreground group-hover:text-primary transition" />
                </div>

                {showStatus && (
                  <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold mb-3 ${statusStyle[h.status]}`}>
                    {accountStatusLabel[h.status]}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <Row label="موجودی فعلی" value={formatNumber(h.currentBalance, 2)} />
                  <Row label="موجودی اولیه" value={formatNumber(h.initialBalance, 2)} muted />
                  <Row label="رشد" value={formatPercent(h.growthPct)} pn={h.growthPct} />
                  {h.drawdownLimit != null && (
                    <>
                      <Row label="حد ضرر استفاده‌شده" value={formatPercent(h.maxDrawdown, 2)} pn={-h.maxDrawdown} />
                      <Row label="حد ضرر باقی‌مانده" value={formatPercent(h.drawdownRemaining ?? 0, 2)} />
                    </>
                  )}
                  {h.target != null && h.targetProgress != null && (
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>پیشرفت تارگت</span>
                        <span className="num">{formatPercent(h.targetProgress, 0)}</span>
                      </div>
                      <Progress value={h.targetProgress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value, muted, pn }: { label: string; value: string; muted?: boolean; pn?: number }) {
  const cls = pn !== undefined ? (pn >= 0 ? "text-primary" : "text-destructive") : muted ? "text-muted-foreground" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`num font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

export function AccountForm({
  userId, onDone, initial,
}: {
  userId: string;
  onDone: () => void;
  initial?: Account;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<Account["account_type"]>(initial?.account_type ?? "demo");
  const [balance, setBalance] = useState(initial?.initial_balance ? String(initial.initial_balance) : "");
  const [broker, setBroker] = useState(initial?.broker ?? "");
  const [dailyDD, setDailyDD] = useState(initial?.daily_drawdown_limit ? String(initial.daily_drawdown_limit) : "");
  const [maxDD, setMaxDD] = useState(initial?.max_drawdown_limit ? String(initial.max_drawdown_limit) : "");
  const [t1, setT1] = useState(initial?.profit_target_1 ? String(initial.profit_target_1) : "");
  const [t2, setT2] = useState(initial?.profit_target_2 ? String(initial.profit_target_2) : "");
  const [saving, setSaving] = useState(false);

  const num = (s: string) => (s.trim() ? parseFloat(s) : null);
  const sanitize = (v: string) => v.replace(/[^\d.]/g, "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      user_id: userId,
      name: name.trim(),
      account_type: type,
      initial_balance: parseFloat(balance) || 0,
      broker: broker.trim() || null,
      daily_drawdown_limit: type === "prop" ? num(dailyDD) : null,
      max_drawdown_limit: type === "prop" || type === "real" ? num(maxDD) : null,
      profit_target_1: type === "prop" ? num(t1) : null,
      profit_target_2: type === "prop" ? num(t2) : null,
    };

    const { error } = initial
      ? await supabase.from("accounts").update(payload).eq("id", initial.id)
      : await supabase.from("accounts").insert(payload);

    setSaving(false);
    if (error) return toast.error("ثبت ناموفق", { description: error.message });
    toast.success(initial ? "حساب ویرایش شد" : "حساب اضافه شد");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>نام حساب *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثلاً FTMO 100K" />
      </div>
      <div className="space-y-2">
        <Label>نوع حساب</Label>
        <Select value={type} onValueChange={(v) => setType(v as Account["account_type"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="demo">دمو</SelectItem>
            <SelectItem value="prop">پراپ فرم</SelectItem>
            <SelectItem value="real">حساب واقعی</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>موجودی اولیه *</Label>
        <Input value={balance} onChange={(e) => setBalance(sanitize(e.target.value))} inputMode="decimal" required placeholder="100000" dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label>بروکر / پراپ فرم (اختیاری)</Label>
        <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="FTMO, Binance, IC Markets..." />
      </div>

      {type === "prop" && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 p-3 bg-muted/20">
          <div className="space-y-2">
            <Label className="text-xs">حد افت روزانه (٪)</Label>
            <Input value={dailyDD} onChange={(e) => setDailyDD(sanitize(e.target.value))} inputMode="decimal" placeholder="5" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">حد افت کل (٪)</Label>
            <Input value={maxDD} onChange={(e) => setMaxDD(sanitize(e.target.value))} inputMode="decimal" placeholder="10" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">تارگت ۱ (٪)</Label>
            <Input value={t1} onChange={(e) => setT1(sanitize(e.target.value))} inputMode="decimal" placeholder="8" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">تارگت ۲ (٪)</Label>
            <Input value={t2} onChange={(e) => setT2(sanitize(e.target.value))} inputMode="decimal" placeholder="5" dir="ltr" />
          </div>
        </div>
      )}

      {type === "real" && (
        <div className="rounded-xl border border-border/60 p-3 bg-muted/20 space-y-2">
          <Label className="text-xs">حد افت کل (٪)</Label>
          <Input value={maxDD} onChange={(e) => setMaxDD(sanitize(e.target.value))} inputMode="decimal" placeholder="20" dir="ltr" />
        </div>
      )}

      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? <Loader2 className="size-4 animate-spin" /> : initial ? "ذخیره تغییرات" : "ثبت حساب"}
      </Button>
    </form>
  );
}
