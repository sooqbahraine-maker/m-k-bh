import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  is_active: boolean;
  sort_order: number;
};

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setBanners((data ?? []) as Banner[]);
    };
    load();
    const ch = supabase
      .channel("banners-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-bold">أهلاً بك في مهمة وخدمة</h3>
              <p className="text-sm opacity-90">انشر مهمتك مجاناً وابدأ باستقبال العروض خلال دقائق.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const b = banners[idx];
  const Content = (
    <div className="relative aspect-[16/6] w-full overflow-hidden rounded-2xl bg-muted shadow-elegant">
      <img src={b.image_url} alt={b.title ?? ""} className="h-full w-full object-cover transition-opacity duration-700" />
      {b.title && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-sm font-bold text-white">{b.title}</p>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
            aria-label={`الصورة ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto mt-4 max-w-6xl px-4">
      {b.link_url ? (
        <a href={b.link_url} target="_blank" rel="noopener noreferrer">{Content}</a>
      ) : (
        Content
      )}
    </div>
  );
}
