import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Marcas",
}

export default function MarcasPage() {
  return <CatalogoListaPage dominio="marca" />
}
