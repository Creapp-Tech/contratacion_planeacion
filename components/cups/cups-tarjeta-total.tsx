import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CupsTarjetaTotal({
  cups,
  filtrado = false,
}: {
  cups: number
  filtrado?: boolean
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="font-heading">
          {filtrado ? "CUPS filtrados" : "Total CUPS"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{cups}</div>
        <div className="text-sm text-muted-foreground">
          {filtrado ? "Coincidencias con los filtros" : "Registros en catálogo"}
        </div>
      </CardContent>
    </Card>
  )
}