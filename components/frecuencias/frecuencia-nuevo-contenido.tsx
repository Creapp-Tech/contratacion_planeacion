import { requireSuperadmin } from "@/lib/auth/session"
import { listRegimenes } from "@/lib/regimenes/queries"
import { listAseguradores, listSedesOpciones } from "@/lib/sedes/queries"
import { listServiciosOpciones } from "@/lib/servicios/queries"

import { FrecuenciaForm } from "./frecuencia-form"

export async function FrecuenciaNuevoContenido() {
  await requireSuperadmin()

  const [sedes, regimenes, aseguradores, servicios] = await Promise.all([
    listSedesOpciones(),
    listRegimenes(),
    listAseguradores(),
    listServiciosOpciones(),
  ])

  return (
    <FrecuenciaForm
      mode="crear"
      opciones={{
        sedes: sedes.map((sede) => ({ id: sede.id, nombre: sede.nombre })),
        regimenes: regimenes.map((regimen) => ({
          id: regimen.id,
          nombre: regimen.nombre,
        })),
        aseguradores: aseguradores.map((asegurador) => ({
          id: asegurador.id,
          nombre: asegurador.nombre_eps,
        })),
        servicios,
      }}
    />
  )
}
