import React from "react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { listCrmUsersAction } from "@/lib/server-actions/users";
import { redirect } from "next/navigation";
import EquipoClient from "./EquipoClient";

export const metadata = {
  title: "Estructura del Equipo | CYH OS",
  description: "Organigrama relacional por departamentos corporativos.",
};

export default async function EquipoPage() {
  const currentUser = await getCurrentUser();

  // Allowed roles for administration views
  if (!["admin", "super_admin", "root_dev", "director_comercial"].includes(currentUser.role)) {
    redirect("/crm/dashboard");
  }

  const res = await listCrmUsersAction();
  const allUsers = res.success && res.data ? res.data : [];

  return (
    <EquipoClient 
      currentUser={currentUser} 
      allUsers={allUsers} 
    />
  );
}
