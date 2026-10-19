import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Zonales",
}

export default function ZonalesPage() {
  return <CatalogoListaPage dominio="zonal" />
}
