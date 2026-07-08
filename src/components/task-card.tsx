import { CATEGORY_MAP, type CategoryKey } from "@/lib/categories";
import { currencyShort } from "@/lib/currencies";
import { MapPin, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  details: string;
  category: CategoryKey;
  price: number;
  currency?: string | null;
  location: string;
  image_url?: string | null;
  status: "open" | "accepted" | "completed";
  accepted_by: string | null;
  created_at: string;
};

export function TaskCard({ task, onChanged }: { task: Task; onChanged?: () => void }) {
  const cat = CATEGORY_MAP[task.category] ?? CATEGORY_MAP.other;
  const Icon = cat.icon;
  const { user } = useAuth();

  const accept = async () => {
    if (!user) {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) toast.error("سجّل الدخول أولاً لقبول المهمة");
      return;
    }
    const { error } = await supabase
      .from("tasks")
      .update({ status: "accepted", accepted_by: user.id })
      .eq("id", task.id)
      .eq("status", "open");
    if (error) return toast.error("تعذر قبول المهمة");
    toast.success("تم قبول المهمة بنجاح! 🎉");
    onChanged?.();
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
      {task.image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img src={task.image_url} alt={task.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: cat.colorVar }}
          >
            <Icon className="h-3.5 w-3.5" />
            {cat.label}
          </span>
          <StatusBadge status={task.status} />
        </div>

        <h3 className="mt-3 line-clamp-2 text-base font-bold">{task.title}</h3>
        <p className="mt-1.5 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">{task.details}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{task.location}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">السعر</p>
            <p className="text-xl font-black text-accent">
              {Number(task.price).toLocaleString("ar")} <span className="text-sm">{currencyShort(task.currency)}</span>
            </p>
          </div>
          {task.status === "open" && task.user_id !== user?.id && (
            <Button onClick={accept} size="sm" className="gradient-green text-success-foreground hover:opacity-95">
              قبول فوري
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Task["status"] }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
        <CheckCircle2 className="h-3 w-3" /> منتهية
      </span>
    );
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
        <Clock className="h-3 w-3" /> قيد التنفيذ
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
      متاحة
    </span>
  );
}
