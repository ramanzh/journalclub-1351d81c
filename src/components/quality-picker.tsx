import { TRADE_QUALITIES, type TradeQuality } from "@/lib/trade-utils";

const colors: Record<TradeQuality, string> = {
  "A+": "from-emerald-500 to-green-600 border-emerald-400",
  "A": "from-green-500 to-emerald-600 border-green-400",
  "B": "from-amber-500 to-yellow-600 border-amber-400",
  "C": "from-red-500 to-rose-600 border-red-400",
};

export function QualityPicker({
  value, onChange,
}: { value: TradeQuality | null; onChange: (v: TradeQuality | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRADE_QUALITIES.map((q) => {
        const active = value === q;
        return (
          <button
            key={q}
            type="button"
            onClick={() => onChange(active ? null : q)}
            className={`min-w-14 px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all duration-200 ${
              active
                ? `bg-gradient-to-br ${colors[q]} text-white shadow-glow scale-105`
                : "border-border/60 hover:bg-accent/50 hover:scale-105"
            }`}
          >
            {q}
          </button>
        );
      })}
    </div>
  );
}
