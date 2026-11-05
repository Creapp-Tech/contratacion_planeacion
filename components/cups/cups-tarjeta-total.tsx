import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CupsTarjetaTotal({ cups }: { cups: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Total CUPS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{cups}</div>
        <div className="text-sm text-muted-foreground">Registros en catálogo</div>
      </CardContent>
    </Card>
  )
}
