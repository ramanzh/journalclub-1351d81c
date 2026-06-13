import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Star, Search, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { INSTRUMENTS } from "@/lib/instruments";
import type { FavoriteInstrument, Trade } from "@/lib/trade-utils";
import { cn } from "@/lib/utils";

export function InstrumentPicker({
  market, value, onChange, userId,
}: {
  market: Trade["market"];
  value: string;
  onChange: (v: string) => void;
  userId: string;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

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
    if (value && !base.includes(value)) base.push(value);
    const filtered = search
      ? base.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
      : base;
    const favs = filtered.filter((s) => favSet.has(s)).sort();
    const rest = filtered.filter((s) => !favSet.has(s)).sort();
    return { favs, rest };
  }, [market, value, favSet, search]);

  const toggleFav = async (symbol: string) => {
    const existing = (favorites ?? []).find((f) => f.market === market && f.symbol === symbol);
    if (existing) {
      await supabase.from("favorite_instruments").delete().eq("id", existing.id);
    } else {
      await supabase.from("favorite_instruments").insert({ user_id: userId, market, symbol });
    }
    qc.invalidateQueries({ queryKey: ["favorites", userId] });
  };

  const handleSelect = (symbol: string) => {
    onChange(symbol);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2 relative">
      {/* تایپ دستی - بالا */}
<Input
  value={value}
  onChange={(e) => onChange(e.target.value.toUpperCase())}
  placeholder="تایپ کنید (مثلاً XAUUSD)"
  dir="ltr"
  className="text-sm h-9 bg-muted/20"
/>

{/* دکمه باز کردن لیست */}
<div
  className={cn(
    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all duration-200",
    open ? "border-primary ring-1 ring-primary/30" : "border-border/60 hover:border-primary/50",
    "bg-background"
  )}
  onClick={() => setOpen((p) => !p)}
>
  <span className="text-sm text-muted-foreground flex-1" dir="rtl">
    انتخاب از لیست
  </span>
  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
</div>

{/* دراپ‌داون */}
<div className={cn(
  "absolute z-50 w-full rounded-xl border border-border/60 bg-background shadow-xl overflow-hidden transition-all duration-200 origin-top",
  open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
)}>
  {/* سرچ */}
  <div className="p-2 border-b border-border/40">
    <div className="relative">
      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو..."
        dir="ltr"
        className="pr-8 h-8 text-sm bg-muted/30"
        onClick={(e) => e.stopPropagation()}
        autoFocus={open}
      />
    </div>
  </div>

  {/* لیست */}
  <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
    {search && !INSTRUMENTS[market].includes(search.toUpperCase()) && (
      <Row
        symbol={search.toUpperCase()}
        active={false}
        fav={false}
        custom
        onSelect={() => { onChange(search.toUpperCase()); setOpen(false); setSearch(""); }}
        onFav={() => {}}
      />
    )}

    {list.favs.length > 0 && (
      <>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1">
          <Star className="size-3 fill-yellow-400 text-yellow-400" /> علاقه‌مندی‌ها
        </div>
        {list.favs.map((s) => (
          <Row key={s} symbol={s} active={s === value} fav onSelect={() => handleSelect(s)} onFav={() => toggleFav(s)} />
        ))}
        <div className="h-px bg-border/40 my-1" />
      </>
    )}

    {list.rest.length === 0 && list.favs.length === 0 && (
      <div className="text-center text-xs text-muted-foreground py-6">نتیجه‌ای یافت نشد</div>
    )}

    {list.rest.map((s) => (
      <Row key={s} symbol={s} active={s === value} fav={false} onSelect={() => handleSelect(s)} onFav={() => toggleFav(s)} />
    ))}
  </div>
</div>
    </div>
  );
}

function Row({
  symbol, active, fav, custom, onSelect, onFav,
}: {
  symbol: string;
  active: boolean;
  fav: boolean;
  custom?: boolean;
  onSelect: () => void;
  onFav: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer transition-all duration-150 group",
        active
          ? "bg-primary/15 text-primary"
          : "hover:bg-accent/50",
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {custom && (
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">جدید</span>
        )}
        <span className="font-mono text-sm" dir="ltr">{symbol}</span>
      </div>
      {!custom && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-150"
          aria-label="favorite"
        >
          <Heart className={cn("size-3.5", fav ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>
      )}
    </div>
  );
}
