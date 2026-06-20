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
import { SESSIONS, sessionLabel, accountHealth, type Account, type Session, type Trade, type TradeQuality } from "@/lib/trade-utils";
import { ensureDefaultsSeeded } from "@/lib/seed-defaults";

type FormState = {
  asset_name: string;
  market: Trade["market"];
  side: Trade["side"] | "buy_limit" | "sell_limit" | "buy_stop" | "sell_stop";
  status: "active" | "closed"; // مدیریت وضعیت فقط در فرانت‌اند
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
  trade_date: Date | undefined;
  trade_time: string;
  setup_tags: string[];
  session: string;
  checklist: Record<string, boolean>;
  quality: string | null;
  broken_rules: string[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const numStr = (v: number | null | undefined) => (v === null || v === undefined || v === 0 ? "" : String(v));

const toInitial = (t?: Trade): FormState => {
  const d = t?.trade_date ? new Date(t.trade_date) : new Date();
  // معامله فعال است اگر قیمت خروج ثبت نشده یا صفر باشد
  const isTradeActive = !t?.exit_price || t.exit_price === 0;

  return {
    asset_name: t?.asset_name ?? "",
    market: t?.market ?? "forex",
    side: (t?.side as any) ?? "buy",
    status: isTradeActive ? "active" : "closed", 
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
    trade_time: t?.trade_date ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`,
    setup_tags: t?.setup_tags ?? [],
    session: (t?.session as string) ?? "",
    checklist: (t?.checklist as Record<string, boolean>) ?? {},
    quality: (t?.quality as string | null) ?? null,
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
    
    // ۱. استخراج پسوند فایل (مثلاً png یا jpg)
    const fileExtension = file.name.split('.').pop() || 'png';
    
    // ۲. تولید شناسه رندوم انگلیسی برای حذف کامل اثر نام فایل اصلی (فارسی/خاص)
    const randomId = Math.random().toString(36).substring(2, 10);
    
    // ۳. ایجاد مسیر نهایی کاملاً تمیز و استاندارد
    const cleanFileName = `chart_${Date.now()}_${randomId}.${fileExtension}`;
    const path = `${userId}/${cleanFileName}`;
    
    const { error } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
    if (error) { setUploading(false); toast.error("آپلود ناموفق", {
