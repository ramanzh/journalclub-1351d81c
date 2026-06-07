import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListOrdered, PlusCircle, TrendingUp, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "داشبورد", Icon: LayoutDashboard },
  { to: "/trades", label: "معاملات", Icon: ListOrdered },
  { to: "/trades/new", label: "معامله جدید", Icon: PlusCircle },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-9 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <TrendingUp className="size-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-base text-sidebar-foreground">ژورنال کلاب</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
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
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="size-4" /> خروج
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="md:hidden flex items-center gap-2">
              {nav.map(({ to, Icon, label }) => (
                <Link key={to} to={to} className="rounded-md p-2 hover:bg-accent" title={label}>
                  <Icon className="size-4" />
                </Link>
              ))}
              <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="size-4" /></Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
