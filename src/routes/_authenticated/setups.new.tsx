import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { SetupImages } from "@/components/setup-images";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/setups/new")({
  head: () => ({ meta: [{ title: "ستاپ جدید | ژورنال کلاب" }] }),
  component: NewSetup,
});

function NewSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [market, setMarket] = useState("forex");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("trade_setups").insert({
      user_id: user.id, name: name.trim(),
      category: category.trim() || null,
      market, description: description.trim() || null,
      notes: notes.trim() || null, image_urls: images,
    });
    setSaving(false);
    if (error) return toast.error("ذخیره ناموفق", { description: error.message });
    toast.success("ستاپ اضافه شد");
    navigate({ to: "/setups" });
  };

  return (
    <AppShell title="ستاپ جدید">
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>نام ستاپ *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: FVG Setup" /></div>
          <div className="space-y-1.5"><Label>دسته‌بندی</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="مثال: ICT / Smart Money" /></div>
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
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ستاپ را به‌طور خلاصه شرح بده..." /></div>
        <div className="space-y-1.5"><Label>یادداشت‌ها</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="نکات اجرا، شرایط ورود، تأییدیه‌ها..." /></div>
        <div className="space-y-1.5"><Label>تصاویر نمونه</Label>
          <SetupImages userId={user.id} value={images} onChange={setImages} /></div>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground px-8">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "ذخیره"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/setups" })}>انصراف</Button>
        </div>
      </form>
    </AppShell>
  );
}
