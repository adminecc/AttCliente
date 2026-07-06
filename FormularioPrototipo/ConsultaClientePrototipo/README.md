# Prototipo de consulta de estado

Pantalla publica para consultar una solicitud ya registrada en SharePoint mediante la Azure Function real.

## Contenido

- `index.html`: estructura de la pantalla de consulta.
- `styles.css`: estilos propios del prototipo.
- `script.js`: cliente JavaScript que llama a la API real.
- `data/`: datos mock antiguos conservados como referencia visual, pero no cargados por la pantalla actual.
- `attachments/`: archivos de ejemplo historicos del mock local.

## API usada

El prototipo llama a:

```text
POST https://metroattfn-e0gucabgedacccey.spaincentral-01.azurewebsites.net/api/solicitudes/consultar
```

Payload:

```json
{
  "token": "SUG-2026-ABCDEFGH",
  "personalData": "correo@example.com"
}
```

`personalData` puede ser el correo electronico o el telefono asociado a la solicitud.

Respuesta esperada:

```json
{
  "encontrado": true,
  "solicitud": {
    "caseId": "SUG-2026-ABCDEFGH",
    "type": "Sugerencias",
    "status": "En tramite",
    "submittedAt": "2026-06-29T08:00:00.000Z",
    "updatedAt": "2026-06-30T09:00:00.000Z",
    "resolutionSummary": "La solicitud esta registrada y pendiente de revision por el area responsable.",
    "nextStep": "Recibira una notificacion cuando se incorpore una respuesta al expediente.",
    "attachments": [
      {
        "name": "documento.pdf",
        "url": "https://...",
        "mimeType": "application/pdf",
        "size": "12 KB"
      }
    ]
  }
}
```

La respuesta tambien mantiene campos heredados (`token`, `estado`, `adjuntos`, `fechaCreacion`) para compatibilidad con posibles consumidores anteriores.

## Flujo

1. El usuario introduce el codigo de solicitud (`XXX-2026-XXXXXXXX`).
2. Introduce correo electronico o telefono.
3. El prototipo envia ambos datos a la API.
4. Si hay coincidencia, muestra estado, fechas, resumen y adjuntos visibles.
5. Si no hay coincidencia o la API devuelve error, muestra un mensaje generico sin exponer datos del expediente.

## Adjuntos

Los adjuntos se devuelven desde la biblioteca documental `DocumentosAdjuntos`, no desde los adjuntos nativos de cada lista.

La Azure Function consulta los documentos vinculados por `IDRef = item.id` y devuelve enlaces `webUrl` o `downloadUrl` para mostrarlos en pantalla.

## CORS

Para usar esta pantalla desde un dominio distinto al de la Function App, Azure debe permitir el origen en:

```text
Function App > API > CORS
```

Durante pruebas locales con Live Server, el origen habitual es:

```text
http://localhost:5500
```
