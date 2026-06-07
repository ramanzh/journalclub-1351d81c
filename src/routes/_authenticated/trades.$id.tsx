import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { TradeForm } from "@/components/trade-form";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Trade } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/trades/$id")({
  head: () => ({ meta: [{ title: "ویرایش معامله | ژورنال معاملاتی" }] }),
  component: EditTrade,
});

function EditTrade() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["trades", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Trade | null;
    },
  });

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این معامله مطمئن هستید؟")) return;
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    toast.success("معامله حذف شد");
    qc.invalidateQueries({ queryKey: ["trades"] });
    navigate({ to: "/trades" });
  };

  if (!user) return null;

  return (
    <AppShell title="ویرایش معامله">
      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : !data ? (
        <p className="text-muted-foreground">معامله یافت نشد.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4 ml-2" /> حذف معامله
            </Button>
          </div>
          <TradeForm trade={data} userId={user.id} />
        </div>
      )}
    </AppShell>
  );
}
