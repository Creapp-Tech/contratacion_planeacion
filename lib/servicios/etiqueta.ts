export function etiquetaServicio(
  nombre: string,
  grupo: string | null | undefined
) {
  return grupo ? `${nombre} (${grupo})` : nombre
}
