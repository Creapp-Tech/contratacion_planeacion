import { requireSuperadmin } from "@/lib/auth/session"

import { IpcNacionalForm } from "./ipc-nacional-form"

export async function IpcNacionalNuevoContenido() {
  await requireSuperadmin()

  return (
    <IpcNacionalForm
      mode="crear"
      anioActual={new Date().getFullYear()}
    />
  )
}
