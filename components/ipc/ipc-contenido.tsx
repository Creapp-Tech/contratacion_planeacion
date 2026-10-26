import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import { resumirIpc } from "@/lib/ipc/agregaciones"
import {
  listIpc,
  listOpcionesIpc,
  type IpcConReferencia,
  type IpcFiltros as IpcFiltrosParams,
  type OpcionesIpc,
} from "@/lib/ipc/queries"

import { IpcAnalisis } from "./ipc-analisis"
import { IpcFiltros } from "./ipc-filtros"
import { IpcResumen } from "./ipc-resumen"
import { IpcTabs } from "./ipc-tabs"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

const OPCIONES_VACIAS: OpcionesIpc = {
  regionales: [],
  aseguradores: [],
  contratos: [],
  anios: [],
}

export async function IpcContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)
  const params = await searchParams

  if (!alcance.verTodo && !alcance.regionalId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Tu usuario no tiene una regional asignada. Contacta al administrador
          para consultar el seguimiento IPC.
        </AlertDescription>
      </Alert>
    )
  }

  const filtros: IpcFiltrosParams = {
    regional: alcance.verTodo ? pick(params.regional) : undefined,
    contrato: pick(params.contrato),
    asegurador: pick(params.asegurador),
    anio: pick(params.anio),
  }

  let filas: IpcConReferencia[] = []
  let opciones: OpcionesIpc = OPCIONES_VACIAS
  let errorMessage: string | null = null

  try {
    const [filasResultado, opcionesResultado] = await Promise.all([
      listIpc(filtros, alcance),
      listOpcionesIpc(alcance),
    ])
    filas = filasResultado
    opciones = opcionesResultado
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al cargar el seguimiento IPC."
  }

  const resumen = resumirIpc(filas)
  const tab = params.tab === "analisis" ? "analisis" : "resumen"
  const filtrado = Boolean(
    filtros.regional || filtros.contrato || filtros.asegurador || filtros.anio
  )

  return (
    <div className="flex flex-col gap-4">
      <IpcTabs />

      <IpcFiltros
        opciones={opciones}
        filtros={filtros}
        verRegional={alcance.verTodo}
      />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No se pudo cargar el seguimiento IPC. {errorMessage}
        </div>
      ) : null}

      {tab === "analisis" ? (
        <IpcAnalisis filas={filas} resumen={resumen} />
      ) : (
        <IpcResumen filas={filas} resumen={resumen} filtrado={filtrado} />
      )}
    </div>
  )
}
