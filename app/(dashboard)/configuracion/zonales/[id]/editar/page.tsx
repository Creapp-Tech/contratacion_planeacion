import type { Metadata } from "next"

import { CatalogoEditarPage } from "@/components/catalogos/catalogo-editar-page"

export const metadata: Metadata = {
  title: "Editar zonal",
}

export default async function EditarZonalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoEditarPage dominio="zonal" id={id} />
}
