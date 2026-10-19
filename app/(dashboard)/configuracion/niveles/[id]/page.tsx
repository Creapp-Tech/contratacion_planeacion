import type { Metadata } from "next"

import { CatalogoDetallePage } from "@/components/catalogos/catalogo-detalle-page"

export const metadata: Metadata = {
  title: "Detalle de nivel",
}

export default async function NivelDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoDetallePage dominio="nivel" id={id} />
}
