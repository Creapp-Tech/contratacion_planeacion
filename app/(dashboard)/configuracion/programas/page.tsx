import type { Metadata } from "next"

import { CatalogoListaPage } from "@/components/catalogos/catalogo-lista-page"

export const metadata: Metadata = {
  title: "Programas",
}

export default function ProgramasPage() {
  return <CatalogoListaPage dominio="programa" />
}
