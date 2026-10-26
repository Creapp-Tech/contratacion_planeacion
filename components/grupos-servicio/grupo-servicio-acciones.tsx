"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  CircleCheckIcon,
  CircleOffIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import {
  cambiarEstadoGrupoServicio,
  eliminarGrupoServicio,
} from "@/app/(dashboard)/configuracion/grupos-servicio/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

type Dialogo = "estado" | "eliminar" | null

type GrupoServicioAccionesProps = {
  id: string
  nombre: string
  activo: boolean
}

export function GrupoServicioAcciones({
  id,
  nombre,
  activo,
}: GrupoServicioAccionesProps) {
  const router = useRouter()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function abrir(sig: Exclude<Dialogo, null>) {
    setError(null)
    setDialogo(sig)
  }

  function onConfirm() {
    if (!dialogo) return
    setError(null)
    startTransition(async () => {
      const result =
        dialogo === "eliminar"
          ? await eliminarGrupoServicio(id)
          : await cambiarEstadoGrupoServicio(id, !activo)

      if ("error" in result) {
        setError(result.error)
        return
      }
      setDialogo(null)
      router.refresh()
    })
  }

  const esEliminar = dialogo === "eliminar"
  const tituloDialogo = esEliminar
    ? "Eliminar grupo"
    : activo
      ? "Desactivar grupo"
      : "Activar grupo"
  const descripcionDialogo = esEliminar
    ? `Se eliminará «${nombre}» del catálogo de forma definitiva. Si tiene servicios asociados no será posible eliminarlo; en ese caso desactívalo en su lugar. Esta acción no se puede deshacer.`
    : activo
      ? `«${nombre}» dejará de aparecer en los selectores de servicio y en la importación de CSV. Los servicios que ya lo usan lo conservan.`
      : `«${nombre}» volverá a aparecer en los selectores de servicio y en la importación de CSV.`
  const textoConfirmar = esEliminar
    ? "Eliminar"
    : activo
      ? "Desactivar"
      : "Activar"

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/configuracion/grupos-servicio/${id}`}
        aria-label={`Ver ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <EyeIcon />
      </Link>
      <Link
        href={`/configuracion/grupos-servicio/${id}/editar`}
        aria-label={`Editar ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <PencilIcon />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={activo ? `Desactivar ${nombre}` : `Activar ${nombre}`}
        onClick={() => abrir("estado")}
      >
        {activo ? <CircleOffIcon /> : <CircleCheckIcon />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Eliminar ${nombre}`}
        onClick={() => abrir("eliminar")}
      >
        <Trash2Icon />
      </Button>

      <AlertDialog
        open={dialogo !== null}
        onOpenChange={(open) => {
          if (!open) setDialogo(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tituloDialogo}</AlertDialogTitle>
            <AlertDialogDescription>
              {descripcionDialogo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant={esEliminar ? "destructive" : "default"}
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              {textoConfirmar}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
