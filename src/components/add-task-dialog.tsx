import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(3, "العنوان قصير").max(120),
  details: z.string().trim().min(10, "التفاصيل قصيرة جداً").max(1000),
  category: z.enum(["delivery", "teaching", "transport", "search", "work", "help", "other"]),
  price: z.coerce.number().min(0).max(1000000),
  location: z.string().trim().min(2).max(120),
});

export function AddTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    details: "",
    category: "other" as CategoryKey,
    price: "",
    location: "",
  });

  const submit = async () => {
    if (!user) {
      onOpenChange(false);
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) toast.error("يجب تسجيل الدخول أولاً");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: parsed.data.title,
      details: parsed.data.details,
      category: parsed.data.category,
      price: parsed.data.price,
      location: parsed.data.location,
    });
    setSubmitting(false);
    if (error) { toast.error("تعذر نشر المهمة"); return; }
    toast.success("تم نشر المهمة بنجاح! 🎉");
    setForm({ title: "", details: "", category: "other", price: "", location: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">إضافة مهمة أو خدمة</DialogTitle>
          <DialogDescription>املأ التفاصيل وسيراها الجميع فوراً.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">العنوان</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: توصيل طلب من عمّان إلى الزرقاء" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="details">التفاصيل والشروط</Label>
            <Textarea id="details" rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="اذكر كل ما يحتاجه من ينفّذ المهمة..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>التصنيف</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CategoryKey })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price">السعر (د.أ)</Label>
              <Input id="price" type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="loc">الموقع الجغرافي</Label>
            <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="مثال: عمّان - الشميساني" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={submit} disabled={submitting} className="gradient-brand text-primary-foreground">
            {submitting ? "جارٍ النشر..." : "نشر المهمة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
