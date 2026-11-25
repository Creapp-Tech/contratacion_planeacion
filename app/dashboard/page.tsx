"use client"

import Link from "next/link"

import { useUsuario } from "@/components/auth/permisos-provider"
import { getNavGroups } from "@/components/shell/nav-items"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export default function DashboardPage() {
  const usuario = useUsuario()

  if (!usuario) {
    return null
  }

  const groups = getNavGroups(usuario.rol)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-lg font-semibold">Sin módulos disponibles</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El rol{" "}
          <span className="font-medium">{usuario.rol}</span>{" "}
          no tiene módulos asignados. Contacta al administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona un módulo para comenzar.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.href} className="hover:border-primary/50 transition-border">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
                    <CardTitle className="text-base leading-none">{item.title}</CardTitle>
                    <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardDescription>
                    Módulo de {item.title.toLowerCase()}
                  </CardDescription>
                  <CardContent className="pt-4">
                    <Link
                      href={item.href}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                    >
                      Ir a {item.title}
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
