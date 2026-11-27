import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "cn";

import { InfraestructuraPersonalNuevoContenido } from "@/components/infraestructura-personal/infraestructura-personal-nuevo-contenido";
import { requireEditorPlaneacion } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Nueva planeación - Infraestructura y Personal",
};

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />;
}

export default function NuevaPlaneacionPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/infraestructura-personal"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver al listado
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Nueva planeación</CardTitle>
          <CardDescription>
            Define la sede, espacios, frecuencias de referencia y servicios a
            prestar en esta planeación.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<FormSkeleton />}>
            <InfraestructuraPersonalNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Guardia de escritura del módulo Planeación.
requireEditorPlaneacion();
