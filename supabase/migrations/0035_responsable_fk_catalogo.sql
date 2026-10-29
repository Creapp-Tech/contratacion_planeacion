-- 0035_responsable_fk_catalogo.sql
-- Migra los responsables existentes (usuarios) al catálogo de opciones
-- y re-apunta la FK de contratos.responsable_id a catalogos_opciones.

-- 1) Copiar al catálogo los usuarios que hoy son responsables de contratos.
insert into public.catalogos_opciones (dominio, nombre)
select distinct 'responsable', u.nombre_completo
from public.usuarios u
join public.contratos c on c.responsable_id = u.id
where u.nombre_completo is not null
  and btrim(u.nombre_completo) <> ''
on conflict (dominio, nombre) do nothing;

-- 2) Quitar la FK anterior para poder reasignar los ids.
alter table public.contratos
  drop constraint if exists contratos_responsable_id_fkey;

-- 3) Reasignar cada contrato al id correspondiente del catálogo.
update public.contratos c
set responsable_id = co.id
from public.usuarios u
join public.catalogos_opciones co
  on co.dominio = 'responsable'
 and co.nombre = u.nombre_completo
where c.responsable_id = u.id;

-- 4) Normalizar nombres duplicados por espacios sobrantes.
with duplicados as (
  select co.id as id_duplicado, limpio.id as id_valido
  from public.catalogos_opciones co
  join public.catalogos_opciones limpio
    on limpio.dominio = co.dominio
   and limpio.id <> co.id
   and limpio.nombre = btrim(co.nombre)
  where co.dominio = 'responsable'
    and co.nombre <> btrim(co.nombre)
)
update public.contratos c
set responsable_id = duplicados.id_valido
from duplicados
where c.responsable_id = duplicados.id_duplicado;

delete from public.catalogos_opciones co
where co.dominio = 'responsable'
  and co.nombre <> btrim(co.nombre)
  and not exists (
    select 1 from public.contratos c where c.responsable_id = co.id
  );

update public.catalogos_opciones
set nombre = btrim(nombre)
where dominio = 'responsable'
  and nombre <> btrim(nombre);

-- 5) Nueva FK apuntando al catálogo de responsables.
alter table public.contratos
  add constraint contratos_responsable_id_fkey
  foreign key (responsable_id) references public.catalogos_opciones(id)
  on delete restrict;

comment on column public.contratos.responsable_id is
  'Responsable del contrato (catálogo de responsables).';
