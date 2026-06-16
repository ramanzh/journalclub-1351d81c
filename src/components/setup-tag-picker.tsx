import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// تطبیق تایپ با ساختار کتابخانه ستاپ‌ها
type SetupItem = {
  id: string;
  name: string;
  user_id: string;
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

  // ✅ ۱. اصلاح کوئری برای خواندن مستقیم از جدول ستاپ‌های کتابخانه و فیلتر بر اساس کاربر مانیتور شده
  const { data: setups = [], isLoading } = useQuery({
    queryKey: ["setups_library", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setups") // اگر اسم جدول کتابخانه شما setups است
        .select("id, name, user_id")
        .eq("user_id", userId) // حتماً باید ستاپ‌های خود کاربر فیلتر شود
        .order("created_at", { ascending: true });

      if (error) {
        // فال‌بک به جدول تگ‌ها در صورتی که دیتابیس شما هنوز کاملاً ستاپ‌ها را تفکیک نکرده باشد
        const fallback = await supabase
          .from("setup_tags")
          .select("id, name, user_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
          
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as SetupItem[];
      }
      return (data ?? []) as SetupItem[];
    },
  });

  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);
  };

  const addSetup = async () => {
    const name = newName.trim();
    if (!name) return;
    
    // هماهنگ با جدول اصلی کتابخانه ستاپ‌ها
    const targetTable = (qc.getQueryData(["setups_library", userId]) as any)?._fromTable === "setup_tags" ? "setup_tags" : "setups";
    
    const { error } = await supabase.from(targetTable).insert({ user_id: userId, name });
    if (error) return toast.error("افزودن ناموفق", { description: error.message });
    
    setNewName("");
    qc.invalidateQueries({ queryKey: ["setups_library", userId] });
    toast.success("ستاپ جدید به کتابخانه اضافه شد");
  };

  const saveEdit = async (id: string) => {
    const name = editing[id]?.trim();
    if (!name) return;
    
    const { error } = await supabase.from("setups").update({ name }).eq("id", id);
    if (error) {
      // فال‌بک ادیت
      await supabase.from("setup_tags").update({ name }).eq("id", id);
    }
    
    setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
    qc.invalidateQueries({ queryKey: ["setups_library", userId] });
    toast.success("تغییرات ذخیره شد");
  };

  const removeSetup = async (id: string, name: string) => {
    if (!confirm(`حذف ستاپ «${name}» از کتابخانه؟`)) return;
    
    const { error } = await supabase.from("setups").delete().eq("id", id);
    if (error) {
      // فال‌بک حذف
      await supabase.from("setup_tags").delete().eq("id", id);
    }
    
    onChange(value.filter((n) => n !== name));
    qc.invalidateQueries({ queryKey: ["setups_library", userId] });
    toast.success("ستاپ حذف شد");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          setups.map((s) => {
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
              </button>
            );
          })
        )}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" className="px-3 py-1.5 rounded-full text-xs border border-dashed border-border/60 inline-flex items-center gap-1 hover:bg-accent/40 transition">
              <Plus className="size-3" /> مدیریت کتابخانه ستاپ‌ها
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>مدیریت ستاپ‌های کتابخانه</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="نام ستاپ جدید" />
                <Button type="button" onClick={addSetup}><Plus className="size-4" /></Button>
              </div>
              <div className="max-h-72 overflow-auto space-y-1.5">
                {setups.map((s) => {
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
                        <span className="flex-1 text-sm">{s.name}</span>
                      )}
                      {isEdit ? (
                        <Button size="sm" type="button" onClick={() => saveEdit(s.id)}>ذخیره</Button>
                      ) : (
                        <Button size="sm" variant="ghost" type="button" onClick={() => setEditing((p) => ({ ...p, [s.id]: s.name }))}>ویرایش</Button>
                      )}
                      <Button size="icon" variant="ghost" type="button" className="text-destructive" onClick={() => removeSetup(s.id, s.name)}>
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
