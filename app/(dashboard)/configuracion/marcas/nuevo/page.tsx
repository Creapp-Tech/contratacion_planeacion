import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nueva marca",
}

export default function NuevaMarcaPage() {
  return <CatalogoNuevoPage dominio="marca" />
}
