import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { INSTRUMENTS } from "@/lib/instruments";
import type { FavoriteInstrument, Trade } from "@/lib/trade-utils";
import { cn } from "@/lib/utils";

export function InstrumentPicker({
  market,
  value,
  onChange,
  userId,
}: {
  market: Trade["market"];
  value: string;
  onChange: (v: string) => void;
  userId: string;
}) {
  const qc = useQueryClient();

  const { data: favorites } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorite_instruments").select("*").eq("user_id", userId);
      if (error) throw error;
      return data as FavoriteInstrument[];
    },
  });

  const favSet = useMemo(
    () => new Set((favorites ?? []).filter((f) => f.market === market).map((f) => f.symbol)),
    [favorites, market],
  );

  const list = useMemo(() => {
    const base = [...INSTRUMENTS[market]];
    // include any current value that is custom
    if (value && !base.includes(value)) base.push(value);
    const favs = base.filter((s) => favSet.has(s)).sort();
    const rest = base.filter((s) => !favSet.has(s)).sort();
    return { favs, rest };
  }, [market, value, favSet]);

  const toggleFav = async (symbol: string) => {
    const existing = (favorites ?? []).find((f) => f.market === market && f.symbol === symbol);
    if (existing) {
      await supabase.from("favorite_instruments").delete().eq("id", existing.id);
    } else {
      await supabase.from("favorite_instruments").insert({ user_id: userId, market, symbol });
    }
    qc.invalidateQueries({ queryKey: ["favorites", userId] });
  };

  return (
    <div className="space-y-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="انتخاب یا تایپ کنید (مثلاً EURUSD)"
        dir="ltr"
        className="text-right"
      />
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-2 space-y-1">
        {list.favs.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1">
              <Star className="size-3 fill-warning text-warning" /> علاقه‌مندی‌ها
            </div>
            {list.favs.map((s) => (
              <Row key={s} symbol={s} active={s === value} fav onSelect={() => onChange(s)} onFav={() => toggleFav(s)} />
            ))}
            <div className="h-px bg-border/60 my-1" />
          </>
        )}
        {list.rest.map((s) => (
          <Row key={s} symbol={s} active={s === value} fav={false} onSelect={() => onChange(s)} onFav={() => toggleFav(s)} />
        ))}
      </div>
    </div>
  );
}

function Row({
  symbol, active, fav, onSelect, onFav,
}: { symbol: string; active: boolean; fav: boolean; onSelect: () => void; onFav: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer transition",
        active ? "bg-primary/15 text-primary" : "hover:bg-accent/40",
      )}
      onClick={onSelect}
    >
      <span className="font-mono text-sm" dir="ltr">{symbol}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onFav(); }}
        className="p-1 hover:scale-110 transition"
        aria-label="favorite"
      >
        <Heart className={cn("size-4", fav ? "fill-destructive text-destructive" : "text-muted-foreground")} />
      </button>
    </div>
  );
}
