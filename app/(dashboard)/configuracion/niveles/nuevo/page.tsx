import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nuevo nivel",
}

export default function NuevoNivelPage() {
  return <CatalogoNuevoPage dominio="nivel" />
}
