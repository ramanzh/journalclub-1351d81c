import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { TradingRule } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/rules")({
  component: RulesPage,
});

function RulesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["trading_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TradingRule[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("trading_rules").insert([
        {
          user_id: user?.id,
          title,
          description: description || null,
          active: true,
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
      toast.success("قانون جدید اضافه شد");
      setTitle("");
      setDescription("");
    },
    onError: (error: any) => {
      toast.error("خطا در ذخیره قانون", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trading_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
      toast.success("قانون حذف شد");
    },
    onError: (error: any) => {
      toast.error("خطا در حذف قانون", { description: error.message });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("trading_rules")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
    },
    onError: (error: any) => {
      toast.error("خطا در بروزرسانی قانون", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  return (
    <AppShell title="قوانین معاملاتی">
      <div className="space-y-6">
        <div className="gradient-card rounded-2xl border border-border/60 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="size-4 text-primary" /> افزودن قانون جدید
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان قانون</label>
              <Input
                placeholder="مثلاً: در زمان اخبار پر اهمیت معامله نکن"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات (اختیاری)</label>
              <Textarea
                placeholder="جزئیات بیشتر یا معیارهای خاص..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full gap-2 gradient-primary text-primary-foreground"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ثبت قانون
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">قوانین من</h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 bg-card rounded-xl border border-dashed border-border">
              هنوز قانونی تعریف نشده. اولین قانونت رو بالا بساز!
            </p>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="gradient-card border border-border/60 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 text-right">
                    <h4 className={`font-medium ${!rule.active ? "line-through text-muted-foreground" : ""}`}>
                      {rule.title}
                    </h4>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMutation.mutate({ id: rule.id, active: !rule.active })}
                      className={rule.active ? "text-primary" : "text-muted-foreground"}
                      title={rule.active ? "غیرفعال کن" : "فعال کن"}
                    >
                      {rule.active
                        ? <CheckCircle className="size-5" />
                        : <XCircle className="size-5" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("این قانون حذف شود؟")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="حذف قانون"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}ateFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import type { TradingRule } from "@/lib/trade-utils";

export const Route = createFileRoute("/_authenticated/rules")({
  component: RulesPage,
});

function RulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["trading_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TradingRule[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("trading_rules").insert([
        {
          user_id: user?.id,
          title,
          description: description || null,
          active: true,
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
      toast({
        title: "Rule created",
        description: "Your trading rule has been saved successfully.",
      });
      setTitle("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create rule",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trading_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
      toast({
        title: "Rule deleted",
        description: "The trading rule has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rule",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("trading_rules")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading_rules"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rule",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate();
  };

  return (
    <AppShell title="Trading Rules">
      <div className="space-y-6">
        <div className="gradient-card rounded-2xl border border-border/60 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="size-4 text-primary" /> Add New Rule
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rule Title</label>
              <Input
                placeholder="e.g., Don't trade during high-impact news"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                placeholder="Add more details or specific criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full gap-2">
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Rule
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Rules</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 bg-card rounded-xl border border-dashed border-border">
              No trading rules defined yet. Create your first rule above!
            </p>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className={`font-medium ${!rule.active ? "line-through text-muted-foreground" : ""}`}>
                      {rule.title}
                    </h4>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMutation.mutate({ id: rule.id, active: !rule.active })}
                      className={rule.active ? "text-primary" : "text-muted-foreground"}
                    >
                      {rule.active ? <CheckCircle className="size-5" /> : <XCircle className="size-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this rule?")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
