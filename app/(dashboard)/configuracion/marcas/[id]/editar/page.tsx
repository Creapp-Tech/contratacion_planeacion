import type { Metadata } from "next"

import { CatalogoEditarPage } from "@/components/catalogos/catalogo-editar-page"

export const metadata: Metadata = {
  title: "Editar marca",
}

export default async function EditarMarcaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoEditarPage dominio="marca" id={id} />
}
