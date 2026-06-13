import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SetupTag } from "@/lib/trade-utils";

export function SetupTagPicker({
  userId, value, onChange,
}: { userId: string; value: string[]; onChange: (v: string[]) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["setup_tags", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setup_tags").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SetupTag[];
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
    qc.invalidateQueries({ queryKey: ["setup_tags", userId] });
  };

  const saveEdit = async (id: string) => {
    const name = editing[id]?.trim();
    if (!name) return;
    const { error } = await supabase.from("setup_tags").update({ name }).eq("id", id);
    if (error) return toast.error("ویرایش ناموفق", { description: error.message });
    setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
    qc.invalidateQueries({ queryKey: ["setup_tags", userId] });
  };

  const removeTag = async (id: string, name: string) => {
    if (!confirm(`حذف تگ «${name}»؟`)) return;
    const { error } = await supabase.from("setup_tags").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    onChange(value.filter((n) => n !== name));
    qc.invalidateQueries({ queryKey: ["setup_tags", userId] });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {isLoading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : tags.map((t) => {
          const active = value.includes(t.name);
          return (
            <button key={t.id} type="button" onClick={() => toggle(t.name)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "border-border/60 hover:bg-accent/50"
              }`}>
              {t.name}
            </button>
          );
        })}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="px-3 py-1.5 rounded-full text-xs border border-dashed border-border/60 inline-flex items-center gap-1 hover:bg-accent/40">
              <Settings className="size-3" /> مدیریت تگ‌ها
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>مدیریت تگ‌های ستاپ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="نام تگ جدید" />
                <Button type="button" onClick={addTag}><Plus className="size-4" /></Button>
              </div>
              <div className="max-h-72 overflow-auto space-y-1.5">
                {tags.map((t) => {
                  const isEdit = editing[t.id] !== undefined;
                  return (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border/50 p-2">
                      {isEdit ? (
                        <Input value={editing[t.id]} onChange={(e) => setEditing((p) => ({ ...p, [t.id]: e.target.value }))}
                          className="h-8" />
                      ) : (
                        <span className="flex-1 text-sm">{t.name} {t.is_default && <span className="text-xs text-muted-foreground mr-1">(پیش‌فرض)</span>}</span>
                      )}
                      {isEdit ? (
                        <Button size="sm" type="button" onClick={() => saveEdit(t.id)}>ذخیره</Button>
                      ) : (
                        <Button size="sm" variant="ghost" type="button" onClick={() => setEditing((p) => ({ ...p, [t.id]: t.name }))}>ویرایش</Button>
                      )}
                      <Button size="icon" variant="ghost" type="button" className="text-destructive" onClick={() => removeTag(t.id, t.name)}>
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
