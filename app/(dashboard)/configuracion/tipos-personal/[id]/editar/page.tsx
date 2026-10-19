import type { Metadata } from "next"

import { CatalogoEditarPage } from "@/components/catalogos/catalogo-editar-page"

export const metadata: Metadata = {
  title: "Editar tipo de personal",
}

export default async function EditarTipoPersonalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoEditarPage dominio="tipo_personal" id={id} />
}