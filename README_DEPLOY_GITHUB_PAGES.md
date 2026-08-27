# Despliegue en GitHub Pages

Esta versión conserva la configuración del proyecto y usa `HashRouter` para evitar errores 404 al navegar o recargar rutas internas en GitHub Pages.

Cambios de esta versión:
- Inicio de sesión por código SIGES.
- Catálogo 2026 de docentes y asignaciones.
- Reportes por docente con filtros opcionales.
- PDF en A4 horizontal con texto ajustado.
- `HashRouter` para GitHub Pages.

No contiene `.env` ni el archivo de credenciales privadas. En producción, configura las variables mediante GitHub Actions Secrets.
