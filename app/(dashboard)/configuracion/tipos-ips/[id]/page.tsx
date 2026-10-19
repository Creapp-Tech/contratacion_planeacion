import type { Metadata } from "next"

import { CatalogoDetallePage } from "@/components/catalogos/catalogo-detalle-page"

export const metadata: Metadata = {
  title: "Detalle de tipo de IPS",
}

export default async function TipoIpsDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoDetallePage dominio="tipo_ips" id={id} />
}
