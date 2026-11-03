"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "cn"

export type ComboboxOption = {
  value: string
  label: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  id,
  placeholder = "Selecciona una opción",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados.",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: {
  options: ComboboxOption[]
  value: string | null
  onValueChange: (value: string | null) => void
  id?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
}) {
  const items = React.useMemo(
    () =>
      ComboboxPrimitive.createItems(options, {
        getValue: (option) => option.value,
        getLabel: (option) => option.label,
      }),
    [options]
  )

  return (
    <ComboboxPrimitive.Root
      items={items}
      value={value ?? null}
      onValueChange={(next) => onValueChange(next ?? null)}
    >
      <ComboboxPrimitive.Trigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-1.5 rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
      >
        <span className="flex-1 truncate text-left">
          <ComboboxPrimitive.Value placeholder={placeholder} />
        </span>
        <ComboboxPrimitive.Icon>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          sideOffset={4}
          align="start"
          className="isolate z-50"
        >
          <ComboboxPrimitive.Popup
            className="relative isolate z-50 flex w-(--anchor-width) min-w-36 flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <div className="border-b border-border/50 p-2">
              <ComboboxPrimitive.Input
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-8 w-full min-w-0 rounded-xl border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              />
            </div>
            <ComboboxPrimitive.Empty className="px-3 py-3 text-sm text-muted-foreground">
              {emptyMessage}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-64 overflow-y-auto overscroll-contain p-1">
              {(option: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex w-full cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}
