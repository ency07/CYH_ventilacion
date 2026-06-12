import React from "react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import RolesClient from "./RolesClient";

export const metadata = {
  title: "Matriz de Roles ERP | CYH OS",
  description: "Matriz de control de acceso cruzado de alta densidad.",
};

export default async function RolesPage() {
  const currentUser = await getCurrentUser();

  // Enforce RBAC at page level: Only admins/root_dev can access administration
  if (!["admin", "super_admin", "root_dev"].includes(currentUser.role)) {
    redirect("/crm/dashboard");
  }

  return <RolesClient currentUser={currentUser} />;
}
