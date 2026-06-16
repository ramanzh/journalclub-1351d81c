import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SetupItem = {
  id: string;
  name: string;
  source: "library" | "tag";
};

export function SetupTagPicker({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  // خواندن از هر دو جدول و merge کردن
  const { data: allSetups = [], isLoading } = useQuery({
    queryKey: ["all_setups", userId],
    queryFn: async () => {
      const [tagsRes, libraryRes] = await Promise.all([
        supabase.from("setup_tags").select("id, name").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("setups").select("id, name").eq("user_id", userId).order("created_at", { ascending: true }),
      ]);

      const tags: SetupItem[] = (tagsRes.data ?? []).map((t) => ({ id: t.id, name: t.name, source: "tag" }));
      const library: SetupItem[] = (libraryRes.data ?? []).map((s) => ({ id: s.id, name: s.name, source: "library" }));

      // حذف تکراری‌ها بر اساس name
      const seen = new Set<string>();
      const merged: SetupItem[] = [];
      for (const item of [...tags, ...library]) {
        if (!seen.has(item.name)) {
          seen.add(item.name);
          merged.push(item);
        }
      }
      return merged;
    },
  });

  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);
  };

  const addTag = async () => {
    const name = newName.trim();
    if (!name) return;
    const { error } = await supabase.from("setup_tags").insert({ user_id: userId, name, is_default: false });
    if (error) return toast.error("افزودن ناموفق", { description: error.message });
    setNewName("");
    qc.invalidateQueries({ queryKey: ["all_setups", userId] });
    toast.success("تگ جدید اضافه شد");
  };

  const saveEdit = async (item: SetupItem) => {
    const name = editing[item.id]?.trim();
    if (!name) return;
    const table = item.source === "library" ? "setups" : "setup_tags";
    const { error } = await supabase.from(table).update({ name }).eq("id", item.id);
    if (error) return toast.error("ویرایش ناموفق", { description: error.message });
    setEditing((p) => { const n = { ...p }; delete n[item.id]; return n; });
    qc.invalidateQueries({ queryKey: ["all_setups", userId] });
  };

  const removeItem = async (item: SetupItem) => {
    if (!confirm(`حذف «${item.name}»؟`)) return;
    const table = item.source === "library" ? "setups" : "setup_tags";
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    onChange(value.filter((n) => n !== item.name));
    qc.invalidateQueries({ queryKey: ["all_setups", userId] });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          allSetups.map((s) => {
            const active = value.includes(s.name);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.name)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105"
                    : "border-border/60 hover:bg-accent/50"
                }`}
              >
                {s.name}
                {s.source === "library" && (
                  <span className="mr-1 opacity-50 text-[9px]">📚</span>
                )}
              </button>
            );
          })
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="px-3 py-1.5 rounded-full text-xs border border-dashed border-border/60 inline-flex items-center gap-1 hover:bg-accent/40 transition">
              <Plus className="size-3" /> تگ جدید / مدیریت
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>مدیریت تگ‌های ستاپ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="نام تگ جدید"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}><Plus className="size-4" /></Button>
              </div>
              <div className="max-h-72 overflow-auto space-y-1.5">
                {allSetups.map((s) => {
                  const isEdit = editing[s.id] !== undefined;
                  return (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border/50 p-2">
                      {isEdit ? (
                        <Input
                          value={editing[s.id]}
                          onChange={(e) => setEditing((p) => ({ ...p, [s.id]: e.target.value }))}
                          className="h-8"
                        />
                      ) : (
                        <span className="flex-1 text-sm flex items-center gap-1">
                          {s.name}
                          {s.source === "library" && <span className="text-[10px] text-muted-foreground">(کتابخانه)</span>}
                        </span>
                      )}
                      {isEdit ? (
                        <Button size="sm" type="button" onClick={() => saveEdit(s)}>ذخیره</Button>
                      ) : (
                        <Button size="sm" variant="ghost" type="button" onClick={() => setEditing((p) => ({ ...p, [s.id]: s.name }))}>ویرایش</Button>
                      )}
                      <Button size="icon" variant="ghost" type="button" className="text-destructive" onClick={() => removeItem(s)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
