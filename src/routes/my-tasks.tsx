import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { CATEGORY_MAP, CATEGORIES, type CategoryKey } from "@/lib/categories";
import { currencyShort } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Task } from "@/components/task-card";
import { editTaskSchema } from "@/lib/task-schema";
import { toast } from "sonner";
import { CheckCircle2, Trash2, Pencil, ArrowRight, MapPin } from "lucide-react";

export const Route = createFileRoute("/my-tasks")({
  head: () => ({
    meta: [
      { title: "مهامي وخدماتي - مهمة وخدمة" },
      { name: "description", content: "إدارة المهام والخدمات التي نشرتها في منصة مهمة وخدمة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyTasks,
});

function MyTasks() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTasks((data ?? []) as Task[]);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const del = async (id: string) => {
    if (!confirm("هل تريد حذف هذه المهمة؟")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return toast.error("تعذر الحذف");
    toast.success("تم الحذف");
    load();
  };

  const complete = async (id: string) => {
    const { error } = await supabase.from("tasks").update({ status: "completed" }).eq("id", id);
    if (error) return toast.error("تعذر التحديث");
    toast.success("تم تحديد المهمة كمنتهية");
    load();
  };

  if (loading || !user) return <div className="p-8 text-center">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onAddTask={() => setAddOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">مهامي وخدماتي</h1>
            <p className="text-sm text-muted-foreground">إدارة كاملة لكل ما نشرته</p>
          </div>
          <Link to="/" className="text-sm text-accent hover:underline">
            <ArrowRight className="ms-1 inline h-4 w-4" /> العودة
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-lg font-semibold">لم تنشر أي مهمة بعد</p>
            <Button onClick={() => setAddOpen(true)} className="mt-3 gradient-brand text-primary-foreground">
              أضف أول مهمة
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => {
              const cat = CATEGORY_MAP[t.category] ?? CATEGORY_MAP.other;
              return (
                <article key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: cat.colorVar }}>
                      {cat.label}
                    </span>
                    <StatusChip status={t.status} />
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-bold">{t.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.details}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {t.location}
                  </div>
                  <p className="mt-2 text-lg font-black text-accent">{Number(t.price).toLocaleString("ar")} {currencyShort(t.currency)}</p>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {t.status !== "completed" && (
                      <Button size="sm" onClick={() => complete(t.id)} className="gradient-green text-success-foreground">
                        <CheckCircle2 className="h-4 w-4" /> إنهاء
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                      <Pencil className="h-4 w-4" /> تعديل
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del(t.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" /> حذف
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditTaskDialog task={editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}

function StatusChip({ status }: { status: Task["status"] }) {
  const map = {
    open: { t: "متاحة", c: "bg-primary/10 text-primary" },
    accepted: { t: "قيد التنفيذ", c: "bg-accent/15 text-accent" },
    completed: { t: "منتهية", c: "bg-success/15 text-success" },
  } as const;
  const s = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.c}`}>{s.t}</span>;
}

function EditTaskDialog({ task, onClose, onSaved }: { task: Task | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(task);
  useEffect(() => setForm(task), [task]);
  if (!task || !form) return null;

  const save = async () => {
    const parsed = editTaskSchema.safeParse({
      title: form.title,
      details: form.details,
      category: form.category,
      price: form.price,
      location: form.location,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    const { error } = await supabase
      .from("tasks")
      .update({ ...parsed.data, currency: "BHD" })
      .eq("id", task.id);
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>تعديل المهمة</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>العنوان</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>التفاصيل</Label>
            <Textarea rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>التصنيف</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CategoryKey })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>السعر</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div className="grid gap-1.5">
            <Label>الموقع</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} className="gradient-brand text-primary-foreground">حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
