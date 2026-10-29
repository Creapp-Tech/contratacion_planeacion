import type { Metadata } from "next"

import { CatalogoDetallePage } from "@/components/catalogos/catalogo-detalle-page"

export const metadata: Metadata = {
  title: "Detalle de responsable",
}

export default async function ResponsableDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoDetallePage dominio="responsable" id={id} />
}
