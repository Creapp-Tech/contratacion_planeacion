import { requireAdminUsuarios } from "@/lib/auth/session"
import { listRegionales, listUsuarios } from "@/lib/usuarios/queries"
import { puedeVerTodoModulos } from "@/lib/constants/roles"

import { UsuarioFiltros } from "./usuario-filtros"
import { UsuariosTabla } from "./usuarios-tabla"
import { StandardCreateBtn } from "@/components/ui/standard-create-btn"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function UsuariosContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const usuario = await requireAdminUsuarios()

  const params = await searchParams
  const filtros = {
    q: pick(params.q),
    rol: pick(params.rol),
    regional: pick(params.regional),
    estado: pick(params.estado),
  }

  const [regionales, usuarios] = await Promise.all([
    listRegionales(),
    listUsuarios(filtros),
  ])

  const soloLectura = puedeVerTodoModulos(usuario.rol)

  return (
    <div className="flex flex-col gap-4">
      <UsuarioFiltros regionales={regionales} filtros={filtros} />
      {!soloLectura && (
        <div className="flex items-center gap-2">
          <StandardCreateBtn module="usuarios" />
        </div>
      )}
      <UsuariosTabla usuarios={usuarios} />
    </div>
  )
}
