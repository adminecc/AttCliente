# API Smoke Tests

Pruebas locales basicas para las Azure Functions sin llamar a servicios externos.

## Ejecutar

Desde `Azure Solution`:

```bash
npm test
```

O directamente:

```bash
python tests/api_smoke_tests.py
```

## Que comprueban

- `crearSolicitud` rechaza payloads incompletos segun el contrato real del prototipo.
- `crearSolicitud` acepta una reclamacion valida y falla de forma controlada si no hay credenciales de Microsoft Graph.
- `generateToken` genera tokens con el prefijo correcto para el tipo real.
- `generateToken` rechaza tipos de formulario invalidos.
- `consultarSolicitud` valida `token` y correo/telefono antes de llamar a Graph.
- `consultarSolicitud` identifica la lista a consultar a partir del prefijo del token.
- `consultarSolicitud` devuelve el contrato que espera el prototipo de consulta (`caseId`, `status`, fechas y adjuntos).
- El parser acepta `multipart/form-data` con campo `payload` y archivos.
- El plan de subida a `DocumentosAdjuntos` usa carpeta por token, `IDRef = item.id` y `Visible = true`.
- La firma de Tarjetas +Metro se conserva como `data:image/...;base64,...`.
- Los diagnosticos de SharePoint incluyen warnings de compatibilidad y detalle util cuando falla la subida documental.

## Logs

Cada ejecucion crea un log en `tests/logs`:

```text
api-smoke-YYYY-MM-DD_HH-mm-ss.log
```

Los logs son utiles para revisar fallos locales, pero no son necesarios para desplegar.
