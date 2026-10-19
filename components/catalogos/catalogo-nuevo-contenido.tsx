import { requireSuperadmin } from "@/lib/auth/session"
import type { CatalogoDominio } from "@/lib/catalogos/dominios"

import { CatalogoForm } from "./catalogo-form"

export async function CatalogoNuevoContenido({
  dominio,
}: {
  dominio: CatalogoDominio
}) {
  await requireSuperadmin()

  return <CatalogoForm mode="crear" dominio={dominio} />
}
