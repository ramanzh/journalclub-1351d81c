import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, AlertTriangle, Target } from "lucide-react";
import { toast } from "sonner";
import { ruleStats, type Trade, type TradingRule } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/rules")({
  head: () => ({ meta: [{ title: "قوانین معاملاتی | ژورنال کلاب" }] }),
  component: RulesPage,
});

const SUGGESTIONS = [
  "حداکثر ۳ معامله در روز",
  "حداکثر ۱٪ ریسک در هر معامله",
  "بدون معامله در زمان اخبار مهم",
  "بدون معامله انتقامی",
  "بدون معامله بعد از ۲ ضرر پی‌درپی",
  "فقط در سشن لندن معامله کن",
];

function RulesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TradingRule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const rulesQ = useQuery({
    queryKey: ["trading_rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trading_rules").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as TradingRule[];
    },
    enabled: !!user,
  });
  const tradesQ = useQuery({
    queryKey: ["trades", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    enabled: !!user,
  });

  const rules = rulesQ.data ?? [];
  const trades = tradesQ.data ?? [];
  const stats = ruleStats(trades, rules);

  const reset = () => { setTitle(""); setDescription(""); setActive(true); setEditing(null); };
  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (r: TradingRule) => {
    setEditing(r); setTitle(r.title); setDescription(r.description ?? ""); setActive(r.active); setOpen(true);
  };

  const save = async () => {
    if (!user || !title.trim()) return;
    const payload = { title: title.trim(), description: description.trim() || null, active };
    const { error } = editing
      ? await supabase.from("trading_rules").update(payload).eq("id", editing.id)
      : await supabase.from("trading_rules").insert({ ...payload, user_id: user.id });
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success(editing ? "قانون به‌روزرسانی شد" : "قانون اضافه شد");
    setOpen(false); reset();
    qc.invalidateQueries({ queryKey: ["trading_rules"] });
  };

  const remove = async (r: TradingRule) => {
    if (!confirm(`حذف قانون «${r.title}»؟`)) return;
    const { error } = await supabase.from("trading_rules").delete().eq("id", r.id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    qc.invalidateQueries({ queryKey: ["trading_rules"] });
  };

  const addSuggestion = async (s: string) => {
    if (!user) return;
    const { error } = await supabase.from("trading_rules").insert({ user_id: user.id, title: s, active: true });
    if (error) return toast.error("افزودن ناموفق", { description: error.message });
    qc.invalidateQueries({ queryKey: ["trading_rules"] });
  };

  const loading = rulesQ.isLoading || tradesQ.isLoading;

  return (
    <AppShell title="قوانین معاملاتی">
      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="امتیاز انضباط" value={`${stats.discipline}/100`} Icon={Target} accent="text-primary" />
            <StatCard label="قوانین رعایت‌شده" value={`${stats.followedPct.toFixed(0)}٪`} Icon={ShieldCheck} accent="text-primary" />
            <StatCard label="قوانین نقض‌شده" value={`${stats.brokenPct.toFixed(0)}٪`} Icon={AlertTriangle} accent="text-destructive" />
            <StatCard label="بیشترین نقض" value={stats.mostBroken?.title ?? "—"} Icon={AlertTriangle} accent="text-destructive" small />
          </div>

          <div className="gradient-card rounded-2xl border border-border/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">قوانین من</h3>
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
                <DialogTrigger asChild>
                  <Button onClick={openNew} className="gradient-primary text-primary-foreground">
                    <Plus className="size-4 ml-1" /> قانون جدید
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editing ? "ویرایش قانون" : "قانون جدید"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5"><Label>عنوان</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: حداکثر ۱٪ ریسک" /></div>
                    <div className="space-y-1.5"><Label>توضیحات (اختیاری)</Label>
                      <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div className="flex items-center gap-2">
                      <Switch checked={active} onCheckedChange={setActive} />
                      <Label>فعال</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
                    <Button onClick={save} className="gradient-primary text-primary-foreground">ذخیره</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {rules.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">هنوز قانونی نداری. می‌توانی از پیشنهادها انتخاب کنی:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => addSuggestion(s)}
                      className="px-3 py-1.5 rounded-full text-xs border border-dashed border-border/60 hover:bg-accent/40 transition inline-flex items-center gap-1">
                      <Plus className="size-3" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => {
                  const ps = stats.perRule.find((p) => p.id === r.id);
                  return (
                    <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/40 p-3 hover:border-primary/40 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`size-2 rounded-full ${r.active ? "bg-primary" : "bg-muted-foreground/40"}`} />
                          <span className="font-medium">{r.title}</span>
                          {ps && ps.brokenCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
                              {ps.brokenCount} بار نقض
                            </span>
                          )}
                        </div>
                        {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r)}><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, Icon, accent, small }: { label: string; value: string; Icon: React.ComponentType<{ className?: string }>; accent?: string; small?: boolean }) {
  return (
    <div className="gradient-card rounded-2xl border border-border/60 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${accent ?? ""}`} />
      </div>
      <div className={`${small ? "text-sm" : "text-2xl"} font-bold num ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
