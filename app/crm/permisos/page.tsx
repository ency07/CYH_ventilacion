import React from "react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import PermisosClient from "./PermisosClient";

export const metadata = {
  title: "Permisos y Acciones ERP | CYH OS",
  description: "Matriz detallada de control y revocación de permisos atómicos.",
};

export default async function PermisosPage() {
  const currentUser = await getCurrentUser();

  // Strict check: Only admin or root_dev
  if (!["admin", "super_admin", "root_dev"].includes(currentUser.role)) {
    redirect("/crm/dashboard");
  }

  return <PermisosClient currentUser={currentUser} />;
}
