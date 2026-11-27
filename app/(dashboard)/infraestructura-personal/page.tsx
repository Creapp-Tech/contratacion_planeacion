import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { cn } from "cn";

import { InfraestructuraPersonalContenido } from "@/components/infraestructura-personal/infraestructura-personal-contenido";
import { SoloEscritura } from "@/components/auth/permisos-provider";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Infraestructura y Personal",
};

function ContenidoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function InfraestructuraPersonalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Infraestructura y Personal
          </h1>
          <p className="text-sm text-muted-foreground">
            Planeación de infraestructura y personal por sede.
          </p>
        </div>

        <SoloEscritura>
          <Link
            href="/infraestructura-personal/nuevo"
            className={cn(buttonVariants())}
          >
            <PlusIcon />
            Nuevo
          </Link>
        </SoloEscritura>
      </div>

      <Suspense fallback={<ContenidoSkeleton />}>
        <InfraestructuraPersonalContenido searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
