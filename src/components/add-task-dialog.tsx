import { useRef, useState } from "react";
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
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { z } from "zod";
import { ImagePlus, X, Loader2 } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3, "العنوان قصير").max(120),
  details: z.string().trim().min(10, "التفاصيل قصيرة جداً").max(1000),
  category: z.enum(["delivery", "teaching", "transport", "search", "work", "help", "other"]),
  price: z.coerce.number().min(0).max(1000000),
  location: z.string().trim().min(2).max(120),
  whatsapp: z
    .string()
    .trim()
    .min(6, "رقم الواتساب مطلوب")
    .max(20)
    .regex(/^[+\d\s-]+$/, "رقم غير صالح"),
});

export function AddTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    details: "",
    category: "other" as CategoryKey,
    price: "",
    location: "",
    whatsapp: "",
  });

  const reset = () => {
    setForm({ title: "", details: "", category: "other", price: "", location: "", whatsapp: "" });
    setImageUrl("");
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    setUploading(true);
    try {
      const url = await uploadImage("task-images", f, user.id);
      setImageUrl(url);
      toast.success("تم رفع الصورة");
    } catch (err: any) {
      toast.error(err?.message ?? "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
      currency: "BHD",
      location: parsed.data.location,
      whatsapp: parsed.data.whatsapp,
      image_url: imageUrl || null,
    } as any);
    setSubmitting(false);
    if (error) { toast.error("تعذر نشر المهمة"); return; }
    toast.success("تم نشر المهمة بنجاح! 🎉");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">إضافة مهمة أو خدمة</DialogTitle>
          <DialogDescription>املأ التفاصيل وسيراها الجميع فوراً.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">العنوان</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: توصيل طلب داخل المنامة" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="details">التفاصيل والشروط</Label>
            <Textarea id="details" rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="اذكر كل ما يحتاجه من ينفّذ المهمة..." />
          </div>

          <div className="grid gap-1.5">
            <Label>صورة (اختياري)</Label>
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
                  aria-label="حذف"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !user}
                className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition hover:border-accent hover:bg-muted/70 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span>{user ? "اضغط لاختيار صورة من الهاتف أو الجهاز" : "سجّل الدخول لرفع الصور"}</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={pickImage}
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="price">السعر (د.ب)</Label>
              <Input id="price" type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="loc">الموقع</Label>
              <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="مثال: المنامة - العدلية" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="wa">رقم الواتساب</Label>
            <Input
              id="wa"
              type="tel"
              dir="ltr"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="مثال: 97333xxxxxx"
            />
            <p className="text-xs text-muted-foreground">سيستخدم هذا الرقم لاستقبال رسائل المهتمين مباشرة عبر واتساب.</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={submit} disabled={submitting || uploading} className="gradient-brand text-primary-foreground">
            {submitting ? "جارٍ النشر..." : "نشر المهمة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
