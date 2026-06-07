import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, LineChart, BookOpen, Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ژورنال کلاب فارسی | ثبت و تحلیل معاملات" },
      { name: "description", content: "پلتفرم حرفه‌ای ثبت معاملات فارکس، کریپتو و سهام با تحلیل آماری و ژورنال احساسی." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center shadow-glow">
              <TrendingUp className="size-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ژورنال کلاب</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition">ورود</Link>
            <Link to="/auth" className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              شروع کن
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          ساخته شده برای معامله‌گران ایرانی
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-3xl mx-auto">
          معاملاتت رو حرفه‌ای
          <span className="block bg-gradient-to-l from-primary to-chart-3 bg-clip-text text-transparent">
            ثبت و تحلیل کن
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          ژورنال کلاب فارسی برای فارکس، کریپتو و سهام. آمار، نمودار و ژورنال احساسی در یک پلتفرم.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow">
            ساخت حساب رایگان
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { Icon: BookOpen, title: "ژورنال احساسی", desc: "احساس قبل و بعد معامله، اشتباهات و درس‌ها رو ثبت کن." },
          { Icon: LineChart, title: "آمار حرفه‌ای", desc: "نرخ برد، نسبت ریسک به ریوارد و عملکرد ماهانه." },
          { Icon: Shield, title: "امن و خصوصی", desc: "داده‌هات فقط متعلق به خودته. رمزنگاری و دسترسی محدود." },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="gradient-card rounded-2xl border border-border/60 p-6">
            <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
              <Icon className="size-5" />
            </div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
