import {
  puedeEditarRegistroDireccionamiento,
  puedeVerRegistroDireccionamiento,
} from "@/lib/direccionamiento/permisos"

/**
 * Los permisos son idénticos a Direccionamiento. La regional del registro se
 * deriva del contrato (regional principal + regionales adicionales).
 */
export function puedeVerServicioAsegurador(
  rol: string,
  regionalUsuario: string | null | undefined,
  regionalesContrato: string | string[] | null | undefined,
  createdBy?: string | null,
  usuarioId?: string | null
): boolean {
  return puedeVerRegistroDireccionamiento(
    rol,
    regionalUsuario,
    regionalesContrato,
    createdBy,
    usuarioId
  )
}

export function puedeEditarServicioAsegurador(
  rol: string,
  regionalUsuario: string | null | undefined,
  regionalesContrato: string | string[] | null | undefined,
  createdBy?: string | null,
  usuarioId?: string | null
): boolean {
  return puedeEditarRegistroDireccionamiento(
    rol,
    regionalUsuario,
    regionalesContrato,
    createdBy,
    usuarioId
  )
}
