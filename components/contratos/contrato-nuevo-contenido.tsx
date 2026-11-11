import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import {
  RUTAS_CONTRATOS,
  type AmbitoContratos,
} from "@/lib/contratos/constantes"
import { listOpcionesContrato } from "@/lib/contratos/queries"

import { ContratoForm } from "./contrato-form"

export async function ContratoNuevoContenido({
  ambito = "nacional",
}: {
  ambito?: AmbitoContratos
} = {}) {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  if (!alcance.verTodo && !alcance.regionalId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Tu usuario no tiene una regional asignada. Contacta al administrador
          para poder registrar contratos.
        </AlertDescription>
      </Alert>
    )
  }

  const opciones = await listOpcionesContrato(alcance)

  return (
    <ContratoForm
      mode="crear"
      opciones={opciones}
      ambito={ambito}
      volverA={RUTAS_CONTRATOS[ambito]}
    />
  )
}
