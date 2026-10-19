"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { EyeIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { eliminarCatalogo } from "@/lib/catalogos/actions"
import { CATALOGOS, type CatalogoDominio } from "@/lib/catalogos/dominios"
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

type CatalogoAccionesProps = {
  dominio: CatalogoDominio
  id: string
  nombre: string
}

export function CatalogoAcciones({ dominio, id, nombre }: CatalogoAccionesProps) {
  const config = CATALOGOS[dominio]
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await eliminarCatalogo(dominio, id)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`${config.ruta}/${id}`}
        aria-label={`Ver ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <EyeIcon />
      </Link>
      <Link
        href={`${config.ruta}/${id}/editar`}
        aria-label={`Editar ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <PencilIcon />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Borrar ${nombre}`}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <Trash2Icon />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar {config.singular}</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {nombre} de la lista de {config.titulo.toLowerCase()}.
              Las sedes que ya lo tengan asignado conservarán el valor. Esta
              acción no se puede deshacer.
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
              variant="destructive"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Borrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
