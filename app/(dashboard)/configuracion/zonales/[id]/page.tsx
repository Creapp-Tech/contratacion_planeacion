import type { Metadata } from "next"

import { CatalogoDetallePage } from "@/components/catalogos/catalogo-detalle-page"

export const metadata: Metadata = {
  title: "Detalle de zonal",
}

export default async function ZonalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoDetallePage dominio="zonal" id={id} />
}
