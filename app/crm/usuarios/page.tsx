import React from "react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { listCrmUsersAction } from "@/lib/server-actions/users";
import UsuariosClient from "./UsuariosClient";

export const metadata = {
  title: "Administración de Usuarios | CYH OS",
  description: "Gestión de accesos y perfiles SaaS multi-inquilino.",
};

export default async function UsuariosPage() {
  const currentUser = await getCurrentUser();
  const res = await listCrmUsersAction();
  const allUsers = res.success && res.data ? res.data : [];

  return (
    <UsuariosClient 
      currentUser={currentUser} 
      allUsers={allUsers} 
    />
  );
}
