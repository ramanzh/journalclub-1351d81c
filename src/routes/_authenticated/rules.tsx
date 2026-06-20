import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { TradingRule } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/rules")({
  head: () => ({ meta: [{ title: "قوانین معاملاتی | ژورنال کلاب" }] }),
  component: RulesPage,
});

// ✅ تابع تبدیل سراسری اعداد به فارسی
const toPersianDigits = (num: number | string | null | undefined) => {
  if (num === null || num === undefined || num === "") return "۰";
  const parsed = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(parsed)) return String(num);
  return new Intl.NumberFormat("fa-IR").format(parsed);
};

function RulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // دریافت لیست قوانین
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["trading_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TradingRule[];
    },
    enabled: !!user,
  });

  // میوتیشن ثبت قانون جدید
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("trading_rules").insert([
        {
          user_id: user?.id,
          title,
          description: description || null,
          active: true,
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
      toast({ title: "قانون جدید با موفقیت ثبت شد." });
      setTitle("");
      setDescription("");
    },
    onError: () => {
      toast({ title: "خطا در ثبت قانون", variant: "destructive" });
    },
  });

  // میوتیشن حذف قانون
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trading_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
      toast({ title: "قانون مورد نظر حذف شد." });
    },
  });

  // میوتیشن تغییر وضعیت فعال/غیرفعال بودن
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("trading_rules").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  return (
    <AppShell title="مدیریت قوانین معاملاتی">
      <div className="space-y-6" dir="rtl">
        {/* هدر آمار کوچک */}
        <div className="flex justify-between items-center bg-card border border-border/60 rounded-xl p-4">
          <span className="text-sm text-muted-foreground">کل قوانین تعریف شده</span>
          <span className="text-xl font-bold text-primary num">
            {toPersianDigits(rules.length)} قانون
          </span>
        </div>

        {/* فرم افزودن قانون */}
        <div className="gradient-card rounded-2xl border border-border/60 p-5">
          <h3 className="font-semibold mb-4 text-right flex items-center gap-2">
            <Plus className="size-4 text-primary" /> تعریف قانون جدید
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs text-muted-foreground">عنوان قانون</label>
              <Input
                placeholder="مثلاً: عدم ورود در زمان اخبار ژانویه یا رعایت حد ضرر"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-1.5 text-right">
              <label className="text-xs text-muted-foreground">توضیحات تکمیلی (اختیاری)</label>
              <Textarea
                placeholder="جزئیات بیشتری درباره این قانون بنویسید..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-right min-h-[80px]"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full gap-1.5">
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ثبت قانون جدید
            </Button>
          </form>
        </div>

        {/* لیست قوانین */}
        <div className="space-y-3">
          <h3 className="font-semibold text-right text-sm text-muted-foreground px-1">ليست قوانین شما</h3>
          
          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center bg-card/40 rounded-xl border border-dashed border-border">
              هنوز هیچ قانون معاملاتی ثبت نکرده‌اید.
            </p>
          ) : (
            <div className="grid gap-3">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-border transition"
                >
                  <div className="flex items-start gap-3 text-right">
                    {/* ردیف فارسی شده */}
                    <span className="text-xs font-medium text-muted-foreground bg-muted size-5 rounded-full flex items-center justify-center num mt-0.5">
                      {toPersianDigits(index + 1)}
                    </span>
                    <div>
                      <h4 className={`font-medium text-sm ${!rule.active ? "line-through text-muted-foreground" : ""}`}>
                        {rule.title}
                      </h4>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* دکمه فعال / غیرفعال کردن */}
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate({ id: rule.id, active: !rule.active })}
                      title={rule.active ? "غیرفعال کردن" : "فعال کردن"}
                      className={`p-1.5 rounded-lg border transition ${
                        rule.active
                          ? "border-primary/20 text-primary hover:bg-primary/10"
                          : "border-muted text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {rule.active ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                    </button>

                    {/* دکمه حذف */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("آیا از حذف این قانون مطمئن هستید؟")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                      title="حذف قانون"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
