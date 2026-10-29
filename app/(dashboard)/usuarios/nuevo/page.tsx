import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { UsuarioNuevoContenido } from "@/components/usuarios/usuario-nuevo-contenido"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Nuevo usuario",
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}

export default function NuevoUsuarioPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/usuarios"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver a usuarios
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Nuevo usuario</CardTitle>
          <CardDescription>
            Crea un usuario y define su rol de acceso al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <UsuarioNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
