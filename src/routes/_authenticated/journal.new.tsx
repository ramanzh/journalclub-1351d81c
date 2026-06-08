import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { RichEditor } from "@/components/rich-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/journal/new")({
  head: () => ({ meta: [{ title: "یادداشت جدید | ژورنال کلاب" }] }),
  component: NewEntry,
});

function NewEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id, title: title.trim(), content,
    });
    setSaving(false);
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success("یادداشت ذخیره شد");
    navigate({ to: "/journal" });
  };

  return (
    <AppShell title="یادداشت جدید">
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <div className="space-y-2">
          <Label>عنوان</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="عنوان یادداشت" />
        </div>
        <div className="space-y-2">
          <Label>محتوا</Label>
          <RichEditor value={content} onChange={setContent} userId={user.id} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground px-8">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "ذخیره"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/journal" })}>انصراف</Button>
        </div>
      </form>
    </AppShell>
  );
}
