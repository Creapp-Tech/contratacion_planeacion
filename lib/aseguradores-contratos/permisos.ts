import {
  puedeEditarRegistroPrestadoresContratos,
  puedeVerRegistroPrestadoresContratos,
} from "@/lib/prestadores-contratos/permisos"

/**
 * Los permisos son idénticos a PrestadoresContratos. La regional del registro se
 * deriva del contrato (regional principal + regionales adicionales).
 */
export function puedeVerServicioAsegurador(
  rol: string,
  regionalUsuario: string | null | undefined,
  regionalesContrato: string | string[] | null | undefined,
  createdBy?: string | null,
  usuarioId?: string | null
): boolean {
  return puedeVerRegistroPrestadoresContratos(
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
  return puedeEditarRegistroPrestadoresContratos(
    rol,
    regionalUsuario,
    regionalesContrato,
    createdBy,
    usuarioId
  )
}
