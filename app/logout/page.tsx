"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutPage() {
  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      window.location.href = "/login";
    });
  }, []);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Signing out…</p>
    </main>
  );
}
