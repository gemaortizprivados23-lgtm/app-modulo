-- App Módulos - esquema PostgreSQL/Supabase
-- Ejecutar completo en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.docentes (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  correo text not null unique,
  activo boolean not null default true,
  codigo_siges text,
  usuario text,
  created_at timestamptz not null default now()
);

create table if not exists public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombres text not null,
  apellidos text not null,
  año text not null,
  especialidad text not null,
  seccion text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nombre text not null,
  especialidad text not null,
  año text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique(codigo, año, especialidad)
);

create table if not exists public.avances (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.estudiantes(id) on delete restrict,
  docente_id uuid not null references public.docentes(id) on delete restrict,
  modulo_id uuid not null references public.modulos(id) on delete restrict,
  año text not null,
  especialidad text not null,
  seccion text not null,
  descripcion_avance text not null default '',
  porcentaje_avance numeric(5,2) not null check (porcentaje_avance between 0 and 100),
  observaciones text not null default '',
  fecha_registro date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_estudiantes_año on public.estudiantes(año);
create index if not exists idx_estudiantes_especialidad on public.estudiantes(especialidad);
create index if not exists idx_estudiantes_seccion on public.estudiantes(seccion);
create index if not exists idx_avances_estudiante on public.avances(estudiante_id);
create index if not exists idx_avances_docente on public.avances(docente_id);
create index if not exists idx_avances_modulo on public.avances(modulo_id);
create index if not exists idx_avances_seccion on public.avances(seccion);
create index if not exists idx_avances_fecha on public.avances(fecha_registro);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_avances_updated_at on public.avances;
create trigger trg_avances_updated_at before update on public.avances for each row execute function public.set_updated_at();

-- Crea automáticamente el perfil docente cuando una cuenta se registra.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.docentes (id, nombre, apellido, correo, codigo_siges, usuario, activo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre','Docente'),
    coalesce(new.raw_user_meta_data->>'apellido',''),
    new.email,
    nullif(new.raw_user_meta_data->>'codigo_siges',''),
    nullif(new.raw_user_meta_data->>'usuario',''),
    true
  )
  on conflict (id) do update set nombre=excluded.nombre, apellido=excluded.apellido, correo=excluded.correo, codigo_siges=coalesce(excluded.codigo_siges,public.docentes.codigo_siges), usuario=coalesce(excluded.usuario,public.docentes.usuario), activo=true;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.docentes enable row level security;
alter table public.estudiantes enable row level security;
alter table public.modulos enable row level security;
alter table public.avances enable row level security;

-- Docentes: cada usuario puede leer el directorio y modificar su propio perfil.
drop policy if exists docentes_select_authenticated on public.docentes;
create policy docentes_select_authenticated on public.docentes for select to authenticated using (true);
drop policy if exists docentes_insert_own on public.docentes;
create policy docentes_insert_own on public.docentes for insert to authenticated with check (id = auth.uid());
drop policy if exists docentes_update_own on public.docentes;
create policy docentes_update_own on public.docentes for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Catálogos académicos: visibles y administrables por usuarios autenticados.
drop policy if exists estudiantes_all_authenticated on public.estudiantes;
create policy estudiantes_all_authenticated on public.estudiantes for all to authenticated using (true) with check (true);
drop policy if exists modulos_all_authenticated on public.modulos;
create policy modulos_all_authenticated on public.modulos for all to authenticated using (true) with check (true);

-- Avances: lectura para usuarios autenticados; escritura/eliminación solo sobre registros del docente autenticado.
drop policy if exists avances_select_authenticated on public.avances;
create policy avances_select_authenticated on public.avances for select to authenticated using (true);
drop policy if exists avances_insert_own on public.avances;
create policy avances_insert_own on public.avances for insert to authenticated with check (docente_id = auth.uid());
drop policy if exists avances_update_own on public.avances;
create policy avances_update_own on public.avances for update to authenticated using (docente_id = auth.uid()) with check (docente_id = auth.uid());
drop policy if exists avances_delete_own on public.avances;
create policy avances_delete_own on public.avances for delete to authenticated using (docente_id = auth.uid());

-- Datos de ejemplo opcionales: no se insertan registros para no contaminar los datos reales.

-- Registro libre de estudiantes con actividades atrasadas para docentes
create table if not exists public.atrasos_actividades (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references public.docentes(id) on delete restrict,
  modulo_nombre text not null,
  seccion text not null,
  anio text,
  especialidad text,
  actividad_pendiente text not null,
  estudiante_nombre text not null,
  situacion text not null,
  observaciones text,
  acta_situacion boolean not null default false,
  informado_docente_guia boolean not null default false,
  fecha_registro date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_atrasos_docente on public.atrasos_actividades(docente_id);
create index if not exists idx_atrasos_fecha on public.atrasos_actividades(fecha_registro);
create index if not exists idx_atrasos_modulo on public.atrasos_actividades(modulo_nombre);
create index if not exists idx_atrasos_seccion on public.atrasos_actividades(seccion);
create index if not exists idx_atrasos_estudiante on public.atrasos_actividades(estudiante_nombre);
create trigger atrasos_set_updated_at before update on public.atrasos_actividades for each row execute function public.set_updated_at();
alter table public.atrasos_actividades enable row level security;
create policy atrasos_select_own_or_admin on public.atrasos_actividades for select to authenticated using (docente_id = auth.uid() or public.is_app_admin());
create policy atrasos_insert_own_or_admin on public.atrasos_actividades for insert to authenticated with check (docente_id = auth.uid() or public.is_app_admin());
create policy atrasos_update_own_or_admin on public.atrasos_actividades for update to authenticated using (docente_id = auth.uid() or public.is_app_admin()) with check (docente_id = auth.uid() or public.is_app_admin());
create policy atrasos_delete_own_or_admin on public.atrasos_actividades for delete to authenticated using (docente_id = auth.uid() or public.is_app_admin());


create unique index if not exists ux_docentes_codigo_siges on public.docentes(codigo_siges) where codigo_siges is not null;
create unique index if not exists ux_docentes_usuario on public.docentes(usuario) where usuario is not null;
