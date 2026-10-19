import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nueva zonal",
}

export default function NuevaZonalPage() {
  return <CatalogoNuevoPage dominio="zonal" />
}
