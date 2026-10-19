# Project Context: planeacion_contratacion_v2

## Overview
Next.js 16.4.0 with App Router, TypeScript, and shadcn/ui component library. Supabase for backend services (Auth, Database, Storage).

## Tech Stack
- **Framework**: Next.js 16.4.0 (App Router)
- **Language**: TypeScript 5.x
- **UI**: shadcn/ui with Tailwind CSS 4.3.3
- **State**: React Hook Form + Zod validation
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Components**: @base-ui/react, lucide-react icons

## Architecture
- App Router with `(dashboard)` protected route group
- Server Actions for mutations (create, edit, delete)
- Client components for interactivity
- Database-first approach: types generated from Supabase schema

## Conventions
- All modules follow: **table + create button** pattern
- Components live in `components/ui/` (shared) and `components/[module]/` (module-specific)
- Types in `lib/types/` or inline within module folders
- Server actions in `app/(dashboard)/[module]/actions.ts`
- Queries in `lib/[module]/queries.ts`

## AI Development Guidelines
- Use `CONTEXT.md` for project state tracking
- Use `MEMORY.md` for conversation history and learned patterns
- New modules MUST use the standardized template in `STRUCTURE.md`
- Never create unique table designs - reuse `components/ui/standard-table`
- Always include a primary "Nuevo" button linking to `[module]/nuevo`