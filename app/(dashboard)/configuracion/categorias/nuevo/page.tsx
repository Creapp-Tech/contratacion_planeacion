import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nueva categoría",
}

export default function NuevaCategoriaPage() {
  return <CatalogoNuevoPage dominio="categoria" />
}
