"use client"

interface CupDetalleContenidoProps {
  params: Promise<{ id: string }>
}

export async function CupDetalleContenido({
  params,
}: CupDetalleContenidoProps) {
  const { id } = await params

  // En un entorno real esto vendría del server, pero por simplicidad usamos un placeholder
  // Los datos se pasan desde el servidor en una implementación completa
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="bg-muted p-4 rounded-lg">
        <dt className="text-sm font-medium text-muted-foreground">Código</dt>
        <dd className="text-lg font-mono font-semibold">{id}</dd>
      </div>
      <div className="col-span-full bg-muted p-4 rounded-lg">
        <dt className="text-sm font-medium text-muted-foreground">Información</dt>
        <dd className="text-sm text-muted-foreground">
          Detalle del CUPS {id}
        </dd>
      </div>
    </div>
  )
}
