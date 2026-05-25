# Tests simples de API

Esta carpeta contiene pruebas locales para comprobar respuestas basicas de las Azure Functions sin llamar a servicios externos.

## Como ejecutarlos

Desde `Azure Solution/tests`:

```bash
python api_smoke_tests.py
```

O ejecutando desde `Azure Solution`:

```bash
python tests/api_smoke_tests.py
```

## Que comprueban

- `validateRequest`: acepta una solicitud valida y rechaza una incompleta.
- `generateToken`: genera un token con formato esperado y rechaza `listaDestino` invalida.
- `createSharePointItem`: rechaza `listaDestino` invalida antes de llamar a Microsoft Graph.
- `consultarSolicitud`: valida errores basicos de `email` y `token` antes de llamar a Microsoft Graph.

## Logs

Cada ejecucion crea un archivo en `tests/logs` con fecha y hora:

```text
api-smoke-YYYY-MM-DD_HH-mm-ss.log
```

El log guarda resumen, avisos y detalle de cada prueba.

## Nota

El arnes simula `@azure/functions` para invocar los handlers directamente. Si aparece un aviso, conviene revisarlo aunque las pruebas pasen.
