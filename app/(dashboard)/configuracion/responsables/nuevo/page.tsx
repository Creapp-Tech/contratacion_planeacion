import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nuevo responsable",
}

export default function NuevoResponsablePage() {
  return <CatalogoNuevoPage dominio="responsable" />
}
