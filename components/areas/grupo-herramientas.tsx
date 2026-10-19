"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  CheckIcon,
  Loader2Icon,
  PencilIcon,
  TagsIcon,
  XIcon,
} from "lucide-react"

import {
  cambiarEstadoGrupoArea,
  crearGrupoArea,
  renombrarGrupoArea,
} from "@/app/(dashboard)/configuracion/areas/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { GrupoArea } from "@/lib/areas/queries"

const MENSAJE_TRANSPORTE =
  "An unexpected response was received from the server."

function mensajeError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message.trim() : ""
  if (!message || message === MENSAJE_TRANSPORTE) {
    return fallback
  }
  return message
}

export function GrupoHerramientas({ grupos }: { grupos: GrupoArea[] }) {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [pendingCrear, setPendingCrear] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function onCrear(event: React.FormEvent) {
    event.preventDefault()
    setPendingCrear(true)
    setError(null)

    try {
      const result = await crearGrupoArea({ nombre })
      if ("error" in result) {
        setError(result.error)
        return
      }

      setNombre("")
      router.refresh()
    } catch (cause) {
      setError(mensajeError(cause, "No se pudo crear el grupo."))
    } finally {
      setPendingCrear(false)
    }
  }

  async function onRenombrar(id: string) {
    setPendingId(id)
    setError(null)

    try {
      const result = await renombrarGrupoArea(id, nombreEditado)
      if ("error" in result) {
        setError(result.error)
        return
      }

      setEditandoId(null)
      router.refresh()
    } catch (cause) {
      setError(mensajeError(cause, "No se pudo renombrar el grupo."))
    } finally {
      setPendingId(null)
    }
  }

  async function onToggle(id: string, activo: boolean) {
    setPendingId(id)
    setError(null)

    try {
      const result = await cambiarEstadoGrupoArea(id, activo)
      if ("error" in result) {
        setError(result.error)
        return
      }

      router.refresh()
    } catch (cause) {
      setError(
        mensajeError(cause, "No se pudo cambiar el estado del grupo.")
      )
    } finally {
      setPendingId(null)
    }
  }

  function empezarEdicion(grupo: GrupoArea) {
    setEditandoId(grupo.id)
    setNombreEditado(grupo.nombre)
    setError(null)
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setNombreEditado("")
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <TagsIcon />
        Nuevo grupo
      </DialogTrigger>

      <DialogContent className="data-[size=default]:max-w-md">
        <DialogHeader>
          <DialogTitle>Grupos de áreas</DialogTitle>
          <DialogDescription>
            Crea y administra los grupos del catálogo de áreas. Los grupos
            inactivos dejan de aparecer al crear o editar un área.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onCrear} className="flex items-center gap-2">
          <Input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Nombre del grupo"
            maxLength={100}
            disabled={pendingCrear}
          />
          <Button
            type="submit"
            size="sm"
            disabled={pendingCrear || nombre.trim().length === 0}
          >
            {pendingCrear ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <TagsIcon />
            )}
            Crear
          </Button>
        </form>

        <div className="flex flex-col divide-y rounded-xl border">
          {grupos.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No hay grupos registrados.
            </p>
          ) : null}

          {grupos.map((grupo) => {
            const editando = editandoId === grupo.id
            const ocupado = pendingId === grupo.id

            return (
              <div key={grupo.id} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  {editando ? (
                    <Input
                      value={nombreEditado}
                      onChange={(event) =>
                        setNombreEditado(event.target.value)
                      }
                      maxLength={100}
                      disabled={ocupado}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm">{grupo.nombre}</span>
                      {!grupo.activo ? (
                        <span className="text-xs text-muted-foreground">
                          (inactivo)
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {editando ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Guardar nombre"
                      onClick={() => onRenombrar(grupo.id)}
                      disabled={ocupado || nombreEditado.trim().length === 0}
                    >
                      {ocupado ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <CheckIcon />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Cancelar"
                      onClick={cancelarEdicion}
                      disabled={ocupado}
                    >
                      <XIcon />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Renombrar ${grupo.nombre}`}
                      onClick={() => empezarEdicion(grupo)}
                      disabled={ocupado || editandoId !== null}
                    >
                      <PencilIcon />
                    </Button>
                    <Switch
                      checked={grupo.activo}
                      onCheckedChange={(checked) =>
                        onToggle(grupo.id, checked)
                      }
                      disabled={ocupado}
                      aria-label={`Activar o desactivar ${grupo.nombre}`}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
