import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nuevo tipo de personal",
}

export default function NuevoTipoPersonalPage() {
  return <CatalogoNuevoPage dominio="tipo_personal" />
}