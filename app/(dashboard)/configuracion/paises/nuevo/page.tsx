import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nuevo país",
}

export default function NuevoPaisPage() {
  return <CatalogoNuevoPage dominio="pais" />
}
