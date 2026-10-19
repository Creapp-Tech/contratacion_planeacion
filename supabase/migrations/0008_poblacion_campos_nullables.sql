-- 0008_poblacion_campos_nullables.sql
-- Permitir guardar NULL en campos poblacionales para carga masiva con valores vacíos

alter table public.poblacion_aseguradora
  alter column poblacion_activa drop not null,
  alter column poblacion_pagada drop not null,
  alter column poblacion_certificada drop not null;
