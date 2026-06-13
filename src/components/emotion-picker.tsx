import { useState } from "react";
import { emotionLabel, EMOTIONS_AFTER, EMOTIONS_BEFORE } from "@/lib/trade-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function EmotionPicker({
  phase, value, onChange,
}: { phase: "before" | "after"; value: string; onChange: (v: string) => void }) {
  const list = phase === "before" ? [...EMOTIONS_BEFORE] : [...EMOTIONS_AFTER];
  const [customEmotions, setCustomEmotions] = useState<string[]>([]);
  const [newEmotion, setNewEmotion] = useState("");
  const [showInput, setShowInput] = useState(false);

  const allEmotions = [...list, ...customEmotions];

  const addEmotion = () => {
    const name = newEmotion.trim();
    if (!name || allEmotions.includes(name)) return;
    setCustomEmotions((p) => [...p, name]);
    setNewEmotion("");
    setShowInput(false);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {allEmotions.map((k) => {
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(active ? "" : k)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105"
                : "border-border/60 hover:bg-accent/50 hover:scale-105"
            }`}
          >
            {emotionLabel[k] ?? k}
          </button>
        );
      })}

      {showInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={newEmotion}
            onChange={(e) => setNewEmotion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmotion())}
            placeholder="احساس جدید..."
            className="h-7 text-xs w-28"
            autoFocus
          />
          <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={addEmotion}>
            <Plus className="size-3" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
            onClick={() => { setShowInput(false); setNewEmotion(""); }}>
            ✕
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="px-3 py-1.5 rounded-full text-xs border border-dashed border-border/60 inline-flex items-center gap-1 hover:bg-accent/40 transition"
        >
          <Plus className="size-3" /> احساس جدید
        </button>
      )}
    </div>
  );
}
