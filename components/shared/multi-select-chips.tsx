"use client"

import { cn } from "cn"

export type MultiSelectOption = {
  value: string
  label: string
  hint?: string
}

export function MultiSelectChips({
  options,
  value,
  onChange,
  disabled = false,
  emptyMessage = "No hay opciones disponibles",
}: {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  emptyMessage?: string
}) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  const seleccionados = new Set(value)

  return (
    <div role="group" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = seleccionados.has(option.value)
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={disabled}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((item) => item !== option.value)
                  : [...value, option.value]
              )
            }
            title={option.hint}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {option.label}
            {option.hint ? (
              <span className="ml-1 text-xs opacity-70">{option.hint}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
