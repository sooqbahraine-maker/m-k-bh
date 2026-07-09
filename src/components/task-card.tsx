import { CATEGORY_MAP, type CategoryKey } from "@/lib/categories";
import { currencyShort } from "@/lib/currencies";
import { MapPin, MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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
  whatsapp?: string | null;
  status: "open" | "accepted" | "completed";
  accepted_by: string | null;
  created_at: string;
};

function buildWhatsAppUrl(phone: string, task: Task) {
  const clean = phone.replace(/[^\d]/g, "");
  const text =
    `مرحباً، بخصوص خدمتك على "مهمة وخدمة":\n\n` +
    `📌 ${task.title}\n` +
    `📝 ${task.details}\n` +
    `📍 ${task.location}\n` +
    `💰 ${Number(task.price).toLocaleString("ar")} ${currencyShort()}\n\n` +
    `أرغب بالتواصل معك.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function TaskCard({ task }: { task: Task; onChanged?: () => void }) {
  const cat = CATEGORY_MAP[task.category] ?? CATEGORY_MAP.other;
  const Icon = cat.icon;
  const { user } = useAuth();
  const isOwner = task.user_id === user?.id;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
      {task.image_url && (
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          <img src={task.image_url} alt={task.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: cat.colorVar }}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </span>
          <StatusBadge status={task.status} />
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-bold">{task.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.details}</p>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{task.location}</span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2 border-t border-border pt-2">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">السعر</p>
            <p className="text-base font-black text-accent">
              {Number(task.price).toLocaleString("ar")} <span className="text-xs">{currencyShort()}</span>
            </p>
          </div>
          {!isOwner && task.whatsapp && (
            <a
              href={buildWhatsAppUrl(task.whatsapp, task)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              مراسلة
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Task["status"] }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
        <CheckCircle2 className="h-2.5 w-2.5" /> منتهية
      </span>
    );
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
        <Clock className="h-2.5 w-2.5" /> جارية
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
      متاحة
    </span>
  );
}
