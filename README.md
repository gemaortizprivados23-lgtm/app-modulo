# App Módulos

Aplicación web para registrar y reportar avances académicos de módulos.

## Tecnologías

- React + Vite
- Supabase Auth
- PostgreSQL / Supabase
- React Router
- jsPDF + AutoTable

## Ejecutar

```bash
npm install
npm run dev
```

La configuración local usa `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Base de datos

El esquema de producción ya fue creado en el proyecto Supabase asociado a esta aplicación. El archivo `supabase/schema.sql` contiene el esquema reproducible.

## Seguridad

No incluir claves `service_role` ni otras claves privadas en el frontend. La variable `VITE_SUPABASE_ANON_KEY` debe contener únicamente la clave pública/publishable de Supabase.


## Roles
- Administrador: `angelelcielo@gmail.com`
- Docentes: solo `Registrar avance`.
- Las cuentas docentes se crean desde `Docentes > Nuevo docente` mediante la Edge Function segura `admin-create-teacher`.

## Vista por roles

- Administrador: `angelelcielo@gmail.com` mantiene acceso a Dashboard, estudiantes, docentes, módulos, avances, historial y reportes.
- Docentes: solamente acceden a `/avances`, donde pueden registrar libremente el nombre del módulo, sección, actividad pendiente y uno o varios estudiantes con la situación específica de cada uno.
- Los registros de atrasos se guardan en `atrasos_actividades` con fecha automática de PostgreSQL.
- El administrador puede consultar estos registros en Historial y Reportes y generar PDF/impresión.

## Asignación docente 2026

El formulario docente utiliza el **código SIGES** del docente para mostrar únicamente los módulos, año, especialidad y sección que aparecen en la asignación docente 2026. El administrador debe registrar ese código desde **Docentes -> Nuevo docente** o al editar un docente.

El docente no administra catálogos. Su única vista es **Registrar avance**, donde selecciona un módulo asignado y registra varios estudiantes con porcentaje, estado y situación/actividad atrasada.

## Vista docente y asignación 2026

La asignación docente 2026 se incluyó en `src/data/assignments.js`. Cada cuenta docente se crea desde la cuenta administradora `angelelcielo@gmail.com` con un **código SIGES**. Ese código determina los módulos, años, especialidades y secciones que aparecen en la vista docente.

El docente solo tiene acceso a **Registrar avance**. No administra estudiantes, módulos, docentes, historial ni reportes. Para cada módulo asignado puede agregar varios estudiantes, porcentaje de avance, estado, situación/actividad atrasada y observaciones. Al guardar, el sistema crea o encuentra automáticamente el estudiante y el módulo en Supabase y registra el avance real en `avances`.

La cuenta docente se crea mediante la Edge Function `admin-create-teacher-v2` sin activar el flujo público de registro por correo, evitando el error `email rate limit exceeded`.


## Acceso docente 2026
Los docentes ingresan con su código SIGES de 9 dígitos y contraseña inicial. No se requiere confirmación de correo. La cuenta administradora es angelelcielo@gmail.com.


## Acceso docente sin verificación de correo
Los docentes de la asignación 2026 ingresan con su **usuario SIGES de 9 dígitos** y una contraseña inicial con el formato `Docente2026!XXXX`, donde `XXXX` son los últimos cuatro dígitos del código SIGES.

La cuenta administradora es `angelelcielo@gmail.com`. En la sección **Docentes** de la vista administrativa, usa **Preparar cuentas 2026** para crear o actualizar las cuentas docentes. La función administrativa marca las cuentas como confirmadas, no envía correos de confirmación.

Los docentes solo ven **Registrar avance**. Sus módulos se filtran mediante `src/data/assignments.js`, tomando el código SIGES de la asignación docente 2026.


## Acceso docente 2026
Los docentes no utilizan correo electrónico para iniciar sesión. Ingresan con su código SIGES de 9 dígitos y la contraseña asignada `Docente2026!` + últimos cuatro dígitos del código. La cuenta de Supabase se crea o actualiza automáticamente en el primer inicio de sesión, sin confirmación por correo.


## Asignaciones docentes 2026 verificadas
La vista docente usa las 278 relaciones módulo-docente extraídas de los PDF de asignación 2026. El backend valida cada registro contra `asignaciones_docentes_2026`.


### Vista docente
La pantalla del docente muestra su nombre automáticamente y permite seleccionar el año, la especialidad, el módulo y la sección. Los módulos se cargan desde el catálogo derivado de las asignaciones 2026, agrupados por año y especialidad; no se filtran por código SIGES.
