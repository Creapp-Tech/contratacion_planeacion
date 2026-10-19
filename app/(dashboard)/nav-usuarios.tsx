import Link from "next/link"

import { getCurrentUsuario } from "@/lib/auth/session"

export async function NavUsuarios() {
  const usuario = await getCurrentUsuario()

  if (!usuario || usuario.rol !== "superadmin" || usuario.estado !== "activo") {
    return null
  }

  return (
    <Link
      href="/usuarios"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Usuarios
    </Link>
  )
}
