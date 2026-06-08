import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { formatDateTime, type JournalEntry } from "@/lib/trade-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, BookOpen, Loader2, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/journal/")({
  head: () => ({ meta: [{ title: "ژورنال | ژورنال کلاب" }] }),
  component: JournalPage,
});

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function JournalPage() {
  const [q, setQ] = useState("");
  const [desc, setDesc] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_entries").select("*").order("entry_date", { ascending: false });
      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  const entries = useMemo(() => {
    let list = data ?? [];
    if (q) {
      const k = q.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(k) || stripHtml(e.content).toLowerCase().includes(k));
    }
    list = [...list].sort((a, b) => {
      const av = new Date(a.entry_date).getTime();
      const bv = new Date(b.entry_date).getTime();
      return desc ? bv - av : av - bv;
    });
    return list;
  }, [data, q, desc]);

  return (
    <AppShell title="ژورنال">
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در یادداشت‌ها..." className="pr-9" />
        </div>
        <Button variant="outline" onClick={() => setDesc((v) => !v)} className="gap-2">
          <ArrowUpDown className="size-4" /> {desc ? "جدیدترین" : "قدیمی‌ترین"}
        </Button>
        <Link to="/journal/new" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <Plus className="size-4" /> یادداشت جدید
        </Link>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <div className="gradient-card rounded-2xl border border-border/60 p-12 text-center">
          <BookOpen className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{q ? "نتیجه‌ای یافت نشد." : "هنوز یادداشتی نوشته‌اید."}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e) => (
            <Link key={e.id} to="/journal/$id" params={{ id: e.id }}
              className="gradient-card rounded-2xl border border-border/60 p-5 hover:border-primary/40 transition">
              <div className="text-xs text-muted-foreground mb-2">{formatDateTime(e.entry_date)}</div>
              <h3 className="font-bold mb-2 line-clamp-2">{e.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{stripHtml(e.content).slice(0, 160)}</p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
