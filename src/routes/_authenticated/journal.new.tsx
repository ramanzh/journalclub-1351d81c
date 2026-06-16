import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { RichEditor } from "@/components/rich-editor";
import { JournalImages } from "@/components/journal-images";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlignRight, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { SetupTagPicker } from "@/components/setup-tag-picker";

export const Route = createFileRoute("/_authenticated/journal/new")({
  head: () => ({ meta: [{ title: "یادداشت جدید | ژورنال کلاب" }] }),
  component: NewEntry,
});

function NewEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [setupTags, setSetupTags] = useState<string[]>([]);
  const [textDir, setTextDir] = useState<"rtl" | "ltr">("rtl");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: title.trim(),
      content,
      image_urls: images,
      setup_tags: setupTags,
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

        {/* تگ‌های ستاپ */}
        <div className="space-y-2">
          <Label>تگ‌های ستاپ</Label>
          <SetupTagPicker userId={user.id} value={setupTags} onChange={setSetupTags} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>محتوا</Label>
            {/* دکمه راست‌چین / چپ‌چین */}
            <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setTextDir("rtl")}
                className={`p-1.5 rounded transition ${textDir === "rtl" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                title="راست‌چین"
              >
                <AlignRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTextDir("ltr")}
                className={`p-1.5 rounded transition ${textDir === "ltr" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                title="چپ‌چین"
              >
                <AlignLeft className="size-3.5" />
              </button>
            </div>
          </div>
          <div dir={textDir}>
            <RichEditor value={content} onChange={setContent} userId={user.id} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>تصاویر</Label>
          <JournalImages userId={user.id} value={images} onChange={setImages} />
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
