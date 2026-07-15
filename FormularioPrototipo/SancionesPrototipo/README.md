# Prototipo de consulta de sanciones

Prototipo estático, sin conexión a servicios externos, para consultar una sanción introduciendo expediente y DNI. Incluye tres expedientes ficticios para probar los estados de pago, el mapeo de estaciones y la visualización opcional del tutor.

## Cómo probarlo

Desde esta carpeta:

```powershell
python -m http.server 5500
```

Abre `http://localhost:5500/` y usa cualquiera de estas combinaciones de `data/demo-credentials.txt`.

No hay build ni dependencias npm. También se puede abrir `index.html` directamente, aunque un servidor local se parece más al despliegue final.

## Qué muestra

Cuando la combinación coincide, la pantalla muestra, en bloques compactos:

1. El expediente (`Title`).
2. Nombre y DNI; si existen, nombre y DNI del tutor.
3. Tipo de sanción (`TipoSolicitud`), tipo de infracción (`TipoInfraccion`) y número de notificación (`CodSancion`).
4. Motivo (`MotivoSancion`), fecha (`Fecha`) y lugar (`OrigenFraude`).
5. Importe (`Importe`), estado del pago (`EstadoDelPago`) y `Pagar` solo para estados pendientes o equivalentes.

El mapeo de `OrigenFraude` está en `script.js`. Por ejemplo, `ATZ` se muestra como `Atarazanas`; si llega un código no conocido, se muestra su valor original hasta completar el catálogo.

## Contrato previsto para la API

La pantalla ya separa la consulta de la interfaz en `consult(payload)`. Mientras `API_CONFIG.endpoint` esté vacío usa `data/sample-sanctions.js`. Para conectarla, basta con configurar el endpoint en `script.js`:

```js
const API_CONFIG = {
  endpoint: 'https://<function-app>/api/sanciones/consultar'
};
```

La petición prevista es:

```http
POST /api/sanciones/consultar
Content-Type: application/json
```

```json
{
  "Title": "SAN-2026-000001",
  "DNI": "12345678Z"
}
```

`Title` se usa como expediente porque es la columna estándar de SharePoint. `DNI` es el nombre interno previsto para el documento de identidad de la persona sancionada.

La respuesta prevista puede ser directamente el elemento o envolverlo así:

```json
{
  "encontrado": true,
  "sancion": {
    "Title": "SAN-2026-000001",
    "Nombre": "Lucía García López",
    "DNI": "12345678Z",
    "NombreTutor": "",
    "DNITutor": "",
    "TipoSolicitud": "Sanción",
    "TipoInfraccion": "Viajar sin título válido",
    "CodSancion": "NOT-2026-0001",
    "MotivoSancion": "Acceso a la red sin acreditar un título de transporte válido.",
    "Fecha": "2026-06-03",
    "OrigenFraude": "ATZ",
    "Importe": 50,
    "EstadoDelPago": "Pendiente"
  }
}
```

La interfaz consume los nombres estáticos del payload y no nombres de presentación. Si la extracción de la lista confirma otro nombre interno para los cuatro campos personales (`Nombre`, `DNI`, `NombreTutor`, `DNITutor`), se cambia el contrato mock y las líneas de renderizado de `script.js`; el resto del flujo no cambia.

## Mapeo de campos SharePoint

| Uso en pantalla | StaticName | Title en SharePoint |
| --- | --- | --- |
| Expediente | `Title` | Título |
| Nombre | `Nombre` | Nombre |
| DNI | `DNI` | DNI |
| Nombre del tutor | `NombreTutor` | Nombre del tutor |
| DNI del tutor | `DNITutor` | DNI del tutor |
| Tipo de sanción | `TipoSolicitud` | Tipo de Solicitud |
| Tipo de infracción | `TipoInfraccion` | Tipo de Registro |
| Nº Notificación | `CodSancion` | Nº Notificación |
| Motivo | `MotivoSancion` | Motivo Sanción |
| Fecha | `Fecha` | Fecha |
| Lugar | `OrigenFraude` | Origen del fraude |
| Importe | `Importe` | Importe |
| Estado del pago | `EstadoDelPago` | Estado del pago |

## Pago

El botón `Pagar` solo aparece si `EstadoDelPago` contiene un estado pendiente, impagado o parcialmente pagado. En este prototipo no navega a una pasarela real. Cuando exista el endpoint de pago, la API podrá devolver una URL de pago (por ejemplo, `paymentUrl`) y el botón deberá usarla tras validar el expediente en backend.

La decisión de mostrar u ocultar el botón es solo visual. La API de pago deberá volver a comprobar expediente, identidad, importe y estado antes de crear una operación.

## Próximo paso de integración

1. Confirmar en la extracción de SharePoint los StaticName de `Nombre`, `DNI`, `NombreTutor` y `DNITutor`.
2. Implementar `POST /api/sanciones/consultar`, filtrando por `Title` y `DNI` en SharePoint y devolviendo únicamente los campos de la tabla.
3. Configurar `API_CONFIG.endpoint` y probar la respuesta real conservando los nombres estáticos.
4. Añadir la URL de la pasarela al contrato solo cuando exista el flujo de pago.
