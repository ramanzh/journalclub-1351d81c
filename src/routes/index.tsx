import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, LineChart, BookOpen, Wallet, BarChart3, Brain,
  ArrowLeft, Phone, Mail, ShieldCheck, Sparkles,
} from "lucide-react";
import tradingBg from "@/assets/trading-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ژورنال کلاب | پلتفرم حرفه‌ای ژورنال‌نویسی معاملاتی" },
      { name: "description", content: "ژورنال کلاب: ثبت و تحلیل معاملات فارکس، کریپتو و سهام، مدیریت چند حساب دمو/پراپ/واقعی، آمار حرفه‌ای و ژورنال روانشناسی معاملاتی." },
      { property: "og:title", content: "ژورنال کلاب | پلتفرم حرفه‌ای ژورنال‌نویسی معاملاتی" },
      { property: "og:description", content: "مدیریت چند حساب، تحلیل عملکرد و ژورنال روانشناسی در یک پلتفرم مدرن." },
    ],
  }),
  component: Landing,
});

// Lightweight intersection-observer reveal
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

function Landing() {
  const features = [
    { Icon: BookOpen, title: "ژورنال معاملاتی", desc: "هر معامله را با جزئیات کامل ثبت کنید: نقطه ورود، خروج، حد ضرر، حد سود، اسکرین‌شات و نوت‌های شخصی." },
    { Icon: Wallet, title: "مدیریت چند حساب", desc: "حساب‌های دمو، پراپ فرم و واقعی را در یک داشبورد دنبال کنید و عملکرد هرکدام را جداگانه تحلیل کنید." },
    { Icon: BarChart3, title: "آمار حرفه‌ای", desc: "نرخ برد، نسبت ریسک به ریوارد، میانگین بازده درصدی و نمودار اکوییتی به‌صورت بلادرنگ." },
    { Icon: Brain, title: "روانشناسی معامله", desc: "احساسات قبل و بعد از معامله، اشتباهات تکراری و درس‌های آموخته را ثبت کنید تا الگوها را بشناسید." },
    { Icon: LineChart, title: "رشد حساب", desc: "نمودار رشد سرمایه برای هر حساب، روند برداشت/پرداخت و درصد رشد ماهانه." },
    { Icon: Sparkles, title: "یادداشت و دفترچه", desc: "ویرایشگر متنی پیشرفته برای یادداشت‌های روزانه، تحلیل بازار و افزودن تصاویر چارت." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center shadow-glow">
              <TrendingUp className="size-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ژورنال کلاب</span>
          </div>
          <nav className="flex items-center gap-3">
            <a href="#features" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition">ویژگی‌ها</a>
            <a href="#contact" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition">تماس</a>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition">ورود</Link>
            <Link to="/auth" className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform">
              شروع کن
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${tradingBg})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,_var(--primary)_15%,_transparent),_transparent_60%)]" aria-hidden="true" />

        <div className="container relative mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              ساخته‌شده برای معامله‌گران فارسی‌زبان
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-3xl mx-auto">
              معاملاتت رو حرفه‌ای
              <span className="block bg-gradient-to-l from-primary via-chart-3 to-primary bg-clip-text text-transparent">
                ثبت، تحلیل و رشد بده
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ژورنال کلاب یک پلتفرم مدرن برای مدیریت چند حساب معاملاتی، تحلیل آماری عملکرد،
              ثبت ژورنال احساسی و پیگیری رشد سرمایه — مخصوص بازارهای فارکس، کریپتو و سهام.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform">
                ساخت حساب
                <ArrowLeft className="size-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur px-6 py-3 font-semibold hover:bg-card transition">
                مشاهده ویژگی‌ها
              </a>
            </div>
          </Reveal>

          <Reveal delay={450}>
            <div className="mt-14 grid grid-cols-3 max-w-2xl mx-auto gap-4 text-center">
              {[
                { k: "+۳", v: "نوع حساب" },
                { k: "۳", v: "بازار اصلی" },
                { k: "۲۴/۷", v: "دسترسی" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border/40 bg-card/40 backdrop-blur px-3 py-4 hover:border-primary/40 transition">
                  <div className="text-2xl font-bold text-primary num">{s.k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">هرچیزی که برای رشد لازم داری</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              ابزارهای حرفه‌ای که در یک پلتفرم مدرن، تجربه تریدینگ تو رو متحول می‌کنه.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="group h-full gradient-card rounded-2xl border border-border/60 p-6 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-glow">
                <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Multi-account highlight */}
      <section className="container mx-auto px-4 py-16">
        <Reveal>
          <div className="gradient-card rounded-3xl border border-border/60 p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary mb-3">
                <ShieldCheck className="size-4" /> چند حساب در یک داشبورد
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                دمو، پراپ فرم و حساب واقعی؛ همه در یک جا
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                حساب‌های مختلف خود را با موجودی اولیه، بروکر و نوع حساب ثبت کنید.
                هر معامله را به حساب مربوطه متصل کنید و آمار، نمودار اکوییتی و درصد رشد
                هر حساب را به‌صورت مجزا ببینید.
              </p>
              <Link to="/auth" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                همین حالا شروع کن <ArrowLeft className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
             {[
               { label: "دمو", Icon: Wallet },
               { label: "پراپ فرم", Icon: Wallet },
               { label: "واقعی", Icon: Wallet },
             ].map((a) => (
               <div
                 key={a.label}
                 className="group rounded-2xl border border-border/40 p-4 bg-gradient-to-b from-muted/20 to-muted/5 hover:from-primary/30 hover:to-primary/5 hover:border-primary/40 hover:scale-105 transition-all duration-300 cursor-pointer"
               >
                 <Wallet className="size-5 text-muted-foreground mb-2 group-hover:text-primary transition-colors duration-300" />
                 <div className="text-xs text-muted-foreground">حساب</div>
                 <div className="font-bold group-hover:text-primary transition-colors duration-300">{a.label}</div>
          </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">آماده‌ای حرفه‌ای ترید کنی؟</h2>
            <p className="mt-3 text-muted-foreground">
              همین حالا حساب رایگانت رو بساز و اولین معامله‌ات رو ثبت کن.
            </p>
            <Link to="/auth" className="mt-6 inline-flex items-center gap-2 rounded-lg gradient-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform">
              ساخت حساب <ArrowLeft className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer with contact */}
      <footer id="contact" className="border-t border-border/40 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 rounded-lg gradient-primary grid place-items-center shadow-glow">
                <TrendingUp className="size-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">ژورنال کلاب</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              پلتفرم ژورنال‌نویسی و تحلیل معاملات برای تریدرهای حرفه‌ای فارسی‌زبان.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">دسترسی سریع</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition">ویژگی‌ها</a></li>
              <li><Link to="/auth" className="hover:text-foreground transition">ورود</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition">ساخت حساب</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">تماس با ما</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+989000000000" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition group" dir="ltr">
                  <span className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center group-hover:bg-primary/20 transition">
                    <Phone className="size-4" />
                  </span>
                  <span className="num">+98 900 000 0000</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@journalclub.app" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition group" dir="ltr">
                  <span className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center group-hover:bg-primary/20 transition">
                    <Mail className="size-4" />
                  </span>
                  <span>info@journalclub.app</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40">
          <div className="container mx-auto px-4 py-5 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} ژورنال کلاب — تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  );
}
