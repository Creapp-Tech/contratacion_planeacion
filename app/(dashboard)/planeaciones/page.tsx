import { PlaneacionesForm } from "@/components/planeaciones/PlaneacionesForm"
import {
  obtenerPlaneaciones,
  obtenerOpcionesPlaneacion,
  obtenerFrecuenciasReferencia,
} from "./actions"

export default async function PlaneacionesPage() {
  const [resultPlaneaciones, resultOpciones, resultFrecuencias] = await Promise.all([
    obtenerPlaneaciones(),
    obtenerOpcionesPlaneacion(),
    obtenerFrecuenciasReferencia(),
  ])

  const planeaciones = resultPlaneaciones.ok ? resultPlaneaciones.data : []
  const opciones = resultOpciones.ok
    ? resultOpciones.data
    : { regionales: [], regimenes: [], aseguradores: [] }
  const frecuenciasReferencia = resultFrecuencias.ok ? resultFrecuencias.data : []

  return (
    <div className="p-4 md:p-6 w-full">
      <PlaneacionesForm
        planeaciones={planeaciones}
        opciones={opciones}
        frecuenciasReferencia={frecuenciasReferencia}
      />
    </div>
  )
}
