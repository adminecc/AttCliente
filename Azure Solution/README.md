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
| `POST` | `/api/solicitudes/consultar`    | Consulta una solicitud por`email` + `token`.               |
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
  nombre = "Maria"
  apellidos = "Lopez Garcia"
  tipoDocumento = "NIF"
  numeroDocumento = "12345678Z"
  email = "maria@example.com"
  confirmEmail = "maria@example.com"
  telefono = "600123456"
  clasificacion = "reclamacion"
  fechaIncidencia = "2026-06-01"
  tipologia = "servicio"
  lugarIncidencia = "estacion"
  descripcionDetallada = "El servicio sufrio una interrupcion prolongada y solicito revision del caso."
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
- Revisa nombres internos de columnas. Al inicio ayuda tener la columna `PayloadJson` para no perder datos.

## Adjuntos

Los adjuntos siguen fuera de alcance por ahora. La recomendacion es anadirlos como segundo flujo:

1. Crear solicitud JSON.
2. Recibir `solicitudId` y `token`.
3. Subir adjuntos a un endpoint separado.
4. Vincularlos al item de SharePoint.
