"use client"

import { cn } from "cn"

export type ChoiceChipOption = {
  value: string
  label: string
}

export function ChoiceChips({
  name,
  options,
  value,
  onChange,
  disabled = false,
}: {
  name?: string
  options: ChoiceChipOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {option.label}
          </button>
        )
      })}
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  )
}
