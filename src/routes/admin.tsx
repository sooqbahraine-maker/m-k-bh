import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus, ArrowRight, Users, LayoutGrid, Image as ImageIcon } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/categories";
import type { Task } from "@/components/task-card";

type Banner = {
  id: string; image_url: string; link_url: string | null;
  title: string | null; is_active: boolean; sort_order: number;
};

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة - مهمة وخدمة" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState<"banners" | "tasks" | "users">("banners");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) return <div className="p-8 text-center">جارٍ التحقق...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onAddTask={() => setAddOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black">لوحة الإدارة</h1>
          <Link to="/" className="text-sm text-accent hover:underline">
            <ArrowRight className="ms-1 inline h-4 w-4" /> العودة
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <TabBtn active={tab === "banners"} onClick={() => setTab("banners")} icon={<ImageIcon className="h-4 w-4" />}>البنرات</TabBtn>
          <TabBtn active={tab === "tasks"} onClick={() => setTab("tasks")} icon={<LayoutGrid className="h-4 w-4" />}>المهام</TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />}>المستخدمون</TabBtn>
        </div>

        {tab === "banners" && <BannersAdmin />}
        {tab === "tasks" && <TasksAdmin />}
        {tab === "users" && <UsersAdmin />}
      </main>
      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "gradient-brand text-primary-foreground shadow-elegant" : "border border-border bg-card"}`}>
      {icon}{children}
    </button>
  );
}

function BannersAdmin() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ image_url: "", link_url: "", title: "", sort_order: 0 });

  const load = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners((data ?? []) as Banner[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.image_url.trim()) return toast.error("رابط الصورة مطلوب");
    const { error } = await supabase.from("banners").insert({
      image_url: form.image_url,
      link_url: form.link_url || null,
      title: form.title || null,
      sort_order: form.sort_order,
      is_active: true,
    });
    if (error) return toast.error("تعذر الإضافة");
    toast.success("تمت الإضافة");
    setForm({ image_url: "", link_url: "", title: "", sort_order: 0 });
    setOpen(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("حذف البنر؟")) return;
    await supabase.from("banners").delete().eq("id", id);
    load();
  };

  const toggle = async (b: Banner) => {
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    load();
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)} className="mb-4 gradient-brand text-primary-foreground">
        <Plus className="h-4 w-4" /> إضافة بنر
      </Button>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <img src={b.image_url} className="h-32 w-full object-cover" alt="" />
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{b.title || "بدون عنوان"}</p>
                <p className="truncate text-xs text-muted-foreground">{b.link_url || "بدون رابط"}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => toggle(b)}>
                  {b.is_active ? "إخفاء" : "إظهار"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del(b.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة بنر جديد</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>رابط الصورة</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid gap-1.5">
              <Label>رابط عند الضغط (اختياري)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid gap-1.5">
              <Label>العنوان (اختياري)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>الترتيب</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={add} className="gradient-brand text-primary-foreground">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TasksAdmin() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks((data ?? []) as Task[]);
  };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => {
    if (!confirm("حذف هذه المهمة؟")) return;
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-right text-sm">
        <thead className="bg-muted text-xs">
          <tr><th className="p-3">العنوان</th><th className="p-3">التصنيف</th><th className="p-3">السعر</th><th className="p-3">الحالة</th><th className="p-3">إجراءات</th></tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="p-3 font-semibold">{t.title}</td>
              <td className="p-3">{CATEGORY_MAP[t.category]?.label}</td>
              <td className="p-3 font-bold text-accent">{Number(t.price).toLocaleString("ar-JO")} د.أ</td>
              <td className="p-3">{t.status}</td>
              <td className="p-3">
                <Button size="sm" variant="ghost" onClick={() => del(t.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<{ id: string; email: string | null; full_name: string | null; avatar_url: string | null; created_at: string }[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setUsers((data ?? []) as any));
  }, []);
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-right text-sm">
        <thead className="bg-muted text-xs">
          <tr><th className="p-3">المستخدم</th><th className="p-3">البريد</th><th className="p-3">التسجيل</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3 font-semibold">{u.full_name ?? "-"}</td>
              <td className="p-3 text-muted-foreground">{u.email}</td>
              <td className="p-3 text-xs">{new Date(u.created_at).toLocaleDateString("ar-JO")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
