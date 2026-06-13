import React from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light1"
      enableSystem={false}
      storageKey="ventitech-portal-theme"
      themes={["light1", "light2", "light3", "dark1", "dark2", "dark3"]}
    >
      {children}
    </ThemeProvider>
  );
}
