import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Responsables",
}

export default function ResponsablesPage() {
  return <CatalogoListaPage dominio="responsable" />
}
