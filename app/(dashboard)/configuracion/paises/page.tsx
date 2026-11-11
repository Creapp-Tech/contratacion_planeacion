import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Países",
}

export default function PaisesPage() {
  return <CatalogoListaPage dominio="pais" />
}
