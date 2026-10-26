import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Categorías",
}

export default function CategoriasPage() {
  return <CatalogoListaPage dominio="categoria" />
}
