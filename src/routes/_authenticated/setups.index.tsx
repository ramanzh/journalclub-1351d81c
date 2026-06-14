import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Loader2, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetupImage } from "@/components/setup-images";
import type { TradeSetup } from "@/lib/trade-utils";
import { formatDate } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/setups/")({
  head: () => ({ meta: [{ title: "کتابخانه ستاپ‌ها | ژورنال کلاب" }] }),
  component: SetupsList,
});

function SetupsList() {
  const { user } = useAuth();
  const { data: setups = [], isLoading } = useQuery({
    queryKey: ["trade_setups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trade_setups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TradeSetup[];
    },
    enabled: !!user,
  });

  return (
    <AppShell title="کتابخانه ستاپ‌ها">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">پایگاه شخصی ستاپ‌های معاملاتی خود را بسازید.</p>
          <Link to="/setups/new"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            <Plus className="size-4" /> ستاپ جدید
          </Link>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : setups.length === 0 ? (
          <div className="gradient-card rounded-2xl border border-border/60 p-10 text-center">
            <BookOpen className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">هنوز ستاپی نداری</h3>
            <p className="text-sm text-muted-foreground mb-4">اولین ستاپ خودت رو اضافه کن.</p>
            <Link to="/setups/new"><Button className="gradient-primary text-primary-foreground">افزودن ستاپ</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {setups.map((s) => (
              <Link key={s.id} to="/setups/$id" params={{ id: s.id }}
                className="group gradient-card rounded-2xl border border-border/60 p-4 hover:border-primary/50 hover:-translate-y-1 transition-all">
                {s.image_urls[0] ? (
                  <SetupImage path={s.image_urls[0]} />
                ) : (
                  <div className="w-full aspect-video bg-muted/40 rounded-lg grid place-items-center">
                    <BookOpen className="size-10 text-muted-foreground" />
                  </div>
                )}
                <div className="mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{s.name}</h3>
                    {s.category && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s.category}</span>}
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">{formatDate(s.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
