import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, User as UserIcon, Shield, Languages, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";

export function SiteHeader({ onAddTask }: { onAddTask: () => void }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const signIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("تعذر تسجيل الدخول عبر جوجل");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={logoAsset.url}
            alt="مهمة وخدمة"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-2xl shadow-elegant logo-pulse"
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black leading-none logo-shine sm:text-xl">مهمة وخدمة</h1>
            <p className="mt-1 hidden text-[11px] text-muted-foreground sm:block">سوقك اليومي للمهام والخدمات</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={onAddTask}
            size="sm"
            className="gradient-brand text-primary-foreground shadow-elegant hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">أضف مهمة/خدمة</span>
            <span className="sm:hidden">أضف</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="اللغة">
                <Languages className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>اللغة</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>العربية ✓</DropdownMenuItem>
              <DropdownMenuItem disabled>English (قريباً)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-accent/40">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                    <AvatarFallback>{(user.email ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/my-tasks" })}>
                  <ListChecks className="ms-2 h-4 w-4" /> مهامي وخدماتي
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="ms-2 h-4 w-4" /> لوحة الإدارة
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="ms-2 h-4 w-4" /> تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signIn} variant="outline" size="sm" className="gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">دخول بجوجل</span>
              <span className="sm:hidden">دخول</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
