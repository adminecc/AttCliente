# Notas de revisión UI con navegador

Fecha: 2026-05-06

## Recorrido verificado

- `/`
- `/nueva-reclamacion`
- `/seguimiento`
- `/seguimiento/OAC-2026-000123`
- `/seguimiento/OAC-2026-000127`
- `/app`
- `/app/casos`
- `/app/casos/nuevo`
- `/app/casos/OAC-2026-000124`
- `/app/casos/OAC-2026-000128`
- `/app/tareas`
- `/app/reporting`
- `/app/auditoria`
- `/app/configuracion`

## Acciones probadas

- Envío de formulario público y generación de `OAC-2026-000127`.
- Navegación desde justificante a seguimiento público.
- Selección de código demo en `/seguimiento`.
- Creación manual de `OAC-2026-000128`.
- Apertura de ficha interna desde el alta manual.
- Acción simulada `Generar propuesta de resolución`.
- Cambio de rol a `Operador OAC` y restricción de configuración.

## Cambios aplicados tras la revisión

- `/` pasa a ser centro interno de demo, no landing pública para usuario final.
- Eliminada imagen pública poco adecuada y CTAs públicos duplicados.
- Eliminados botones sin acción real: colapsar, alertas, usuario, exportar, guardar vista, imprimir, editar y reasignar en tabla.
- Eliminada selección masiva de tabla porque no existen acciones por lote.
- Badges ajustados para evitar saltos de línea en estados y SLA.
- Cabecera pública simplificada en formularios/seguimiento.

## Pendiente recomendable

- Convertir filtros de bandeja y auditoría en filtros funcionales reales.
- Hacer que los tabs visuales de la ficha interna filtren/se desplacen a secciones.
- Añadir feedback funcional a acciones de cierre, subsanación y comunicación si se quiere una demo más interactiva.
- Revisar responsive móvil de tablas con una vista tipo lista si se va a enseñar en pantallas estrechas.
