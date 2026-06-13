import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ChecklistItem } from "@/lib/trade-utils";

export function ChecklistPicker({
  userId, value, onChange,
}: { userId: string; value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data: items = [] } = useQuery({
    queryKey: ["checklist_items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_items").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
  });

  const toggle = (key: string) => onChange({ ...value, [key]: !value[key] });

  const addItem = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const key = `c_${Date.now()}`;
    const { error } = await supabase.from("checklist_items").insert({
      user_id: userId, key, label, is_default: false, sort_order: items.length,
    });
    if (error) return toast.error("افزودن ناموفق", { description: error.message });
    setNewLabel("");
    qc.invalidateQueries({ queryKey: ["checklist_items", userId] });
  };

  const saveEdit = async (id: string) => {
    const label = editing[id]?.trim();
    if (!label) return;
    const { error } = await supabase.from("checklist_items").update({ label }).eq("id", id);
    if (error) return toast.error("ویرایش ناموفق", { description: error.message });
    setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
    qc.invalidateQueries({ queryKey: ["checklist_items", userId] });
  };

  const removeItem = async (id: string) => {
    if (!confirm("حذف این مورد؟")) return;
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    qc.invalidateQueries({ queryKey: ["checklist_items", userId] });
  };

  const completed = items.filter((it) => value[it.key]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          تکمیل‌شده: {completed} از {items.length}
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Settings className="size-3" /> مدیریت چک‌لیست
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>مدیریت چک‌لیست</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="عنوان مورد جدید" />
                <Button type="button" onClick={addItem}><Plus className="size-4" /></Button>
              </div>
              <div className="max-h-72 overflow-auto space-y-1.5">
                {items.map((it) => {
                  const isEdit = editing[it.id] !== undefined;
                  return (
                    <div key={it.id} className="flex items-center gap-2 rounded-lg border border-border/50 p-2">
                      {isEdit ? (
                        <Input value={editing[it.id]} onChange={(e) => setEditing((p) => ({ ...p, [it.id]: e.target.value }))} className="h-8" />
                      ) : (
                        <span className="flex-1 text-sm">{it.label}</span>
                      )}
                      {isEdit ? (
                        <Button size="sm" type="button" onClick={() => saveEdit(it.id)}>ذخیره</Button>
                      ) : (
                        <Button size="sm" variant="ghost" type="button" onClick={() => setEditing((p) => ({ ...p, [it.id]: it.label }))}>ویرایش</Button>
                      )}
                      <Button size="icon" variant="ghost" type="button" className="text-destructive" onClick={() => removeItem(it.id)}>
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

      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((it) => (
          <label key={it.id} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition ${
            value[it.key] ? "border-primary/60 bg-primary/5" : "border-border/50 hover:bg-accent/30"
          }`}>
            <Checkbox checked={!!value[it.key]} onCheckedChange={() => toggle(it.key)} />
            <span className="text-sm">{it.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
