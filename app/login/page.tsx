import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"
import { Building2Icon, ClipboardListIcon, UsersIcon } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede al sistema de planeación de la contratación de VIVA 1A IPS.",
}

const highlights = [
  { icon: UsersIcon, text: "Administración de usuarios y roles" },
  { icon: Building2Icon, text: "Gestión de sedes y regionales" },
  { icon: ClipboardListIcon, text: "Plantilla de contratación centralizada" },
]

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-32 -bottom-40 size-[32rem] rounded-full bg-black/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),transparent_55%)]" />
        </div>

        <div className="relative z-10 w-fit rounded-2xl bg-white/95 px-5 py-4 shadow-lg ring-1 ring-white/50">
          <div className="relative h-10 w-32">
            <Image
              src="/brand/logo-viva1a.png"
              alt="VIVA 1A IPS"
              fill
              priority
              sizes="128px"
              className="object-contain object-left"
            />
          </div>
        </div>

        <div className="relative z-10 ">
          <h2 className="text-3xl font-semibold text-balance">
            Planeación de la contratación
          </h2>
          <p className="mt-3 text-sm/relaxed text-primary-foreground/80">
            Centraliza la información de la entidad y agiliza la planeación
            contractual desde un solo lugar.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <Icon className="size-4" />
                </span>
                <span className="text-primary-foreground/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/70">
          © VIVA 1A IPS · Todos los derechos reservados.
        </p>
      </aside>

      <section className="flex flex-col items-center justify-center gap-8 bg-muted/30 p-6 sm:p-10">
        <div className="relative h-12 w-44 lg:hidden">
          <Image
            src="/brand/logo-viva1a.png"
            alt="VIVA 1A IPS"
            fill
            priority
            sizes="176px"
            className="object-contain"
          />
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <p className="text-xs text-muted-foreground">© VIVA 1A IPS</p>
      </section>
    </main>
  )
}

function LoginFormFallback() {
  return (
    <div className="w-full rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-9 w-full animate-pulse rounded bg-muted" />
      <div className="mt-4 h-9 w-full animate-pulse rounded bg-muted" />
      <div className="mt-6 h-11 w-full animate-pulse rounded bg-muted" />
    </div>
  )
}
