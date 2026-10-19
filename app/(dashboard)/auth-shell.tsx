import { redirect } from "next/navigation";
import { io } from "next/cache";

import { getCurrentUsuario } from "@/lib/auth/session";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export async function AuthShell({ children }: { children: React.ReactNode }) {
  await io();

  const usuario = await getCurrentUsuario();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar rol={usuario.rol} />
      <SidebarInset>
        <AppHeader
          nombre={usuario.nombre_completo}
          rol={usuario.rol}
          email={usuario.email}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}