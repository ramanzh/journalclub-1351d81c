import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "ورود / ثبت‌نام | ژورنال کلاب" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("ورود ناموفق", { description: error.message });
    toast.success("خوش آمدی!");
    navigate({ to: "/dashboard" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error("ثبت‌نام ناموفق", { description: error.message });
    toast.success("حساب ساخته شد", { description: "ایمیل خود را برای تایید بررسی کنید." });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      setLoading(false);
      toast.error("ورود با گوگل ناموفق", { description: result.error.message });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-10 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <TrendingUp className="size-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">ژورنال کلاب</span>
        </Link>

        <div className="gradient-card rounded-2xl border border-border/60 p-6 shadow-2xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">ورود</TabsTrigger>
              <TabsTrigger value="signup">ثبت‌نام</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-l">ایمیل</Label>
                  <Input id="email-l" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-l">رمز عبور</Label>
                  <Input id="pw-l" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ورود"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-s">نام</Label>
                  <Input id="name-s" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-s">ایمیل</Label>
                  <Input id="email-s" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-s">رمز عبور</Label>
                  <Input id="pw-s" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} dir="ltr" />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-semibold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ساخت حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> یا <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            ورود با گوگل
          </Button>
        </div>
      </div>
    </div>
  );
}
