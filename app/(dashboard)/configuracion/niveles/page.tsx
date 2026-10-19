import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Niveles",
}

export default function NivelesPage() {
  return <CatalogoListaPage dominio="nivel" />
}
