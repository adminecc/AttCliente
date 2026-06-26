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
- `consultarSolicitud` valida `email` y `token` antes de llamar a Graph.
- `consultarSolicitud` identifica la lista a consultar a partir del prefijo del token.

## Logs

Cada ejecucion crea un log en `tests/logs`:

```text
api-smoke-YYYY-MM-DD_HH-mm-ss.log
```

Los logs son utiles para revisar fallos locales, pero no son necesarios para desplegar.
