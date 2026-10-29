import type { Metadata } from "next"

import { CatalogoEditarPage } from "@/components/catalogos/catalogo-editar-page"

export const metadata: Metadata = {
  title: "Editar responsable",
}

export default async function EditarResponsablePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoEditarPage dominio="responsable" id={id} />
}
