import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, LineChart, BookOpen, Wallet, BarChart3, Brain,
  ArrowLeft, Phone, Mail, ShieldCheck, Sparkles, CalendarDays,
  Library, Target, Activity, CheckCircle2,
} from "lucide-react";
import tradingBg from "@/assets/trading-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ژورنال کلاب | پلتفرم حرفه‌ای ژورنال‌نویسی معاملاتی" },
      { name: "description", content: "ژورنال کلاب: ثبت، تحلیل و رشد معاملات با چند حساب، تقویم معاملاتی، قوانین، کتابخانه ستاپ و آنالیز روانشناسی." },
      { property: "og:title", content: "ژورنال کلاب | پلتفرم حرفه‌ای معامله‌گری" },
      { property: "og:description", content: "هر چیزی که یک معامله‌گر جدی برای پیگیری، تحلیل و بهبود عملکرد لازم دارد." },
    ],
  }),
  component: Landing,
});

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

const FEATURES = [
  { Icon: Wallet, title: "مدیریت چند حساب", desc: "حساب‌های دمو، پراپ فرم و واقعی را یکجا مدیریت و به‌صورت مستقل تحلیل کنید." },
  { Icon: BarChart3, title: "آنالیز پیشرفته", desc: "نرخ برد، ثبات ریسک، عملکرد ستاپ‌ها و عادات معاملاتی شما را زیر ذره‌بین می‌برد." },
  { Icon: CalendarDays, title: "تقویم معاملاتی", desc: "هر روز معاملاتی را در یک تقویم بصری با کدرنگ سود و زیان مرور کنید." },
  { Icon: BookOpen, title: "ژورنال معاملاتی", desc: "مشاهدات بازار، درس‌ها، یادداشت‌های روانشناسی و ایده‌ها را ثبت کنید." },
  { Icon: Library, title: "کتابخانه ستاپ‌ها", desc: "پایگاه شخصی ستاپ‌های معاملاتی خودتان را با تصویر و توضیح بسازید." },
  { Icon: ShieldCheck, title: "پایش پراپ فرم", desc: "محدودیت دراودون، تارگت‌های سود و پیشرفت چالش‌ها را زیر نظر بگیرید." },
  { Icon: Brain, title: "روانشناسی معامله", desc: "الگوهای احساسی خود را بشناسید و تصمیم‌گیری را بهبود دهید." },
  { Icon: Activity, title: "مدیریت ریسک", desc: "ثبات، انضباط و میزان ریسک هر معامله را پیوسته بسنجید." },
  { Icon: Target, title: "قوانین معاملاتی", desc: "قوانین شخصی‌ات را تعریف کن، نقض‌ها را ثبت کن و امتیاز انضباطت را ببین." },
];

const HIGHLIGHTS = [
  "ثبت معامله با ستاپ، چک‌لیست، احساسات و کیفیت",
  "ارزیابی A+ / A / B / C برای هر معامله",
  "تشخیص بیشترین قانون نقض‌شده و امتیاز انضباط",
  "نمودار اکوییتی و رشد سرمایه به تفکیک حساب",
  "آنالیز سشن (لندن، نیویورک، توکیو، سیدنی)",
  "آپلود اسکرین‌شات و ذخیره چندتصویری ستاپ‌ها",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
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
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${tradingBg})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,_var(--primary)_18%,_transparent),_transparent_60%)]" aria-hidden="true" />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" aria-hidden="true" />

        <div className="container relative mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              ساخته‌شده برای معامله‌گران حرفه‌ای فارسی‌زبان
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
              هر چیزی که یک تریدر جدی برای
              <span className="block bg-gradient-to-l from-primary via-chart-3 to-primary bg-clip-text text-transparent">
                ثبت، تحلیل و رشد عملکرد لازم دارد
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              مدیریت چند حساب، آنالیز پیشرفته، تقویم معاملاتی، کتابخانه ستاپ‌ها، قوانین و
              انضباط، روانشناسی معامله — همه در یک پلتفرم مدرن.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform">
                شروع رایگان
                <ArrowLeft className="size-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur px-6 py-3 font-semibold hover:bg-card transition">
                مشاهده ویژگی‌ها
              </a>
            </div>
          </Reveal>

          {/* Mock trading dashboard preview */}
          <Reveal delay={450}>
            <div className="mt-14 max-w-4xl mx-auto">
              <div className="relative rounded-2xl border border-border/60 bg-card/70 backdrop-blur shadow-glow overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-border/40 px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-destructive/80" />
                  <span className="size-2.5 rounded-full bg-yellow-500/80" />
                  <span className="size-2.5 rounded-full bg-primary/80" />
                  <span className="ml-3 text-xs text-muted-foreground num">journalclub.app — داشبورد</span>
                </div>
                <div className="grid grid-cols-3 gap-3 p-4">
                  {[
                    { k: "نرخ برد", v: "۶۸٪", c: "text-primary" },
                    { k: "میانگین R:R", v: "۲.۴", c: "text-foreground" },
                    { k: "انضباط", v: "۸۴/۱۰۰", c: "text-primary" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-xl border border-border/40 bg-background/40 p-3 text-right">
                      <div className="text-[10px] text-muted-foreground mb-1">{s.k}</div>
                      <div className={`text-lg font-bold num ${s.c}`}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <MiniChart />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Highlights bar */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="container mx-auto px-4 py-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h} delay={i * 60}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>{h}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">یک ابزار برای کل سفر معامله‌گری</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              ابزارهای حرفه‌ای که در یک پلتفرم مدرن، تجربه تریدینگ تو رو متحول می‌کنه.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 60}>
              <div className="group h-full gradient-card rounded-2xl border border-border/60 p-6 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-glow">
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Discipline showcase */}
      <section className="container mx-auto px-4 py-16">
        <Reveal>
          <div className="gradient-card rounded-3xl border border-border/60 p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary mb-3">
                <ShieldCheck className="size-4" /> انضباط معاملاتی
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                قوانین شخصی‌ات را بساز، انضباطت را اندازه بگیر
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                قوانینی مثل «حداکثر ۱٪ ریسک»، «بدون معامله انتقامی» یا «فقط سشن لندن» تعریف کن.
                در هر معامله مشخص کن کدام نقض شده‌اند و امتیاز انضباطت رو همراه با
                «بیشترین قانون نقض‌شده» ببین تا روی نقاط ضعف کار کنی.
              </p>
              <Link to="/auth" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                همین حالا شروع کن <ArrowLeft className="size-4" />
              </Link>
            </div>
            <div className="space-y-3">
              <DisciplineRow label="حداکثر ۱٪ ریسک در هر معامله" pct={92} />
              <DisciplineRow label="بدون معامله بعد از ۲ ضرر پی‌درپی" pct={67} />
              <DisciplineRow label="فقط سشن لندن" pct={78} />
              <DisciplineRow label="بدون معامله انتقامی" pct={85} />
              <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
                <span className="text-sm text-muted-foreground">امتیاز انضباط</span>
                <span className="text-2xl font-bold text-primary num">۸۴<span className="text-sm text-muted-foreground">/۱۰۰</span></span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Multi-account highlight */}
      <section className="container mx-auto px-4 py-12">
        <Reveal>
          <div className="gradient-card rounded-3xl border border-border/60 p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div className="grid grid-cols-3 gap-3 order-2 md:order-1">
             {[
               { label: "دمو", desc: "تمرین و تست استراتژی" },
               { label: "پراپ فرم", desc: "پایش قوانین چالش" },
               { label: "واقعی", desc: "پیگیری سرمایه واقعی" },
             ].map((a) => (
               <div
                 key={a.label}
                 className="group rounded-2xl border border-border/40 p-4 bg-gradient-to-b from-muted/20 to-muted/5 hover:from-primary/30 hover:to-primary/5 hover:border-primary/40 hover:scale-105 transition-all duration-300"
               >
                 <Wallet className="size-5 text-muted-foreground mb-2 group-hover:text-primary transition-colors duration-300" />
                 <div className="font-bold group-hover:text-primary transition-colors duration-300">{a.label}</div>
                 <div className="text-[10px] text-muted-foreground mt-1">{a.desc}</div>
              </div>
              ))}
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 text-xs text-primary mb-3">
                <Sparkles className="size-4" /> چند حساب در یک داشبورد
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                دمو، پراپ فرم و حساب واقعی — همه در یک جا
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                حساب‌ها را با موجودی اولیه، بروکر و نوع حساب ثبت کن. آمار، نمودار اکوییتی،
                پیشرفت تارگت‌ها و وضعیت دراودون هر حساب را به‌صورت جداگانه ببین.
              </p>
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
              ساخت حساب رایگان <ArrowLeft className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
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

function DisciplineRow({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 80 ? "bg-primary" : pct >= 60 ? "bg-yellow-500" : "bg-destructive";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="num font-semibold">{pct}٪</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniChart() {
  // Simple SVG equity curve
  const points = [10, 18, 14, 28, 22, 38, 32, 48, 44, 60, 56, 72, 68, 82];
  const max = Math.max(...points);
  const w = 800, h = 140, pad = 8;
  const stepX = (w - pad * 2) / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${h - pad - (p / max) * (h - pad * 2)}`).join(" ");
  const fill = `${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <div className="px-4 pb-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#lg)" />
        <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
