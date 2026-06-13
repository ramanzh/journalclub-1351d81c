import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETUP_TAGS, DEFAULT_CHECKLIST } from "@/lib/trade-utils";

let seededFor: string | null = null;
let seedingPromise: Promise<void> | null = null;

export async function ensureDefaultsSeeded(userId: string) {
  if (seededFor === userId) return;
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const { count: tagCount } = await supabase
      .from("setup_tags")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((tagCount ?? 0) === 0) {
      await supabase.from("setup_tags").insert(
        DEFAULT_SETUP_TAGS.map((name) => ({ user_id: userId, name, is_default: true })),
      );
    }

    const { count: chkCount } = await supabase
      .from("checklist_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((chkCount ?? 0) === 0) {
      await supabase.from("checklist_items").insert(
        DEFAULT_CHECKLIST.map((c, i) => ({
          user_id: userId,
          key: c.key,
          label: c.label,
          is_default: true,
          sort_order: i,
        })),
      );
    }
    seededFor = userId;
  })().finally(() => { seedingPromise = null; });
  return seedingPromise;
}
