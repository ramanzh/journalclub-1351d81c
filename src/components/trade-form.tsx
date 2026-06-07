import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Trade } from "@/lib/trade-utils";

type FormState = {
  asset_name: string;
  market: Trade["market"];
  side: Trade["side"];
  entry_price: string;
  exit_price: string;
  stop_loss: string;
  take_profit: string;
  position_size: string;
  emotion_before: string;
  emotion_after: string;
  mistakes: string;
  lessons: string;
  notes: string;
  trade_date: string;
};

const toInitial = (t?: Trade): FormState => ({
  asset_name: t?.asset_name ?? "",
  market: t?.market ?? "forex",
  side: t?.side ?? "buy",
  entry_price: t?.entry_price?.toString() ?? "",
  exit_price: t?.exit_price?.toString() ?? "",
  stop_loss: t?.stop_loss?.toString() ?? "",
  take_profit: t?.take_profit?.toString() ?? "",
  position_size: t?.position_size?.toString() ?? "",
  emotion_before: t?.emotion_before ?? "",
  emotion_after: t?.emotion_after ?? "",
  mistakes: t?.mistakes ?? "",
  lessons: t?.lessons ?? "",
  notes: t?.notes ?? "",
  trade_date: (t?.trade_date ?? new Date().toISOString()).slice(0, 16),
});

export function TradeForm({ trade, userId }: { trade?: Trade; userId: string }) {
  const navigate = useNavigate();
  const [f, setF] = useState<FormState>(toInitial(trade));
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(trade?.screenshot_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error("آپلود ناموفق", { description: error.message });
      return;
    }
    setScreenshotUrl(path);
    setUploading(false);
    toast.success("تصویر آپلود شد");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      user_id: userId,
      asset_name: f.asset_name.trim(),
      market: f.market,
      side: f.side,
      entry_price: parseFloat(f.entry_price),
      exit_price: f.exit_price ? parseFloat(f.exit_price) : null,
      stop_loss: f.stop_loss ? parseFloat(f.stop_loss) : null,
      take_profit: f.take_profit ? parseFloat(f.take_profit) : null,
      position_size: parseFloat(f.position_size),
      emotion_before: f.emotion_before || null,
      emotion_after: f.emotion_after || null,
      mistakes: f.mistakes || null,
      lessons: f.lessons || null,
      notes: f.notes || null,
      trade_date: new Date(f.trade_date).toISOString(),
      screenshot_url: screenshotUrl,
    };

    const { error } = trade
      ? await supabase.from("trades").update(payload).eq("id", trade.id)
      : await supabase.from("trades").insert(payload);

    setSaving(false);
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success(trade ? "معامله به‌روزرسانی شد" : "معامله ثبت شد");
    navigate({ to: "/trades" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="اطلاعات معامله">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="نام دارایی" required>
            <Input value={f.asset_name} onChange={(e) => set("asset_name", e.target.value)} required placeholder="مثلاً BTC/USDT, EURUSD" />
          </Field>
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
          <Field label="جهت">
            <Select value={f.side} onValueChange={(v) => set("side", v as Trade["side"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">خرید (Long)</SelectItem>
                <SelectItem value="sell">فروش (Short)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="تاریخ معامله">
            <Input type="datetime-local" value={f.trade_date} onChange={(e) => set("trade_date", e.target.value)} dir="ltr" />
          </Field>
          <Field label="قیمت ورود" required>
            <Input type="number" step="any" value={f.entry_price} onChange={(e) => set("entry_price", e.target.value)} required dir="ltr" />
          </Field>
          <Field label="قیمت خروج">
            <Input type="number" step="any" value={f.exit_price} onChange={(e) => set("exit_price", e.target.value)} dir="ltr" placeholder="باز" />
          </Field>
          <Field label="حد ضرر">
            <Input type="number" step="any" value={f.stop_loss} onChange={(e) => set("stop_loss", e.target.value)} dir="ltr" />
          </Field>
          <Field label="حد سود">
            <Input type="number" step="any" value={f.take_profit} onChange={(e) => set("take_profit", e.target.value)} dir="ltr" />
          </Field>
          <Field label="حجم پوزیشن" required>
            <Input type="number" step="any" value={f.position_size} onChange={(e) => set("position_size", e.target.value)} required dir="ltr" />
          </Field>
        </div>
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
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="احساس قبل از معامله">
            <Textarea rows={3} value={f.emotion_before} onChange={(e) => set("emotion_before", e.target.value)} placeholder="چه حسی داشتی؟" />
          </Field>
          <Field label="احساس بعد از معامله">
            <Textarea rows={3} value={f.emotion_after} onChange={(e) => set("emotion_after", e.target.value)} />
          </Field>
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
  useState(() => {
    supabase.storage.from("trade-screenshots").createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  });
  if (!url) return <div className="w-64 h-40 bg-muted rounded-lg animate-pulse" />;
  return <img src={url} alt="chart" className="max-w-full max-h-96 rounded-lg border border-border" />;
}
