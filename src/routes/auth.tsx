import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "ورود / ثبت‌نام | ژورنال کلاب" }] }),
  component: AuthPage,
});

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("ایمیل نامعتبر است");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("ایمیل یا رمز عبور اشتباه است");
      } else {
        toast.error("ورود ناموفق", { description: error.message });
      }
      return;
    }
    toast.success("خوش آمدی!");
    navigate({ to: "/dashboard" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("ایمیل نامعتبر است");
      return;
    }
    if (password.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) {
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered") ||
        error.message.toLowerCase().includes("exists")
      ) {
        toast.error("حسابی با این ایمیل از قبل وجود دارد", {
          description: "لطفاً وارد حساب خود شوید یا رمز عبور را بازیابی کنید.",
        });
      } else {
        toast.error("ثبت‌نام ناموفق", { description: error.message });
      }
      return;
    }
    // Supabase returns a user with empty identities[] when the email already exists
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      toast.error("حسابی با این ایمیل از قبل وجود دارد", {
        description: "لطفاً وارد حساب خود شوید یا رمز عبور را بازیابی کنید.",
      });
      return;
    }
    toast.success("حساب ساخته شد", {
      description: "ایمیل خود را برای تایید بررسی کنید.",
    });
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      toast.error("ایمیل نامعتبر است");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setLoading(false);
    if (error) {
      toast.error("خطا در ارسال ایمیل", { description: error.message });
      return;
    }
    setForgotSent(true);
  };

  // صفحه فراموشی رمز عبور
  if (showForgot) {
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
            <button
              onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition"
            >
              <ArrowRight className="size-4" />
              بازگشت
            </button>

            <h2 className="text-lg font-bold mb-1">بازیابی رمز عبور</h2>
            <p className="text-sm text-muted-foreground mb-6">
              ایمیل خود را وارد کنید. لینک بازیابی برایتان ارسال می‌شود.
            </p>

            {forgotSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="size-14 rounded-full bg-primary/10 grid place-items-center mx-auto">
                  <TrendingUp className="size-6 text-primary" />
                </div>
                <p className="font-semibold">ایمیل ارسال شد!</p>
                <p className="text-sm text-muted-foreground">
                  لطفاً صندوق ورودی <span className="text-foreground font-medium">{forgotEmail}</span> را بررسی کنید.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                  className="text-sm text-primary hover:underline"
                >
                  بازگشت به صفحه ورود
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">ایمیل</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="example@email.com"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-primary text-primary-foreground font-semibold"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ارسال لینک بازیابی"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // صفحه اصلی ورود/ثبت‌نام
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
                  <Input
                    id="email-l"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="example@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pw-l">رمز عبور</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      فراموشی رمز عبور؟
                    </button>
                  </div>
                  <Input
                    id="pw-l"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-primary text-primary-foreground font-semibold"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ورود"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-s">نام</Label>
                  <Input
                    id="name-s"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="نام شما"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-s">ایمیل</Label>
                  <Input
                    id="email-s"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="example@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-s">رمز عبور</Label>
                  <Input
                    id="pw-s"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    dir="ltr"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-primary text-primary-foreground font-semibold"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "ساخت حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> یا <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            ورود با گوگل
          </Button>
        </div>
      </div>
    </div>
  );
}

