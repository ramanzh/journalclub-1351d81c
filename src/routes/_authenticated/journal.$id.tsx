import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { RichEditor } from "@/components/rich-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { JournalEntry } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/journal/$id")({
  head: () => ({ meta: [{ title: "یادداشت | ژورنال کلاب" }] }),
  component: EditEntry,
});

function EditEntry() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["journal", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_entries").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as JournalEntry | null;
    },
  });

  useEffect(() => {
    if (data) { setTitle(data.title); setContent(data.content); }
  }, [data]);

  if (!user) return null;
  if (isLoading) return <AppShell title="یادداشت"><Loader2 className="size-6 animate-spin text-primary mx-auto my-12" /></AppShell>;
  if (!data) return <AppShell title="یادداشت"><p className="text-muted-foreground">یافت نشد.</p></AppShell>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("journal_entries").update({ title: title.trim(), content }).eq("id", id);
    setSaving(false);
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success("به‌روزرسانی شد");
    qc.invalidateQueries({ queryKey: ["journal"] });
  };

  const remove = async () => {
    if (!confirm("حذف این یادداشت؟")) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    qc.invalidateQueries({ queryKey: ["journal"] });
    navigate({ to: "/journal" });
  };

  return (
    <AppShell title="ویرایش یادداشت">
      <div className="max-w-3xl">
        <div className="flex justify-end mb-3">
          <Button variant="ghost" onClick={remove} className="text-destructive">
            <Trash2 className="size-4 ml-2" /> حذف
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>محتوا</Label>
            <RichEditor value={content} onChange={setContent} userId={user.id} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground px-8">
              {saving ? <Loader2 className="size-4 animate-spin" /> : "ذخیره تغییرات"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/journal" })}>بازگشت</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
