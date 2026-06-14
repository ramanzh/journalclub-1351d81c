import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { TradingRule } from "@/lib/trade-utils";
import { AlertTriangle } from "lucide-react";

export function BrokenRulesPicker({
  value, onChange,
}: { value: string[]; onChange: (v: string[]) => void }) {
  const { data: rules = [] } = useQuery({
    queryKey: ["trading_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_rules").select("*").eq("active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TradingRule[];
    },
  });

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (rules.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        هنوز قانون معاملاتی تعریف نکرده‌اید.{" "}
        <Link to="/rules" className="text-primary underline">افزودن قوانین</Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <AlertTriangle className="size-3.5" /> قوانینی که در این معامله نقض شدند را علامت بزنید
      </p>
      <div className="flex flex-wrap gap-2">
        {rules.map((r) => {
          const active = value.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                active
                  ? "bg-destructive text-destructive-foreground border-destructive shadow-glow"
                  : "border-border/60 hover:bg-accent/50"
              }`}
              title={r.description ?? undefined}
            >
              {r.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
