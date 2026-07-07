import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard, type Task } from "@/components/task-card";
import type { CategoryKey } from "@/lib/categories";
import { Loader2 } from "lucide-react";

export function TaskGrid({ category }: { category: CategoryKey | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    let q = supabase
      .from("tasks")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    const { data } = await q;
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    const ch = supabase
      .channel("tasks-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <section className="mx-auto mt-6 max-w-6xl px-4 pb-16">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-black">المهام والخدمات المتاحة</h2>
        <span className="text-sm text-muted-foreground">{tasks.length} عنصر</span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-lg font-semibold">لا توجد مهام في هذا التصنيف حالياً</p>
          <p className="mt-1 text-sm text-muted-foreground">كن أول من ينشر مهمة!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onChanged={load} />
          ))}
        </div>
      )}
    </section>
  );
}
