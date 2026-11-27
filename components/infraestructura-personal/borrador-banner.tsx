"use client";

import { InfoIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

export interface BorradorBannerProps {
  pending?: boolean;
  mensaje?: string;
}

export function BorradorBanner({
  pending = false,
  mensaje,
}: BorradorBannerProps) {
  return (
    <Alert className="flex items-center gap-3">
      <InfoIcon className="size-4 shrink-0" />
      <AlertDescription className="flex items-center gap-2">
        {pending ? (
          <>
            <Loader2Icon className="size-3 animate-spin shrink-0" />
            Guardando borrador…
          </>
        ) : (
          <>
            <span className="font-medium">
              Borrador guardado localmente.
            </span>
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">
              pendiente de persistencia
            </span>
          </>
        )}
        {mensaje ? <span className="ml-2 text-sm">{mensaje}</span> : null}
        {!mensaje && (
          <span className="ml-2 text-sm">
            Flujo sin envío a base de datos hasta confirmar persistencia.
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
