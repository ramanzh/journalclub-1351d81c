import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InstrumentPicker } from "@/components/instrument-picker";
import { SetupTagPicker } from "@/components/setup-tag-picker";
import { ChecklistPicker } from "@/components/checklist-picker";
import { EmotionPicker } from "@/components/emotion-picker";
import { QualityPicker } from "@/components/quality-picker";
import { BrokenRulesPicker } from "@/components/broken-rules-picker";
import { cn } from "@/lib/utils";
// ✅ اضافه شدن accountHealth برای بررسی وضعیت لحظه‌ای حساب‌ها
import { SESSIONS, sessionLabel, accountHealth, type Account, type Session, type Trade, type TradeQuality } from "@/lib/trade-utils";
import { ensureDefaultsSeeded } from "@/lib/seed-defaults";

type FormState = {
  asset_name: string;
  market: Trade["market"];
  side: Trade["side"];
  account_id: string;
  entry_price: string;
  exit_price: string;
  stop_loss: string;
  take_profit: string;
  position_size: string;
  risk_percent: string;
  emotion_before: string;
  emotion_after: string;
  mistakes: string;
  lessons: string;
  notes: string;
  trade_date: Date;
  trade_time: string;
  setup_tags: string[];
  session: string;
  checklist: Record<string, boolean>;
  quality: TradeQuality | null;
  broken_rules: string[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const numStr = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

const toInitial = (t?: Trade): FormState => {
  const d = t?.trade_date ? new Date(t.trade_date) : new Date();
  return {
    asset_name: t?.asset_name ?? "",
    market: t?.market ?? "forex",
    side: t?.side ?? "buy",
    account_id: t?.account_id ?? "none",
    entry_price: numStr(t?.entry_price),
    exit_price: numStr(t?.exit_price),
    stop_loss: numStr(t?.stop_loss),
    take_profit: numStr(t?.take_profit),
    position_size: numStr(t?.position_size),
    risk_percent: numStr(t?.risk_percent),
    emotion_before: t?.emotion_before ?? "",
    emotion_after: t?.emotion_after ?? "",
    mistakes: t?.mistakes ?? "",
    lessons: t?.lessons ?? "",
    notes: t?.notes ?? "",
    trade_date: d,
    trade_time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    setup_tags: t?.setup_tags ?? [],
    session: (t?.session as string) ?? "",
    checklist: (t?.checklist as Record<string, boolean>) ?? {},
    quality: (t?.quality as TradeQuality | null) ?? null,
    broken_rules: t?.broken_rules ?? [],
  };
};

const sanitizeNumber = (v: string) => v.replace(/[^\d.\-]/g, "");

function SessionPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [customSessions, setCustomSessions] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [newSession, setNewSession] = useState("");

  const defaultSessions = SESSIONS.map((s) => ({ key: s, label: sessionLabel[s as Session] }));
  const allSessions = [
    ...defaultSessions,
    ...customSessions.map((s) => ({ key: s, label: s })),
  ];

  const addSession = () => {
    const name = newSession.trim();
    if (!name || allSessions.some((s) => s.key === name)) return;
    setCustomSessions((p) => [...p, name]);
    setNewSession("");
    setShowInput(false);
    onChange(name);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
          value === ""
            ? "bg-primary text-primary-foreground border-primary shadow-glow"
            : "border-border/60 hover:bg-accent/50"
        }`}
      >
        —
      </button>
      {allSessions.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(value === key ? "" : key)}
          className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
            value === key
              ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105"
              : "border-border/60 hover:bg-accent/50 hover:scale-105"
          }`}
        >
          {label}
        </button>
      ))}

      {showInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={newSession}
            onChange={(e) => setNewSession(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSession())}
            placeholder="نام سشن..."
            className="h-7 text-xs w-28"
            autoFocus
          />
          <Button type="button" size="sm" className="h-7 px-2" onClick={addSession}>
            <Plus className="size-3" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2"
            onClick={() => { setShowInput(false); setNewSession(""); }}>
            ✕
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="px-3 py-1.5 rounded-full text-xs border border-dashed border-border/60 inline-flex items-center gap-1 hover:bg-accent/40 transition"
        >
          <Plus className="size-3" /> سشن جدید
        </button>
      )}
    </div>
  );
}

export function TradeForm({ trade, userId }: { trade?: Trade; userId: string }) {
  const navigate = useNavigate();
  const [f, setF] = useState<FormState>(toInitial(trade));
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(trade?.screenshot_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { ensureDefaultsSeeded(userId).catch(() => {}); }, [userId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Account[];
    },
  });

  // ✅ اضافه شدن کوئری دریافت کل معاملات برای محاسبه دقیق وضعیت سلامت هر حساب
  const { data: allTrades } = useQuery({
    queryKey: ["all-trades-for-form"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return data as Trade[];
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
    if (error) { setUploading(false); toast.error("آپلود ناموفق", { description: error.message }); return; }
    setScreenshotUrl(path);
    setUploading(false);
    toast.success("تصویر آپلود شد");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const [hh, mm] = f.trade_time.split(":").map(Number);
    const d = new Date(f.trade_date);
    d.setHours(hh || 0, mm || 0, 0, 0);

    const entryPrice = parseFloat(f.entry_price);
    const exitPrice = f.exit_price ? parseFloat(f.exit_price) : null;
    const positionSize = parseFloat(f.position_size);

    let profit_loss: number | null = null;
    let profit_loss_percent: number | null = null;

    if (exitPrice !== null && !isNaN(entryPrice) && !isNaN(positionSize)) {
      if (f.side === "buy") {
        profit_loss = (exitPrice - entryPrice) * positionSize;
      } else {
        profit_loss = (entryPrice - exitPrice) * positionSize;
      }
      profit_loss = Number(profit_loss.toFixed(2));

      const selectedAccount = (accounts ?? []).find(
        (a) => a.id === (f.account_id === "none" ? "" : f.account_id)
      );
      if (selectedAccount && selectedAccount.initial_balance > 0) {
        profit_loss_percent = Number(
          ((profit_loss / selectedAccount.initial_balance) * 100).toFixed(4)
        );
      }
    }

    const payload = {
      user_id: userId,
      account_id: f.account_id === "none" ? null : f.account_id,
      asset_name: f.asset_name.trim(),
      market: f.market,
      side: f.side,
      entry_price: entryPrice,
      exit_price: exitPrice,
      stop_loss: f.stop_loss ? parseFloat(f.stop_loss) : null,
      take_profit: f.take_profit ? parseFloat(f.take_profit) : null,
      position_size: positionSize,
      risk_percent: f.risk_percent ? parseFloat(f.risk_percent) : null,
      profit_loss,
      profit_loss_percent,
      emotion_before: f.emotion_before || null,
      emotion_after: f.emotion_after || null,
      mistakes: f.mistakes || null,
      lessons: f.lessons || null,
      notes: f.notes || null,
      trade_date: d.toISOString(),
      screenshot_url: screenshotUrl,
      setup_tags: f.setup_tags,
      session: f.session || null,
      checklist: f.checklist,
      quality: f.quality,
      broken_rules: f.broken_rules,
    };

    const { error } = trade
      ? await supabase.from("trades").update(payload).eq("id", trade.id)
      : await supabase.from("trades").insert(payload);

    setSaving(false);
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success(trade ? "معامله به‌روزرسانی شد" : "معامله ثبت شد");
    navigate({ to: "/trades" });
  };

  const numberInput = (key: keyof FormState, placeholder: string) => (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={f[key] as string}
      onChange={(e) => set(key, sanitizeNumber(e.target.value) as never)}
      placeholder={placeholder}
      dir="ltr"
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
      <Section title="اطلاعات معامله">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="بازار">
            <Select value={f.market} onValueChange={(v) => set("market", v as Trade["market"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="forex">فارکس</SelectItem>
                <SelectItem value="crypto">کریپتو</SelectItem>
                <SelectItem value="stock">سهام</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="حساب">
            <Select value={f.account_id} onValueChange={(v) => set("account_id", v)}>
              <SelectTrigger><SelectValue placeholder="انتخاب حساب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون حساب</SelectItem>
                {(accounts ?? []).map((a) => {
                  // ✅ تفکیک و استخراج معاملات مربوط به همین حساب
                  const accountTrades = (allTrades ?? []).filter((t) => t.account_id === a.id);
                  // ✅ محاسبه وضعیت لایو حساب
                  const health = accountHealth(a, accountTrades);
                  // ✅ اگر حساب کامل پاس شده باشه یا فیلد شده باشه، قفلش می‌کنیم
                  const isAccountLocked = a.account_type === "prop" && (health.status === "target2" || health.status === "failed");

                  return (
                    <SelectItem key={a.id} value={a.id} disabled={isAccountLocked}>
                      {a.name} {isAccountLocked ? " 🔒 (قفل شده)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="ارز" required>
              <InstrumentPicker market={f.market} value={f.asset_name} onChange={(v) => set("asset_name", v)} userId={userId} />
            </Field>
          </div>
          <Field label="جهت">
            <Select value={f.side} onValueChange={(v) => set("side", v as Trade["side"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">خرید (Long)</SelectItem>
                <SelectItem value="sell">فروش (Short)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="سشن معاملاتی">
            <SessionPicker value={f.session} onChange={(v) => set("session", v)} />
          </Field>
          <Field label="تاریخ و ساعت معامله">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline"
                    className={cn("flex-1 justify-start text-right font-normal", !f.trade_date && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 size-4" />
                    {f.trade_date ? format(f.trade_date, "yyyy/MM/dd") : <span>انتخاب تاریخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={f.trade_date} onSelect={(d) => d && set("trade_date", d)}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Input type="time" value={f.trade_time} onChange={(e) => set("trade_time", e.target.value)} dir="ltr" className="w-32" />
            </div>
          </Field>
          <Field label="قیمت ورود" required>{numberInput("entry_price", "0.00")}</Field>
          <Field label="قیمت خروج">{numberInput("exit_price", "0.00")}</Field>
          <Field label="حد ضرر">{numberInput("stop_loss", "0.00")}</Field>
          <Field label="حد سود">{numberInput("take_profit", "0.00")}</Field>
          <Field label="حجم پوزیشن" required>{numberInput("position_size", "0.00")}</Field>
          <Field label="ریسک (%)">{numberInput("risk_percent", "1.00")}</Field>
        </div>
      </Section>

      <Section title="تگ‌های ستاپ">
        <SetupTagPicker userId={userId} value={f.setup_tags} onChange={(v) => set("setup_tags", v)} />
      </Section>

      <Section title="چک‌لیست پیش از معامله">
        <ChecklistPicker userId={userId} value={f.checklist} onChange={(v) => set("checklist", v)} />
      </Section>

      <Section title="کیفیت معامله">
        <p className="text-xs text-muted-foreground mb-3">معامله را بر اساس کیفیت اجرا و تطبیق با پلن ارزیابی کن.</p>
        <QualityPicker value={f.quality} onChange={(v) => set("quality", v)} />
      </Section>

      <Section title="قوانین نقض‌شده">
        <BrokenRulesPicker value={f.broken_rules} onChange={(v) => set("broken_rules", v)} />
      </Section>

      <Section title="اسکرین‌شات نمودار">
        {screenshotUrl ? (
          <div className="relative inline-block">
            <ScreenshotPreview path={screenshotUrl} />
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 left-2"
              onClick={() => setScreenshotUrl(null)}>
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-accent/30 transition">
            {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{uploading ? "در حال آپلود..." : "تصویر را انتخاب کنید"}</span>
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
          </label>
        )}
      </Section>

      <Section title="ژورنال احساسی">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>احساس قبل از معامله</Label>
            <EmotionPicker phase="before" value={f.emotion_before} onChange={(v) => set("emotion_before", v)} />
          </div>
          <div className="space-y-2">
            <Label>احساس بعد از معامله</Label>
            <EmotionPicker phase="after" value={f.emotion_after} onChange={(v) => set("emotion_after", v)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="اشتباهات">
              <Textarea rows={3} value={f.mistakes} onChange={(e) => set("mistakes", e.target.value)} placeholder="چه اشتباهی کردی؟" />
            </Field>
            <Field label="درس‌ها">
              <Textarea rows={3} value={f.lessons} onChange={(e) => set("lessons", e.target.value)} placeholder="چه چیزی یاد گرفتی؟" />
            </Field>
            <div className="md:col-span-2">
              <Field label="یادداشت‌های اضافی">
                <Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-start gap-3">
        <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground font-semibold px-8">
          {saving ? <Loader2 className="size-4 animate-spin" /> : trade ? "ذخیره تغییرات" : "ثبت معامله"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate({ to: "/trades" })}>انصراف</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gradient-card rounded-2xl border border-border/60 p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
    </div>
  );
}

export function ScreenshotPreview({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("trade-screenshots").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  if (!url) return <div className="w-64 h-40 bg-muted rounded-lg animate-pulse" />;
  return <img src={url} alt="نمودار معامله" className="max-w-full max-h-96 rounded-lg border border-border" />;
}
