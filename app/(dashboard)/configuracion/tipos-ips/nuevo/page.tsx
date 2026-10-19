import type { Metadata } from "next"

import { CatalogoNuevoPage } from "@/components/catalogos/catalogo-nuevo-page"

export const metadata: Metadata = {
  title: "Nuevo tipo de IPS",
}

export default function NuevoTipoIpsPage() {
  return <CatalogoNuevoPage dominio="tipo_ips" />
}
