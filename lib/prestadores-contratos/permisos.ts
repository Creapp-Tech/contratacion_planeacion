import {
  alcanceTotal,
  esGerenteRegional,
  puedeAccederPrestadoresContratos,
  puedeEditarPrestadoresContratos,
} from "@/lib/constants/roles"

/**
 * Comparación de regionales sin acceder a base de datos, para poder usarla
 * tanto en componentes de servidor como de cliente.
 */
export function mismaRegionalTexto(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function algunaRegionalCoincide(
  regionalUsuario: string | null | undefined,
  regionalesRegistro: string | string[] | null | undefined
): boolean {
  const regionales = Array.isArray(regionalesRegistro)
    ? regionalesRegistro
    : [regionalesRegistro]
  return regionales.some((regional) =>
    mismaRegionalTexto(regionalUsuario, regional)
  )
}

/**
 * Autorización de lectura por fila. Un especialista puede tener varias
 * regionales (derivadas de sus sedes) y basta una coincidente con la del
 * usuario. El gerente regional también ve los registros que él creó, aunque
 * todavía no tenga sedes asignadas.
 */
export function puedeVerRegistroPrestadoresContratos(
  rol: string,
  regionalUsuario: string | null | undefined,
  regionalesRegistro: string | string[] | null | undefined,
  createdBy?: string | null,
  usuarioId?: string | null
): boolean {
  if (!puedeAccederPrestadoresContratos(rol)) return false
  if (alcanceTotal(rol)) return true
  if (
    esGerenteRegional(rol) &&
    usuarioId &&
    createdBy &&
    usuarioId === createdBy
  ) {
    return true
  }
  return algunaRegionalCoincide(regionalUsuario, regionalesRegistro)
}

/**
 * Autorización de escritura por fila. Un gerente regional sólo puede editar
 * registros de su regional (o que él creó); el resto de roles con permiso de
 * escritura tienen alcance total. Los roles de solo lectura nunca pueden editar.
 */
export function puedeEditarRegistroPrestadoresContratos(
  rol: string,
  regionalUsuario: string | null | undefined,
  regionalesRegistro: string | string[] | null | undefined,
  createdBy?: string | null,
  usuarioId?: string | null
): boolean {
  if (!puedeEditarPrestadoresContratos(rol)) return false
  return puedeVerRegistroPrestadoresContratos(
    rol,
    regionalUsuario,
    regionalesRegistro,
    createdBy,
    usuarioId
  )
}
