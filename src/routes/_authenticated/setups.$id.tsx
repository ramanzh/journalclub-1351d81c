import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { SetupImages } from "@/components/setup-images";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TradeSetup } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/setups/$id")({
  head: () => ({ meta: [{ title: "ویرایش ستاپ | ژورنال کلاب" }] }),
  component: EditSetup,
});

function EditSetup() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["trade_setups", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trade_setups").select("*").eq("id", id).single();
      if (error) throw error;
      return data as TradeSetup;
    },
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [market, setMarket] = useState("forex");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.name); setCategory(data.category ?? "");
    setMarket(data.market ?? "forex"); setDescription(data.description ?? "");
    setNotes(data.notes ?? ""); setImages(data.image_urls ?? []);
  }, [data]);

  if (!user) return null;
  if (isLoading || !data) return <AppShell title="ویرایش ستاپ"><div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-primary" /></div></AppShell>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("trade_setups").update({
      name: name.trim(), category: category.trim() || null, market,
      description: description.trim() || null, notes: notes.trim() || null,
      image_urls: images,
    }).eq("id", id);
    setSaving(false);
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success("ذخیره شد");
    qc.invalidateQueries({ queryKey: ["trade_setups"] });
    navigate({ to: "/setups" });
  };

  const remove = async () => {
    if (!confirm("حذف این ستاپ؟")) return;
    const { error } = await supabase.from("trade_setups").delete().eq("id", id);
    if (error) return toast.error("حذف ناموفق", { description: error.message });
    toast.success("حذف شد");
    navigate({ to: "/setups" });
  };

  return (
    <AppShell title="ویرایش ستاپ">
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>نام ستاپ *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>دسته‌بندی</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>بازار</Label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="forex">فارکس</SelectItem>
                <SelectItem value="crypto">کریپتو</SelectItem>
                <SelectItem value="stock">سهام</SelectItem>
                <SelectItem value="all">همه</SelectItem>
              </SelectContent>
            </Select></div>
        </div>
        <div className="space-y-1.5"><Label>توضیحات</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>یادداشت‌ها</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>تصاویر</Label>
          <SetupImages userId={user.id} value={images} onChange={setImages} /></div>
        <div className="flex gap-3 justify-between">
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground px-8">
              {saving ? <Loader2 className="size-4 animate-spin" /> : "ذخیره تغییرات"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/setups" })}>انصراف</Button>
          </div>
          <Button type="button" variant="destructive" onClick={remove}>
            <Trash2 className="size-4 ml-1" /> حذف
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
