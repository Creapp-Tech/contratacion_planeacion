import type { Metadata } from "next"

import { CatalogoDetallePage } from "@/components/catalogos/catalogo-detalle-page"

export const metadata: Metadata = {
  title: "Detalle de tipo de personal",
}

export default async function TipoPersonalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoDetallePage dominio="tipo_personal" id={id} />
}