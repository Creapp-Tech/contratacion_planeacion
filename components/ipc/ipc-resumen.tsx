import type { ResumenIpc } from "@/lib/ipc/agregaciones"
import type { IpcConReferencia } from "@/lib/ipc/queries"

import { IpcTabla } from "./ipc-tabla"
import { IpcTarjetas } from "./ipc-tarjetas"

export function IpcResumen({
  filas,
  resumen,
  filtrado,
}: {
  filas: IpcConReferencia[]
  resumen: ResumenIpc
  filtrado: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      <IpcTarjetas resumen={resumen} />
      <IpcTabla filas={filas} filtrado={filtrado} />
    </div>
  )
}
