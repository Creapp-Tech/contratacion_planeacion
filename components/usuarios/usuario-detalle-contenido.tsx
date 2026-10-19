import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import { getUsuario } from "@/lib/usuarios/queries"

function formatFecha(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value))
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export async function UsuarioDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperadmin()

  const { id } = await params
  const usuario = await getUsuario(id)

  if (!usuario) {
    notFound()
  }

  return (
    <dl className="flex flex-col">
      <Dato label="Nombre completo" value={usuario.nombre_completo} />
      <Dato label="Correo" value={usuario.email} />
      <Dato label="Teléfono" value={usuario.telefono ?? "—"} />
      <Dato label="Rol" value={usuario.rol} />
      <Dato label="Regional" value={usuario.regionales?.nombre ?? "—"} />
      <Dato label="Estado" value={usuario.estado} />
      <Dato label="Creado" value={formatFecha(usuario.created_at)} />
    </dl>
  )
}
