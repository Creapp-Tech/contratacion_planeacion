"use client"

import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "./button"

export interface StandardCreateBtnProps {
  module: string
  href?: string
}

export function StandardCreateBtn({
  module,
  href = `/${module}/nuevo`,
}: StandardCreateBtnProps) {
  return (
    <Link href={href} className={cn(buttonVariants())}>
      <PlusIcon />
      Nuevo {module}
    </Link>
  )
}
