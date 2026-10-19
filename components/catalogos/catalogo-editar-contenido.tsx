import { notFound } from "next/navigation"

import { requireSuperadmin } from "@/lib/auth/session"
import type { CatalogoDominio } from "@/lib/catalogos/dominios"
import { getCatalogo } from "@/lib/catalogos/queries"

import { CatalogoForm } from "./catalogo-form"

export async function CatalogoEditarContenido({
  dominio,
  id,
}: {
  dominio: CatalogoDominio
  id: string
}) {
  await requireSuperadmin()

  const item = await getCatalogo(dominio, id)

  if (!item) {
    notFound()
  }

  return <CatalogoForm mode="editar" dominio={dominio} item={item} />
}
