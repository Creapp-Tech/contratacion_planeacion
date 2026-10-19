import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Tipos de IPS",
}

export default function TiposIpsPage() {
  return <CatalogoListaPage dominio="tipo_ips" />
}
