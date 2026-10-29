-- 0033_agregar_tabla_contrato_documentos.sql
-- Tabla para llevar el historial de documentos modificatorios, otrosí y anexos
-- cada contrato puede tener varios documentos, pero solo uno es vigente

begin;

-- Tabla de documentos del contrato
create table if not exists public.contrato_documentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  tipo_documento text not null check (tipo_documento in ('primigenio','modificatorio','otro_si','anexo')),
  numero_documento text not null,
  fecha_otorgamiento date not null,
  fecha_publicacion date,
  archivo_url text not null,
  resumen_cambios text,
  campos_afectados jsonb default '[]'::jsonb,
  es_vigente boolean not null default false,
  numero_version integer not null default 1,
  created_by uuid references public.usuarios(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Restricción: solo un documento vigente por contrato
  constraint uq_contrato_documento_vigente unique (contrato_id) where (es_vigente = true)
);

-- Índices para rendimiento
create index if not exists idx_contrato_doc_contrato on public.contrato_documentos (contrato_id);
create index if not exists idx_contrato_doc_vigente on public.contrato_documentos (contrato_id) where es_vigente = true;
create index if not exists idx_contrato_doc_version on public.contrato_documentos (contrato_id, numero_version desc);

-- Comentarios para documentación
comment on table public.contrato_documentos is 'Historial de documentos (modificatorio, otrosí, anexo) asociados a un contrato. Solo uno por contrato puede tener es_vigente = true.';
comment on column public.contrato_documentos.tipo_documento is 'Tipo de documento: primigenio (contrato original), modificatorio, otro_si, anexo';
comment on column public.contrato_documentos.numero_documento is 'Identificador del documento (ej. MOD-001, OTROSÍ-02)';
comment on column public.contrato_documentos.fecha_otorgamiento is 'Fecha en que se firmó el documento';
comment on column public.contrato_documentos.fecha_publicacion is 'Cuándo entra en vigor el cambio (opcional)';
comment on column public.contrato_documentos.archivo_url is 'URL pública del archivo firmado (ej. OneDrive)';
comment on column public.contrato_documentos.resumen_cambios is 'Breve descripción de qué cambió (ej. "Cambio de valor a 6500")';
comment on column public.contrato_documentos.campos_afectados is 'JSON con los campos del contrato afectados, ej. {"valor_total": true}';
comment on column public.contrato_documentos.es_vigente es 'Indica si este documento es el vigente actualmente';
comment on column public.contrato_documentos.numero_version es 'Número de versión dentro del contrato (1 = primigenio, 2 = primera modificación, etc.)';

grant all on public.contrato_documentos to authenticated, service_role;

commit;