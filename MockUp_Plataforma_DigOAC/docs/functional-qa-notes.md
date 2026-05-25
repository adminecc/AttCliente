# QA funcional con navegador

Fecha: 2026-05-06

## Comentario visual resuelto

- El selector decorativo `AA / ES` marcado en la captura ya no aparece en la versión actual.
- `/` ya no es una landing pública; ahora es un centro interno de demo.

## Flujos probados y correctos

- `/`: centro interno de demo carga y enlaza a dashboard, bandeja, ficha crítica, alta manual, reporting, auditoría, configuración y seguimiento público simulado.
- `/nueva-reclamacion`: el formulario carga, no muestra `AA / ES`, permite enviar y genera `OAC-2026-000127`.
- Justificante público: el enlace `Consultar seguimiento` abre `/seguimiento/OAC-2026-000127`.
- `/seguimiento`: los botones de código demo rellenan el caso y `Consultar` navega al seguimiento correcto.
- `/app/casos/nuevo`: el canal cambia el formulario:
  - `Papel` muestra digitalización/escaneo.
  - `Email` muestra importación y botón `Sugerir campos`.
  - `Teléfono` muestra datos de llamada y transcripción.
- Alta manual: crea `OAC-2026-000128` y permite abrir su ficha interna.
- `/app/configuracion`: con `Administrador` se ven tabs y el tab `Usuarios` cambia contenido.
- Roles:
  - `Operador OAC` no puede ver configuración.
  - `Auditor/Consulta` no puede ver configuración.
  - `Responsable interno` no ve configuración en navegación y en `/app/tareas` queda limitado a Infraestructura.
- Ficha interna:
  - Acciones muestran feedback.
  - `Auditor/Consulta` tiene acciones deshabilitadas.
  - `Responsable interno` puede generar propuesta de resolución y no puede asignar departamento.
- `/app/reporting`: carga métricas y gráficos simulados.

## Problemas detectados

- Los filtros de `/app/casos` existen visualmente, pero no filtran la tabla.
- La búsqueda `OAC-2026-` de `/app/casos` tampoco filtra.
- Los filtros de `/app/auditoria` existen visualmente, pero no filtran la tabla.
- El filtro de tipo de evento en auditoría está incompleto: los datos contienen eventos como `SLA`, `Canal email`, `Documento` y `Notificación`, pero el selector no los ofrece todos.
- Las acciones de ficha cambian feedback visual, pero no modifican estado, responsable, timeline ni auditoría.
- Los tabs visuales de ficha interna no navegan ni filtran secciones.

## Recomendación para el siguiente paso

- Implementar filtros funcionales en bandeja y auditoría.
- Hacer funcionales los tabs de ficha interna.
- Convertir acciones críticas en mutaciones simuladas de estado local.
- Añadir feedback consistente a filtros vacíos y resultados filtrados.
- Revisar si las rutas públicas `/nueva-reclamacion` y `/seguimiento` se quedan sólo como flujos simulados accesibles desde el centro interno, no como navegación principal de producto final.
