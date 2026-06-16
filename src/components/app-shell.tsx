import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListOrdered, PlusCircle, Home, Wallet, BookOpen, LogOut, CalendarDays, BarChart3, ShieldCheck, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "داشبورد", Icon: LayoutDashboard },
  { to: "/accounts", label: "حساب‌ها", Icon: Wallet },
  { to: "/trades", label: "معاملات", Icon: ListOrdered },
  { to: "/trades/new", label: "معامله جدید", Icon: PlusCircle },
  { to: "/calendar", label: "تقویم", Icon: CalendarDays },
  { to: "/analytics", label: "تحلیل پیشرفته", Icon: BarChart3 },
  { to: "/rules", label: "قوانین معاملاتی", Icon: ShieldCheck },
  { to: "/setups", label: "کتابخانه ستاپ‌ها", Icon: Library },
  { to: "/journal", label: "ژورنال", Icon: BookOpen },
] as const;

// لوگوی جدید کندل‌استیک
function JournalClubLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#logoGradShell)" />
      <defs>
        <linearGradient id="logoGradShell" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D9E75" />
          <stop offset="100%" stopColor="#0F6E56" />
        </linearGradient>
      </defs>
      <rect x="8" y="22" width="4" height="10" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="9.5" y="18" width="1" height="5" fill="white" fillOpacity="0.7" />
      <rect x="9.5" y="32" width="1" height="3" fill="white" fillOpacity="0.7" />
      <rect x="15" y="14" width="4" height="14" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="16.5" y="10" width="1" height="5" fill="white" fillOpacity="0.7" />
      <rect x="16.5" y="28" width="1" height="4" fill="white" fillOpacity="0.7" />
      <rect x="22" y="18" width="4" height="8" rx="1" fill="#a7f3d0" fillOpacity="0.95" />
      <rect x="23.5" y="14" width="1" height="5" fill="white" fillOpacity="0.7" />
      <rect x="23.5" y="26" width="1" height="4" fill="white" fillOpacity="0.7" />
      <rect x="29" y="12" width="4" height="16" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="30.5" y="8" width="1" height="5" fill="white" fillOpacity="0.7" />
      <rect x="30.5" y="28" width="1" height="4" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const goHome = () => navigate({ to: "/dashboard" });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("از حساب خارج شدید");
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
          <JournalClubLogo size={36} />
          <span className="font-bold text-base text-sidebar-foreground">ژورنال کلاب</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, Icon }) => {
            // ✅ اصلاح منطق اکتیو برای جلوگیری از سبز شدن همزمان منوی معاملات و معامله جدید
           let active = pathname === to;
if (!active && to !== "/dashboard" && to !== "/trades" && to !== "/trades/new") {
  active = pathname.startsWith(to);
}
if (to === "/trades") {
  active = pathname === "/trades" || (pathname.startsWith("/trades/") && pathname !== "/trades/new");
}
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={goHome}
          >
            <Home className="size-4" />
            بازگشت به داشبورد
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            خروج از حساب
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="md:hidden flex items-center gap-1.5">
              {nav.map(({ to, Icon, label }) => {
                // ✅ اعمال همان منطق بهینه‌شده برای نمایشگرهای موبایل
                let active = pathname === to;
                if (!active && to !== "/dashboard" && to !== "/trades") {
                  active = pathname.startsWith(to);
                }
                
                return (
                  <Link 
                    key={to} 
                    to={to} 
                    className={`rounded-md p-2 transition ${active ? "bg-accent text-primary" : "hover:bg-accent"}`} 
                    title={label}
                  >
                    <Icon className="size-4" />
                  </Link>
                );
              })}
              <Button variant="ghost" size="icon" onClick={goHome} title="بازگشت به داشبورد">
                <Home className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="خروج از حساب"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
