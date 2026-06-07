import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TradeForm } from "@/components/trade-form";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/trades/new")({
  head: () => ({ meta: [{ title: "معامله جدید | ژورنال معاملاتی" }] }),
  component: NewTrade,
});

function NewTrade() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell title="ثبت معامله جدید">
      <TradeForm userId={user.id} />
    </AppShell>
  );
}
