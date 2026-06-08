import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { accountStats, accountTypeLabel, formatNumber, formatPercent, type Account, type Trade } from "@/lib/trade-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wallet, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts/")({
  head: () => ({ meta: [{ title: "حساب‌ها | ژورنال کلاب" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const accountsQ = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Account[];
    },
  });
  const tradesQ = useQuery({
    queryKey: ["trades", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return data as Trade[];
    },
  });

  const accounts = accountsQ.data ?? [];
  const trades = tradesQ.data ?? [];

  return (
    <AppShell title="حساب‌ها">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{formatNumber(accounts.length, 0)} حساب</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2">
              <Plus className="size-4" /> حساب جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>افزودن حساب جدید</DialogTitle></DialogHeader>
            <NewAccountForm userId={user!.id} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["accounts"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {accountsQ.isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : accounts.length === 0 ? (
        <div className="gradient-card rounded-2xl border border-border/60 p-12 text-center">
          <Wallet className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">هنوز حسابی نساخته‌اید.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const s = accountStats(a, trades);
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
                <div className="space-y-2 text-sm">
                  <Row label="موجودی فعلی" value={formatNumber(s.currentBalance, 2)} />
                  <Row label="موجودی اولیه" value={formatNumber(s.initialBalance, 2)} muted />
                  <Row label="رشد" value={formatPercent(s.growthPct)} pn={s.growthPct} />
                  <Row label="نرخ برد" value={formatPercent(s.winRate, 1)} />
                  <Row label="تعداد معاملات" value={formatNumber(s.total, 0)} muted />
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

function NewAccountForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["account_type"]>("demo");
  const [balance, setBalance] = useState("");
  const [broker, setBroker] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("accounts").insert({
      user_id: userId,
      name: name.trim(),
      account_type: type,
      initial_balance: parseFloat(balance) || 0,
      broker: broker.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error("ثبت ناموفق", { description: error.message });
    toast.success("حساب اضافه شد");
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
        <Input value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" required placeholder="100000" dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label>بروکر / پراپ فرم (اختیاری)</Label>
        <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="FTMO, Binance, IC Markets..." />
      </div>
      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? <Loader2 className="size-4 animate-spin" /> : "ثبت حساب"}
      </Button>
    </form>
  );
}
