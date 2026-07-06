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
│  │  └─ token-generate.js
│  └─ shared/
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
| `POST` | `/api/solicitudes/crear`        | Valida el payload, genera token y crea item en SharePoint. |
| `POST` | `/api/solicitudes/consultar`    | Consulta una solicitud por `token` + correo o telefono.    |
| `POST` | `/api/solicitudes/generartoken` | Genera un token para pruebas.                              |

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

- `SHAREPOINT_CONNECTA_SITE_ID` para `ConectaDEV`.
- `SHAREPOINT_TARJETAS_SITE_ID` para `TarjetaMasMetro`.

No necesitas configurar IDs de lista. La funcion consulta las listas del site y resuelve automaticamente el `listId` por `webUrl`, `displayName` o `name` antes de crear o consultar items.

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
SHAREPOINT_CONNECTA_SITE_ID
SHAREPOINT_CONNECTA_SITE_URL
SHAREPOINT_TARJETAS_SITE_ID
SHAREPOINT_TARJETAS_SITE_URL
FUNCTIONS_WORKER_RUNTIME=node
```

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

- Revisa `SHAREPOINT_CONNECTA_SITE_ID` o `SHAREPOINT_TARJETAS_SITE_ID`.
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
