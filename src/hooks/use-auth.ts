import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Admin status is derived from the user_roles table (server-enforced via RLS),
  // NOT from the client-side email — this can't be spoofed by devtools.
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) { setIsAdmin(false); return; }
    let cancelled = false;
    setCheckingRole(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data);
      })
      .then(() => { if (!cancelled) setCheckingRole(false); });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const user: User | null = session?.user ?? null;

  return { session, user, loading: loading || checkingRole, isAdmin };
}
