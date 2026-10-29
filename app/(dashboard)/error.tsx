"use client";

import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Un error de perfil (la sesión es válida pero falta el registro en
  // public.usuarios) se muestra en pantalla SIN cerrar la sesión.
  const esPerfil = error.name === "PerfilError";

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full ">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-amber-500" />
            <CardTitle>
              {esPerfil ? "No pudimos cargar tu perfil" : "Ocurrió un error"}
            </CardTitle>
          </div>
          <CardDescription>
            {esPerfil
              ? error.message
              : "Hubo un problema al cargar esta sección. Tu sesión sigue activa."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => reset()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
