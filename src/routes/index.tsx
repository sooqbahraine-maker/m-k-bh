import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategoryStrip } from "@/components/category-strip";
import { TaskGrid } from "@/components/task-grid";
import { AddTaskDialog } from "@/components/add-task-dialog";
import type { CategoryKey } from "@/lib/categories";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [cat, setCat] = useState<CategoryKey | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40">
      <SiteHeader onAddTask={() => setAddOpen(true)} />
      <BannerCarousel />
      <CategoryStrip selected={cat} onSelect={setCat} />
      <TaskGrid category={cat} />
      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
      <footer className="border-t border-border bg-card/50 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} مهمة وخدمة — كل الحقوق محفوظة
      </footer>
    </div>
  );
}
