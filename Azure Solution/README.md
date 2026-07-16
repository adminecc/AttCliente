# Azure Solution - Atencion al Cliente Metro Malaga

Azure Functions Node.js v4 para recibir solicitudes del formulario prototipo, validarlas, generar un token y crear un item en la lista de SharePoint correspondiente.

## Estructura

```text
Azure Solution/
├─ host.json
├─ local.settings.template.json
├─ metro-form-schema.json
├─ package.json
├─ package-lock.json
├─ README.md
├─ src/
│  ├─ functions/
│  │  ├─ solicitudes-create.js
│  │  ├─ solicitudes-consultar.js
│  │  ├─ token-generate.js
│  │  ├─ access-token-generate.js
│  │  └─ access-token-cleanup.js
│  └─ shared/
│     ├─ access-token.js
│     ├─ config.js
│     ├─ form-contract.js
│     ├─ sharepoint.js
│     ├─ token.js
│     └─ validation.js
└─ tests/
   ├─ api_harness.js
   └─ api_smoke_tests.py
```

## Endpoints


| Metodo | Ruta                            | Uso                                                        |
| ------ | ------------------------------- | ---------------------------------------------------------- |
| `POST` | `/api/solicitudes/crear`        | Valida el payload, genera token de solicitud y crea item en SharePoint. |
| `POST` | `/api/solicitudes/consultar`    | Consulta una solicitud por `token` + correo o telefono.              |
| `POST` | `/api/sanciones/consultar`      | Consulta una sancion por expediente (`Title`) + DNI.                  |
| `POST` | `/api/solicitudes/generartoken` | Genera un token de solicitud para pruebas.                            |
| `GET/POST` | `/api/seguridad/token`      | Genera un GUID temporal de acceso, valido por defecto 15 minutos.     |

## Mapeo Real De SharePoint


| tipoFormulario    | Site                                                       | Lista                    |
| ----------------- | ---------------------------------------------------------- | ------------------------ |
| `reclamaciones`   | `https://metromalaga.sharepoint.com/sites/ConectaDEV`      | `ReclamacionesQuejas`    |
| `sugerencias`     | `https://metromalaga.sharepoint.com/sites/ConectaDEV`      | `Sugerencias`            |
| `agradecimientos` | `https://metromalaga.sharepoint.com/sites/ConectaDEV`      | `Agradecimientos`        |
| `objetos`         | `https://metromalaga.sharepoint.com/sites/ConectaDEV`      | `Objetos Perdidos NUEVA` |
| `consultas`       | `https://metromalaga.sharepoint.com/sites/ConectaDEV`      | `ConsultaInformacion`    |
| `tarjetas`        | `https://metromalaga.sharepoint.com/sites/TarjetaMasMetro` | `ClientesTarjetaMetro`   |

El mapeo vive en `src/shared/form-contract.js`. Las llamadas a Graph resuelven el `siteId` con:

- `SHAREPOINT_ATTCLIENTE_SITE_ID` para el site de Atención al Cliente (`ConectaDEV`).
- `SHAREPOINT_TARJETAS_SITE_ID` para `TarjetaMasMetro`.
- `SHAREPOINT_SANCIONES_SITE_ID` para la lista `Sanciones` de `ConectaDEV`.

No necesitas configurar IDs de lista. La funcion consulta las listas del site y resuelve automaticamente el `listId` por `webUrl`, `displayName` o `name` antes de crear o consultar items.

### Consulta de sanciones

`POST /api/sanciones/consultar` recibe los nombres internos de SharePoint:

```json
{
  "Title": "SAN-2026-000001",
  "DNI": "12345678Z"
}
```

La función filtra la lista `Sanciones` por `fields/Title` y `fields/DNI` y devuelve únicamente el contrato de la pantalla. La fecha es `FechaInfraccion`; `Created` y `Modified` no se usan:

```json
{
  "encontrado": true,
  "sancion": {
    "Title": "SAN-2026-000001",
    "NombreCliente": "Lucía García López",
    "DNI": "12345678Z",
    "NombreTutor": "",
    "DNITutor": "",
    "TipoSolicitud": "Sanción",
    "TipoInfraccion": "Viajar sin título válido",
    "CodSancion": "NOT-2026-0001",
    "MotivoSancion": "Acceso a la red sin acreditar un título de transporte válido.",
    "FechaInfraccion": "2026-06-03T18:42:00+02:00",
    "OrigenFraude": "ATZ",
    "Importe": 50,
    "EstadoDelPago": "Pendiente"
  }
}
```

## Variables De Entorno

Copia la plantilla:

```powershell
Copy-Item local.settings.template.json local.settings.json
```

Rellena estas claves en `local.settings.json` para pruebas locales y en Azure App Settings para nube:

```text
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
SHAREPOINT_ATTCLIENTE_SITE_ID
SHAREPOINT_ATTCLIENTE_SITE_URL
SHAREPOINT_TARJETAS_SITE_ID
SHAREPOINT_TARJETAS_SITE_URL
SHAREPOINT_SANCIONES_SITE_ID
SHAREPOINT_SANCIONES_SITE_URL
FUNCTIONS_WORKER_RUNTIME=node
```

Las funciones leen el `siteId` y la URL de cada site desde la variable correspondiente; no es necesario duplicar estos valores en el código. `ConectaDEV` se usa para Atención al Cliente y, actualmente, también para Sanciones.

### Token temporal de acceso

Se ha anadido un endpoint independiente para emitir tokens temporales de acceso:

```http
GET /api/seguridad/token
POST /api/seguridad/token
```

Este token es distinto del token de solicitud `REC-2026-...`, `OBJ-2026-...`, etc. El token temporal es un GUID y se guarda en Azure Table Storage durante el tiempo configurado. Por defecto caduca a los 15 minutos.

Variables nuevas:

```text
ACCESS_TOKEN_STORAGE_CONNECTION_STRING  # normalmente igual que AzureWebJobsStorage
ACCESS_TOKEN_TABLE_NAME=FunctionAccessTokens
ACCESS_TOKEN_TTL_MINUTES=15
ACCESS_TOKEN_ALLOWED_ORIGINS=https://www.tuweb-autorizada.es
ACCESS_TOKEN_ALLOWED_IPS=  # opcional; dejar vacio para no restringir por IP
ACCESS_TOKEN_REQUIRED=false
ACCESS_TOKEN_SINGLE_USE=false
```

- `ACCESS_TOKEN_ALLOWED_ORIGINS`: webs autorizadas, separadas por coma o punto y coma. Ejemplo: `https://formularios.metromalaga.es`.
- `ACCESS_TOKEN_ALLOWED_IPS`: opcional; IPs publicas autorizadas, separadas por coma o punto y coma. Si se deja vacia, no se aplica una lista de IPs permitidas.
- Si informas origins e IPs, deben cumplirse ambas condiciones.
- `ACCESS_TOKEN_REQUIRED=true` activa la validacion de este token en `POST /api/solicitudes/crear`.
- `ACCESS_TOKEN_SINGLE_USE=true` hace que cada token solo pueda usarse una vez.

Ejemplo de obtencion del token temporal:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:7071/api/seguridad/token" `
  -ContentType "application/json" `
  -Headers @{ Origin = "https://formularios.metromalaga.es" } `
  -Body '{"purpose":"reclamaciones"}'
```

Respuesta:

```json
{
  "ok": true,
  "token": "f2fd49de-9c8d-4a7a-ae21-fc90e6f51d1b",
  "tokenType": "Bearer",
  "expiresInMinutes": 15,
  "expiresAtUtc": "2026-07-07T14:45:00.000Z"
}
```

Para enviar una solicitud con validacion activa, manda el token en una de estas dos formas:

```http
Authorization: Bearer f2fd49de-9c8d-4a7a-ae21-fc90e6f51d1b
```

o bien:

```http
x-mm-access-token: f2fd49de-9c8d-4a7a-ae21-fc90e6f51d1b
```

Una funcion Timer `cleanupAccessTokens` limpia tokens caducados cada 30 minutos.

Las URLs ya estan en la plantilla. Lo que tienes que obtener son los dos site IDs.

Si en el futuro se prefiere autenticacion con certificado, puedes usar `AZURE_CERT_THUMBPRINT` + `AZURE_CERT_PRIVATE_KEY` en lugar de `AZURE_CLIENT_SECRET`. Con la configuracion actual recomendada, no necesitas esas dos variables de certificado.

## Obtener Site IDs

Puedes usar Graph Explorer, Postman o una llamada autenticada a Microsoft Graph.

ConectaDEV:

```http
GET https://graph.microsoft.com/v1.0/sites/metromalaga.sharepoint.com:/sites/ConectaDEV
```

TarjetaMasMetro:

```http
GET https://graph.microsoft.com/v1.0/sites/metromalaga.sharepoint.com:/sites/TarjetaMasMetro
```

En cada respuesta copia el campo `id`, con formato parecido a:

```text
metromalaga.sharepoint.com,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

## Permisos De La App Registration

La App Registration usada por `AZURE_CLIENT_ID` debe poder escribir en SharePoint mediante Microsoft Graph.

Para pruebas rapidas:

- Microsoft Graph > Application permissions > `Sites.ReadWrite.All`
- Conceder admin consent

Para un modelo mas restringido despues:

- `Sites.Selected`
- Conceder permisos solo a `ConectaDEV` y `TarjetaMasMetro`

## Pruebas Locales

Instalar dependencias:

```powershell
npm install
```

Pruebas de humo:

```powershell
npm test
```

Arrancar local:

```powershell
npm start
```

Probar token:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:7071/api/solicitudes/generartoken" `
  -ContentType "application/json" `
  -Body '{"tipoFormulario":"reclamaciones"}'
```

Probar creacion:

```powershell
$body = @{
  tipoFormulario = "reclamaciones"
  Nombre = "Maria"
  Apellidos = "Lopez Garcia"
  TipoDeDocumento = "NIF"
  NumeroDeDocumento = "12345678Z"
  CorreoElectronico = "maria@example.com"
  confirmEmail = "maria@example.com"
  Telefono = "600123456"
  Clasificacion = "reclamacion"
  FechaYHoraConsulta = "2026-06-01T10:00:00"
  Lugar = "estacion"
  DescripcionConsulta = "El servicio sufrio una interrupcion prolongada y solicito revision del caso."
  consentimiento = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:7071/api/solicitudes/crear" `
  -ContentType "application/json" `
  -Body $body
```

Respuesta esperada si SharePoint y permisos estan bien:

```json
{
  "ok": true,
  "solicitudId": "123",
  "token": "REC-2026-ABCDEFGH",
  "tipoFormulario": "reclamaciones",
  "listaDestino": "RECLAMACIONES",
  "nombreLista": "ReclamacionesQuejas",
  "siteDestino": "https://metromalaga.sharepoint.com/sites/ConectaDEV"
}
```

Probar consulta:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:7071/api/solicitudes/consultar" `
  -ContentType "application/json" `
  -Body '{"token":"SUG-2026-ABCDEFGH","personalData":"maria@example.com"}'
```

`personalData` puede ser el correo electronico o el telefono asociado a la solicitud. Tambien se aceptan `email` o `telefono` como campos explicitos. El prototipo actual envia `personalData` y, ademas, el campo explicito correspondiente para mantener compatibilidad:

```json
{
  "token": "SUG-2026-ABCDEFGH",
  "personalData": "maria@example.com",
  "email": "maria@example.com"
}
```

Respuesta esperada si existe coincidencia:

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
    "attachments": []
  }
}
```

## Despliegue En Azure

Antes de publicar, crea las mismas variables en:

```text
Function App > Settings > Environment variables / Configuration > Application settings
```

Despues, desde esta carpeta:

```powershell
func azure functionapp publish metroattFn
```

Probar en nube:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://metroattfn-e0gucabgedacccey.spaincentral-01.azurewebsites.net/api/solicitudes/generartoken" `
  -ContentType "application/json"`
  -Body '{"tipoFormulario":"reclamaciones"}'
```

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://metroattfn-e0gucabgedacccey.spaincentral-01.azurewebsites.net/api/solicitudes/crear" `
  -ContentType "application/json" `
  -Body $body
```

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://metroattfn-e0gucabgedacccey.spaincentral-01.azurewebsites.net/api/solicitudes/consultar" `
  -ContentType "application/json" `
  -Body '{"token":"SUG-2026-ABCDEFGH","personalData":"maria@example.com"}'
```

Para usar el prototipo de consulta desde navegador, revisa CORS en la Function App:

```text
Function App > API > CORS
```

Durante pruebas con Live Server debe estar permitido `http://localhost:5500`. En produccion se anadira el dominio final del formulario.

## Si Falla

`Error de autenticacion con Microsoft Graph`:

- Revisa `AZURE_TENANT_ID`.
- Revisa `AZURE_CLIENT_ID`.
- Revisa `AZURE_CLIENT_SECRET`.
- Revisa que el client secret no este caducado.
- Si usas certificado en vez de client secret, revisa `AZURE_CERT_THUMBPRINT` y `AZURE_CERT_PRIVATE_KEY`.

`Error al registrar la solicitud en SharePoint`:

- Revisa `SHAREPOINT_ATTCLIENTE_SITE_ID` o `SHAREPOINT_TARJETAS_SITE_ID`.
- Revisa permisos Graph y admin consent.
- Revisa que la lista existe y que su URL coincide con el mapeo de `src/shared/form-contract.js`.
- Revisa nombres internos de columnas con `FormularioPrototipo/ejemplos_y_campos/sharepoint_list_fields.csv`.
- Para el contrato funcional de las listas cerradas usa `FormularioPrototipo/ejemplos_y_campos/sharepoint_list_fields_reducido.csv`.
- Para saber que columnas no deben eliminarse porque las usa formulario/API, usa `FormularioPrototipo/ejemplos_y_campos/sharepoint_list_fields_utilizados.csv`.
- Estos CSV se generan localmente con `FormularioPrototipo/ejemplos_y_campos/export_sharepoint_list_fields.py` y no se versionan en Git.

## Adjuntos

La API acepta dos formatos en `POST /api/solicitudes/crear`:

1. `application/json`, sin archivos.
2. `multipart/form-data`, con un campo `payload` que contiene el JSON de la solicitud y uno o varios campos de archivo.

El prototipo usa `multipart/form-data` automaticamente cuando hay documentacion adjunta o fotografias. Si no hay archivos reales, mantiene el envio JSON.

En el formulario prototipo, los campos de reclamaciones/quejas (`adjuntos`) y objetos perdidos (`fotoObjeto`) admiten seleccion multiple y arrastrar archivos directamente sobre el area de subida. Los archivos seleccionados se muestran antes del envio y pueden eliminarse individualmente.

La firma de Tarjetas +Metro no se sube como adjunto nativo. Se guarda en la columna `Firma` como texto `data:image/png;base64,...`, igual que en los ejemplos reales de la lista.

Ejemplo conceptual:

```text
payload: {"tipoFormulario":"tarjetas","NombreCliente":"...","Firma":"data:image/png;base64,...",...}
file_adjuntos_0: documento.pdf
file_adjuntos_1: captura.png
file_fotoObjeto_0: objeto.jpg
file_fotoObjeto_1: etiqueta.png
```

Despues de crear el item, la Function sube los archivos a la biblioteca documental `DocumentosAdjuntos` del sitio `ConectaDEV`:

```text
DocumentosAdjuntos/
  REC-2026-ABCDEFGH/
    documento.pdf
  OBJ-2026-ABCDEFGH/
    objeto.jpg
```

La carpeta usa el token de solicitud (`Title`). Cada archivo conserva su nombre original saneado para SharePoint y se etiqueta con:

- `IDRef`: ID numerico del item creado en la lista origen, por ejemplo `8014`.
- `Visible`: `true`.

La lectura de adjuntos debe hacerse sobre `DocumentosAdjuntos`, filtrando por `IDRef = item.id`. No se usan los adjuntos nativos de las listas (`AttachmentFiles`) ni `driveItem` sobre items de listas normales.

Si la solicitud se crea pero falla algun adjunto, la respuesta sigue siendo `201` e incluye `warnings`. Asi no se pierde una solicitud valida por un problema documental.

Permiso necesario: Microsoft Graph debe poder escribir en el sitio `ConectaDEV` y en la biblioteca `DocumentosAdjuntos`. La app actual usa permisos de aplicacion Graph para crear items/listas y subir contenido a la biblioteca.

Nota tecnica:

- Se descarto `AttachmentFiles/add` sobre la lista porque SharePoint REST devuelve `401 Unsupported app only token` con esta app-only.
- Graph no permite `driveItem` en listas normales, solo en bibliotecas documentales.
- En listas grandes como `Objetos Perdidos NUEVA`, la consulta por token/email se tratara en la siguiente iteracion de `GET /api/solicitudes/consultar`. Para solicitudes con adjuntos, la biblioteca documental permite recuperar el item origen mediante `IDRef`.

*** GENERADO NUEVO CERTIFICADO PARA USO EN SHAREPOINT LIST ITEMS ATTACHMENTS ***

THUMBPRINT  : BD095C5BC17ADD6AB69C27170B267B5660A65986

private - key :
Bag Attributes
    localKeyID: 01 00 00 00 
    friendlyName: te-c2009fe4-a4dc-49d2-b1e7-4af3348af4fe
    Microsoft CSP Name: Microsoft Base Cryptographic Provider v1.0
Key Attributes
    X509v3 Key Usage: 80 
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCk1Qrd3pPX2ecD
GK9Ex2+TcMRF2tJGJxOBw9qS720rvzsQgkEkfaHIfbimKZamyCRVsV78dyLOc7Lj
v5mZivVdFD7acykjTuQMnE7xymsx/JAxsMh0XX3WNt9CoiyhwQhxDwavGIx6PwvA
1zRZzC6RZO+gxGHGe6R0toFCLY8o0KBP5wIvU1ajHkSDyr4S6gjePBTPTPCEabpo
T7ckHjaRL7+pBkmDWn6VO5yimn4n+Nm798IxUL3qynotMYBXvbeYI90PTH1+Z+VS
Ute78bJEHdJpAS0msNjefoVnPIjQ8ayMXmf+jpnS2gG64zD3dHnUr39U0MMOioWA
KS1C/nKZAgMBAAECggEBAJQjtER7Cbxw5iHuSXczFqAYNQ3jACB0dh+l+gccj61F
jLvllM5K6t/Zvd34eqEiNyWc55VXLT0G1rvBMza/oI0q6OJDpbFJ8cMzp+++0GB4
cM935nBOpg2j+ztTrXEin4eczZEIKxijGNkTkMUzsJaTdJm0ZXuRG9iZPcpQT92J
UWmNAyCK+z+xOndDVRNiWlD4aRYImkeOmR9RmeCZs5HJQxxWBV+6JwMBUQC2405O
+rbwd5p5+tnjBgf5wmjh258Dt0BDKvxU+MyBff7jNc6DyEfGO7eOC0WTOARVEMec
NaUmDBBd21XTRpPUkDB+UkdGJeoJqvdg7eG6muQm79ECgYEAx8mv9AyWFfLGXGJS
XkpHSvp2uyA8fm0bBAxnfc+xrBKvb8T4J4faJevyUmhyLZdaum3o3KolUtc1dKsF
QS27UfPPC5n6u+lR7sztn6U0V6xWUQc9Bwb9TwIxa+xblOVlEHjZP68RIXZdbcru
i4U4F6rVktSKNNrRJkopmNRm4oMCgYEA0zWSL8CW6zXp0CMCe3eEloys8x3jia6t
pqtG6sFuqUkxqBjvyaykq39nR5xMbJFNmyZwv3nYcwoiOeCuR3Z8j+J4OO+vRofb
DmtpYXbkn92/pwXxZ8NpduUNdkkDP9bWxTRGjCCBpNoVtOvbPwHCQaDjIgeoU5vU
DZMullUY27MCgYBeV1P6F1NsC9c1Wsxwb/zYYAte86r9PEIsmDrqgv/wNGaZjdZs
vE775z3nQiDgfH9AV5RFVycGxk8cx4FUtOamnU2gudZXk6a38BcpctaTq/KakqNz
xQ4ql+uEffkFB4nAzIAx/VZGieE2bkRUp9TEAEyX6DtXGBj5Tr3zyCDJRwKBgA1w
WS7kqDWrJodx0tScVDloFhEaE8JM9Qun1klVqX7oA1rYy1kfvRKUdrPdxBccX73B
gmcMj7MyL99S5oPxjBdzp4an6ZUpS8ztFLV45S8u4uTzwdqCWpGQHX0rRCOpvdyq
aNq9rsIYhk0OvNKTgBLA8/LUXeeEAMgkV1CFdaF1AoGAGg6ysrL0y0QKSqCo2Nbt
YFGSz9PTf+dzRkinOnGbYoFIH3WtodGbExMkKQki3fgFIWX+uiJqLpztQ6oue+lB
G5oOCNJzTnIs2EE2tP9f7pNFFO3BjjeTJAvfL5f8i/WsDTO/k9NPJ5bgI71ULPQY
bmmQBliZgyM8CXoWsiNFihk=
-----END PRIVATE KEY-----




