"use client";

import React from "react";
import { Activity, ShieldCheck, Database, Server, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = "cyh-crm-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary flex flex-col justify-between">
      <div className="flex-grow pt-24">
        {children}
      </div>
    </div>
  );
}
