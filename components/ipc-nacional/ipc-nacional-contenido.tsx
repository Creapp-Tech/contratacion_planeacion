import { requireSuperadmin } from "@/lib/auth/session"
import { listIpcNacional } from "@/lib/ipc/queries"

import { IpcNacionalTabla } from "./ipc-nacional-tabla"

export async function IpcNacionalContenido() {
  await requireSuperadmin()

  const filas = await listIpcNacional()

  return <IpcNacionalTabla filas={filas} />
}
