# Cambio en vista docente: módulos por sección

La vista de docente ahora carga directamente desde `asignaciones_docentes_2026` el catálogo 2026.

Flujo:
1. Año
2. Especialidad
3. Sección
4. Módulo
5. Registrar estudiantes y avance

El módulo se lista según la sección seleccionada, sin limitarse al `codigo_siges` del docente.
El servidor valida que el módulo exista para ese año + especialidad + sección y guarda el avance a nombre del docente autenticado.
