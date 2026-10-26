import * as XLSX from "xlsx"

import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const COLUMNAS_DATOS = [
  "tipo_frecuencia",
  "nombre_nota_tecnica",
  "sede",
  "regimen",
  "asegurador",
  "version",
  "servicio",
  "frecuencia",
  "usar_en_calculo",
]

export async function GET() {
  await requireSuperadmin()

  const admin = createAdminClient()

  const [sedesRes, aseguradoresRes, regimenesRes, serviciosRes] =
    await Promise.all([
      admin.from("sedes").select("nombre").order("nombre", { ascending: true }),
      admin
        .from("aseguradores_eps")
        .select("nombre_eps")
        .order("nombre_eps", { ascending: true }),
      admin
        .from("regimenes")
        .select("nombre")
        .order("nombre", { ascending: true }),
      admin
        .from("servicios")
        .select("id, nombre, grupos_servicio(nombre)")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
    ])

  if (sedesRes.error) throw sedesRes.error
  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (regimenesRes.error) throw regimenesRes.error
  if (serviciosRes.error) throw serviciosRes.error

  const workbook = XLSX.utils.book_new()

  const hojaDatos = XLSX.utils.aoa_to_sheet([
    COLUMNAS_DATOS,
    [
      "nota_tecnica_viva",
      "Ejemplo de nota técnica",
      "SEDE DE EJEMPLO",
      "Contributivo",
      "ASEGURADOR DE EJEMPLO",
      "v1",
      "SERVICIO DE EJEMPLO",
      "1,5",
      "",
    ],
  ])
  hojaDatos["!cols"] = [
    { wch: 22 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    { wch: 32 },
    { wch: 12 },
    { wch: 32 },
    { wch: 14 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "Frecuencias")

  const hojaSedes = XLSX.utils.aoa_to_sheet([
    ["sede"],
    ...((sedesRes.data ?? []) as { nombre: string }[]).map((sede) => [
      sede.nombre,
    ]),
  ])
  hojaSedes["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaSedes, "Sedes")

  const hojaRegimenes = XLSX.utils.aoa_to_sheet([
    ["regimen"],
    ...((regimenesRes.data ?? []) as { nombre: string }[]).map((regimen) => [
      regimen.nombre,
    ]),
  ])
  hojaRegimenes["!cols"] = [{ wch: 24 }]
  XLSX.utils.book_append_sheet(workbook, hojaRegimenes, "Regimenes")

  const hojaAseguradores = XLSX.utils.aoa_to_sheet([
    ["asegurador"],
    ...((aseguradoresRes.data ?? []) as { nombre_eps: string }[]).map((eps) => [
      eps.nombre_eps,
    ]),
  ])
  hojaAseguradores["!cols"] = [{ wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaAseguradores, "Aseguradores")

  const hojaServicios = XLSX.utils.aoa_to_sheet([
    ["servicio_id", "servicio"],
    ...(
      (serviciosRes.data ?? []) as unknown as {
        id: string
        nombre: string
        grupos_servicio: { nombre: string }[] | null
      }[]
    ).map((servicio) => [
      servicio.id,
      servicio.grupos_servicio?.[0]?.nombre
        ? `${servicio.nombre} (${servicio.grupos_servicio[0].nombre})`
        : servicio.nombre,
    ]),
  ])
  hojaServicios["!cols"] = [{ wch: 40 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, hojaServicios, "Servicios")

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet([
    ["Instrucciones"],
    [
      "La hoja 'Frecuencias' es la que se importa. Reemplaza la fila de ejemplo por tus datos.",
    ],
    [
      "Columnas: tipo_frecuencia, nombre_nota_tecnica, sede, regimen, asegurador, version, servicio, frecuencia. Opcional: servicio_id (preferido sobre el nombre) y usar_en_calculo (sí/no).",
    ],
    [
      "tipo_frecuencia válidos: nota_tecnica_viva, ejecucion_servicios, asegurador.",
    ],
    [
      "Las hojas 'Sedes', 'Regimenes', 'Aseguradores' y 'Servicios' son informativas: copia sus valores exactos para que coincidan en la importación. En 'Servicios' prefiere la columna servicio_id sobre el nombre.",
    ],
    [
      "El separador decimal es la coma (,). Ejemplo: 1,5. También se acepta punto (1.5).",
    ],
    [
      "La misma combinación de tipo, nota técnica, sede, régimen, asegurador y versión agrupa los servicios en una sola frecuencia.",
    ],
    [
      "Si un servicio ya existe en esa frecuencia se actualiza; si no, se agrega.",
    ],
    [
      "usar_en_calculo: escribe 'sí' para marcar la frecuencia con la que se calcula la ocupación, o 'no' para desmarcarla. Deja la celda vacía para no cambiar el estado. Solo puede haber una frecuencia marcada por sede y tipo (nota técnica viva / ejecución de servicios); si el archivo marca dos, no se importa.",
    ],
    [
      "Las celdas con 'null', 'N/A', '-' o 'sin dato' se toman como vacío. Sede, régimen, asegurador, versión y servicio son obligatorios.",
    ],
  ])
  hojaInstrucciones["!cols"] = [{ wch: 120 }]
  XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, "Instrucciones")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="plantilla-frecuencias.xlsx"',
    },
  })
}
