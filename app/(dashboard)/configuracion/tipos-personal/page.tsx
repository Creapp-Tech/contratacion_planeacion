import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Tipos de personal",
}

export default function TiposPersonalPage() {
  return <CatalogoListaPage dominio="tipo_personal" />
}