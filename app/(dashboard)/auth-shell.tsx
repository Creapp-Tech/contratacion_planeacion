import { redirect } from "next/navigation";
import { io } from "next/cache";

import { getCurrentUsuarioResult } from "@/lib/auth/session";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PerfilErrorPanel } from "@/components/shell/perfil-error-panel";

export async function AuthShell({ children }: { children: React.ReactNode }) {
  await io();

  const { usuario, status } = await getCurrentUsuarioResult();

  // Sin sesión real: el middleware también lo maneja, pero mantenemos el guard.
  if (status === "sin_sesion") {
    redirect("/login");
  }

  // La sesión es válida pero no pudimos leer el perfil (registro faltante,
  // error de red/RLS). NO cerramos sesión ni redirigimos en bucle: mostramos
  // un mensaje claro en pantalla.
  if (status === "sin_perfil" || !usuario) {
    return (
      <PerfilErrorPanel
        titulo="No encontramos tu perfil"
        mensaje="Tu sesión está activa, pero no pudimos cargar tu perfil de usuario. Contacta al administrador para que lo restablezca."
      />
    );
  }

  // Sesión y perfil válidos, pero usuario inactivo: mostrar aviso sin logout.
  if (status === "inactivo") {
    return (
      <PerfilErrorPanel
        titulo="Usuario inactivo"
        mensaje="Tu usuario está inactivo. Contacta al administrador para reactivarlo."
      />
    );
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
