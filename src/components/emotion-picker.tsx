import { emotionLabel, EMOTIONS_AFTER, EMOTIONS_BEFORE } from "@/lib/trade-utils";

export function EmotionPicker({
  phase, value, onChange,
}: { phase: "before" | "after"; value: string; onChange: (v: string) => void }) {
  const list = phase === "before" ? EMOTIONS_BEFORE : EMOTIONS_AFTER;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((k) => {
        const active = value === k;
        return (
          <button key={k} type="button" onClick={() => onChange(active ? "" : k)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-glow"
                : "border-border/60 hover:bg-accent/50"
            }`}>
            {emotionLabel[k] ?? k}
          </button>
        );
      })}
    </div>
  );
}
