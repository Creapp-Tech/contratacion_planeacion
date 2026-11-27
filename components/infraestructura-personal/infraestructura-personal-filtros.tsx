"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2Icon, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

type FiltrosUI = {
  q?: string;
  asegurador?: string;
  regimen?: string;
  regional?: string;
  zonal?: string;
  estado?: string;
  sede?: string;
};

type OpcionesFiltros = {
  aseguradores: string[];
  regímenes: string[];
  regionales: string[];
  zonales: string[];
  sedes: string[];
  estados: string[];
};

function opcionesTexto(placeholder: string, valores: string[]) {
  return {
    items: Object.fromEntries([
      [ALL, placeholder],
      ...valores.map((valor) => [valor, valor]),
    ]),
    options: [
      { value: ALL, label: placeholder },
      ...valores.map((valor) => ({ value: valor, label: valor })),
    ],
  };
}

function FiltroSelect({
  id,
  value,
  placeholder,
  vacio,
  valores,
  disabled,
  onChange,
}: {
  id: string;
  value: string | undefined;
  placeholder: string;
  vacio: string;
  valores: string[];
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const { items, options } = opcionesTexto(placeholder, valores);

  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL || next == null ? undefined : next)
      }
      items={items}
      disabled={disabled || valores.length === 0}
    >
      <SelectTrigger id={id} className="w-full sm:w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {valores.length === 0 ? (
          <SelectItem value={ALL} disabled>
            {vacio}
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function InfraestructuraPersonalFiltros({
  opciones,
  filtros,
  opcionesError,
}: {
  opciones: OpcionesFiltros;
  filtros: FiltrosUI;
  opcionesError?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filtros.q ?? "");

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const hasFiltros = Boolean(
    filtros.q ||
      filtros.asegurador ||
      filtros.regimen ||
      filtros.regional ||
      filtros.zonal ||
      filtros.estado ||
      filtros.sede ||
      searchParams.get("regional")
  );

  const filtrosVacios =
    opcionesError ||
    (!opciones.aseguradores.length &&
      !opciones.regímenes.length &&
      !opciones.regionales.length &&
      !opciones.zonales.length &&
      !opciones.sedes.length &&
      !opciones.estados.length);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center gap-3">
        <form
          className="relative flex-1 lg:min-w-64"
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ q: q.trim() || undefined });
          }}
        >
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por sede, asegurador o régimen"
            className="pl-8"
            aria-label="Buscar planeaciones"
          />
        </form>

        <FiltroSelect
          id="filtro-asegurador"
          value={filtros.asegurador}
          placeholder="Asegurador"
          vacio="Sin aseguradores"
          valores={opciones.aseguradores}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ asegurador: value })}
        />

        <FiltroSelect
          id="filtro-regimen"
          value={filtros.regimen}
          placeholder="Régimen"
          vacio="Sin regímenes"
          valores={opciones.regímenes}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ regimen: value })}
        />

        <FiltroSelect
          id="filtro-regional"
          value={filtros.regional}
          placeholder="Regional"
          vacio="Sin regionales"
          valores={opciones.regionales}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ regional: value })}
        />

        <FiltroSelect
          id="filtro-zonal"
          value={filtros.zonal}
          placeholder="Zonal"
          vacio="Sin zonales"
          valores={opciones.zonales}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ zonal: value })}
        />

        <FiltroSelect
          id="filtro-sede"
          value={filtros.sede}
          placeholder="Sede"
          vacio="Sin sedes"
          valores={opciones.sedes}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ sede: value })}
        />

        <FiltroSelect
          id="filtro-estado"
          value={filtros.estado}
          placeholder="Estado"
          vacio="Sin estados"
          valores={opciones.estados}
          disabled={filtrosVacios}
          onChange={(value) => updateParams({ estado: value })}
        />

        {hasFiltros ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("");
              startTransition(() => router.replace(pathname));
            }}
          >
            <XIcon />
            Limpiar
          </Button>
        ) : null}

        {pending ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {filtrosVacios ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700">
          <span>No se pudieron cargar los filtros.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            <RefreshCwIcon />
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
