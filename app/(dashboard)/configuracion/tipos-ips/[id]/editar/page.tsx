import type { Metadata } from "next"

import { CatalogoEditarPage } from "@/components/catalogos/catalogo-editar-page"

export const metadata: Metadata = {
  title: "Editar tipo de IPS",
}

export default async function EditarTipoIpsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CatalogoEditarPage dominio="tipo_ips" id={id} />
}
