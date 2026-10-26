import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import { listContratosIpc } from "@/lib/ipc/queries"

import { IpcForm } from "./ipc-form"

export async function IpcNuevoContenido() {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)

  if (!alcance.verTodo && !alcance.regionalId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Tu usuario no tiene una regional asignada. Contacta al administrador
          para registrar IPC.
        </AlertDescription>
      </Alert>
    )
  }

  const contratos = await listContratosIpc(alcance)

  return (
    <IpcForm
      mode="crear"
      contratos={contratos}
      anioActual={new Date().getFullYear()}
    />
  )
}
