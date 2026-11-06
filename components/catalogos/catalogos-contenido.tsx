import { requireAccesoModulo } from "@/lib/auth/session"
import type { CatalogoConfig } from "@/lib/catalogos/dominios"
import { listCatalogos } from "@/lib/catalogos/queries"

import { CatalogosTabla } from "./catalogos-tabla"

export async function CatalogosContenido({
  config,
}: {
  config: CatalogoConfig
}) {
  await requireAccesoModulo()

  const items = await listCatalogos(config.dominio)

  return <CatalogosTabla config={config} items={items} />
}
