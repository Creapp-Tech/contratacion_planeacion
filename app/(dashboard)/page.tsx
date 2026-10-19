import Link from "next/link"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Bienvenido</h1>
        <p className="text-muted-foreground">
          Selecciona un módulo para comenzar.
        </p>
      </div>
      <Link href="/usuarios" className={cn(buttonVariants())}>
        Gestión de usuarios
      </Link>
    </div>
  )
}
