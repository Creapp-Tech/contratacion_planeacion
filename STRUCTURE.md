# Project Structure for AI-Assisted Development

## Root Directory
```
planeacion_contratacion_v2/
├── CONTEXT.md          # Project overview & architecture
├── MEMORY.md           # AI conversation history
├── PLANS.md            # Development roadmap
├── STRUCTURE.md        # This file - folder/component structure
├── app/                # Next.js App Router
├── components/         # React components
├── lib/                # Utilities and helpers
├── scripts/            # Automation scripts
└── supabase/           # Database & edge functions
```

## Module Pattern (MANDATORY for all new modules)

Each module follows this exact structure:

```
/module-name/
├── page.tsx            # Page with table + create button (REQUIRED)
├── actions.ts          # Server actions (create, edit, delete) (REQUIRED)
├── queries.ts          # Database list/query functions (REQUIRED)
├── types.ts            # Module-specific TypeScript types (OPTIONAL)
└── components/
    ├── table.tsx       # Standardized data table (from components/ui/)
    ├── form.tsx        # Standardized form (create/edit)
    ├── create-button.tsx   # From components/ui/standard-create-btn
    └── actions.tsx     # Module-specific action buttons (OPTIONAL)
```

## Shared Components (DO NOT duplicate)

### `components/ui/standard-table.tsx`
- Accepts `data` prop (array of row objects)
- Accepts `columns` prop (column definitions)
- Built-in sorting, pagination (future), responsive
- Actions column with edit/delete dropdown
- Loading and error states

### `components/ui/standard-create-btn.tsx`
- Always primary variant
- Contains PlusIcon from lucide-react
- Text: "Nuevo [Module Name]"
- Links to `/[module]/nuevo`
- On mobile: opens sheet or full-width button

### `components/shell/nav-*.tsx`
- Dynamic sidebar navigation generated from PLANS.md
- Active route highlighting
- Mobile hamburger menu

## Page Template (Every module page MUST use this)

```tsx
// app/(dashboard)/[module]/page.tsx
import { UsuariosContenido } from "@/components/[module]/usuarios-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusIcon } from "lucide-react"

export default function ModulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Module Name</h1>
        <Link
          href="/module/nuevo"
          className={cn(buttonVariants())}
        >
          <PlusIcon /> Nuevo
        </Link>
      </div>

      <Suspense fallback={<Skeleton />}>
        <UsuariosContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

## Forbidden Patterns (will cause code review rejection)

❌ Creating tables without a "Nuevo" button
❌ Unique table column ordering per module
❌ Using different button variants (secondary/ghost) for create
❌ Inconsistent header formatting (h1 size, spacing)
❌ Missing Suspense fallback for data fetching
❌ Direct SQL queries in components (use queries.ts or server actions)

## Enforcement
- ESLint custom rule will validate page structure
- PR template requires STRUCTURE.md checklist completion
- AI agents must reference this file when creating new modules
- Code reviews will reject modules not following this pattern