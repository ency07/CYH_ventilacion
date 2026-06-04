import { redirect } from "next/navigation";

export default function CrmPage() {
  // Redirigir siempre al Dashboard, consolidando la entrada del CRM
  redirect("/crm/dashboard");
}
