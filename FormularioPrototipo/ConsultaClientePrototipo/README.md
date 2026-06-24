# Prototipo de consulta de estado de casos

Este prototipo permite consultar el estado de una solicitud, reclamación, sugerencia, agradecimiento, objeto perdido o solicitud de tarjeta +Metro mediante un número de caso y un dato personal de confirmación.

## Estructura

- `index.html`: pantalla publica de consulta.
- `styles.css`: estilos propios del prototipo, alineados con el formulario principal.
- `script.js`: comportamiento de la interfaz, búsqueda y verificación.
- `data/sample-cases.js`: casos ficticios de muestra en un archivo de datos separado.
- `data/demo-credentials.txt`: IDs y datos de confirmación para pruebas.
- `attachments/`: adjuntos ficticios asociados a los casos.

## Como probarlo

Abre directamente `index.html` en el navegador. No hace falta servidor local.

Para probar todos los estados y tipos de solicitud, copia los datos de `data/demo-credentials.txt`.

## Flujo funcional esperado

1. El usuario introduce el ID de solicitud o numero de caso.
2. El sistema busca si existe un expediente con ese identificador.
3. Si existe, se solicita un dato personal de confirmación: email o teléfono usado en la solicitud.
4. Si el dato coincide, se muestra el estado del caso.
5. Si el dato no coincide, se muestra un error y no se expone información del expediente.
6. Si el caso tiene adjuntos, se muestran como enlaces normales.

Los enlaces de adjuntos no usan el atributo `download`. La intención es que el navegador intente abrir el archivo por defecto. Si el navegador o dispositivo no tiene visor para el tipo de archivo, descargará el archivo o mostrará su comportamiento nativo.

## Estados contemplados

- `En trámite`
- `Resuelta aceptada`
- `Resuelta denegada`
- `Resuelta gestionada`

## Tipos de solicitud contemplados

- `Reclamaciones y quejas`
- `Consulta de Información`
- `Sugerencias`
- `Agradecimientos y felicitaciones`
- `Objetos perdidos`
- `Solicitud de tarjeta +Metro`

## Modelo de datos del prototipo

Cada elemento de `data/sample-cases.js` sigue esta forma:

```json
{
  "caseId": "ATT-2026-41001",
  "type": "Reclamaciones y quejas",
  "status": "En trámite",
  "submittedAt": "2026-06-03",
  "updatedAt": "2026-06-18",
  "personalData": {
    "email": "reclamacion.demo@correo.test",
    "phone": "612345001"
  },
  "resolutionSummary": "La reclamación está siendo revisada por el área responsable.",
  "nextStep": "Recibirá una notificación cuando se incorpore una respuesta al expediente.",
  "attachments": [
    {
      "id": "acuse-reclamacion",
      "name": "Acuse de recibo de reclamación",
      "url": "attachments/acuse-reclamacion.txt",
      "mimeType": "text/plain",
      "size": "2 KB"
    }
  ]
}
```

`personalData` se usa solo para simular la verificación en cliente. En producción no debe viajar al navegador.

## Sustitución por API real

El prototipo no incluye mock API. Los siguientes endpoints son una propuesta para la implementación real.

### 1. Buscar expediente

```http
POST /api/public/cases/lookup
Content-Type: application/json
```

Petición:

```json
{
  "caseId": "ATT-2026-41001"
}
```

Respuesta si el caso existe:

```json
{
  "caseId": "ATT-2026-41001",
  "verificationRequired": true
}
```

Respuesta si no existe:

```json
{
  "error": "CASE_NOT_FOUND",
  "message": "No se ha encontrado ninguna solicitud con ese identificador."
}
```

### 2. Verificar dato personal

```http
POST /api/public/cases/ATT-2026-41001/verify
Content-Type: application/json
```

Petición:

```json
{
  "verificationValue": "reclamacion.demo@correo.test"
}
```

Respuesta correcta:

```json
{
  "verified": true,
  "accessToken": "token-temporal-de-consulta"
}
```

Respuesta incorrecta:

```json
{
  "verified": false,
  "error": "VERIFICATION_FAILED",
  "message": "El dato indicado no coincide con la informacion registrada para este caso."
}
```

El token debe ser temporal, de un solo propósito y limitado al caso verificado.

### 3. Obtener estado del expediente

```http
GET /api/public/cases/ATT-2026-41001
Authorization: Bearer token-temporal-de-consulta
```

Respuesta:

```json
{
  "caseId": "ATT-2026-41001",
  "type": "Reclamaciones y quejas",
  "status": "En trámite",
  "submittedAt": "2026-06-03",
  "updatedAt": "2026-06-18",
  "resolutionSummary": "La reclamación está siendo revisada por el área responsable.",
  "nextStep": "Recibirá una notificación cuando se incorpore una respuesta al expediente.",
  "attachments": [
    {
      "id": "acuse-reclamacion",
      "name": "Acuse de recibo de reclamación",
      "mimeType": "text/plain",
      "size": "2 KB",
      "url": "/api/public/cases/ATT-2026-41001/attachments/acuse-reclamacion"
    }
  ]
}
```

La API debe traer solo los adjuntos asociados al número de caso solicitado y ya verificado.

### 4. Abrir adjunto

```http
GET /api/public/cases/ATT-2026-41001/attachments/acuse-reclamacion
Authorization: Bearer token-temporal-de-consulta
```

Respuesta:

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Disposition: inline; filename="acuse-reclamacion.txt"
```

El uso de `Content-Disposition: inline` permite que el navegador intente abrir el archivo. Si no existe visor compatible, el navegador aplicará su comportamiento por defecto, normalmente descargar o preguntar.

## Reglas de seguridad para producción

- No devolver datos personales al navegador despues de la busqueda.
- No indicar si un email o telefono concreto existe en otros expedientes.
- Limitar intentos de verificacion por caso e IP.
- Registrar auditoría de consultas y descargas.
- Usar HTTPS.
- Caducar el token temporal rápidamente.
- Validar que cada descarga pertenece al caso verificado.
- Evitar exponer rutas internas de almacenamiento en las URLs públicas.

## Nota sobre el prototipo sin servidor

Para que el prototipo pueda abrirse con doble clic, los datos de muestra se cargan como un script (`data/sample-cases.js`) en vez de como JSON mediante `fetch`. La API real sustituira ese archivo por las llamadas documentadas arriba.
