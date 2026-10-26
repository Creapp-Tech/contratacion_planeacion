import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nuevo programa",
}

export default function NuevoProgramaPage() {
  return <CatalogoNuevoPage dominio="programa" />
}
