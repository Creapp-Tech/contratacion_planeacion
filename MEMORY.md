# AI Development Memory

## Last Updated
2026-10-13

## Recent Patterns Learned
- Modules should have: table listing + create button + CRUD operations
- Use server actions for data mutations
- Use Supabase Client for read operations
- shadcn/ui components for consistency
- TypeScript strict mode enabled

## Decisions Made
- Table columns defined in types, rendered dynamically
- Create button always primary variant with PlusIcon
- Edit/Delete in dropdown menu per row
- Filters component shared across modules
- Navigation via sidebar in `(dashboard)` layout

## Pending Tasks
- [ ] Extract usuarios module into standardized template
- [ ] Create standard-table component
- [ ] Create standard-create-btn component
- [ ] Create module scaffolding script
- [ ] Update all module pages to use new pattern

## Learned Shortcuts
- `npm run dev` starts dev server
- `npm run lint` runs eslint
- Types generated from Supabase: `supabase gen types`
- Edge functions in `api/edge-functions/`