# Catálogo de Campos y Estructura del Payload Unificado

Este documento detalla la estructura del payload JSON unificado que se envía a la API al enviar cualquiera de los formularios de la plataforma de Atención al Cliente de Metro de Málaga.

## 1. Estructura General del JSON (Payload)

El envío consiste en un único objeto JSON estructurado:

```json
{
  "tipoFormulario": "Código corto del tipo (REC | CON | SUG | AGR | OBJ | TAR)",
  "form": {
    "id": "metro-atencion-cliente-unificado",
    "version": "1.0.0",
    "typeCode": "Código corto del tipo (REC | CON | SUG | AGR | OBJ | TAR)",
    "legacyType": "Identificador en HTML (reclamaciones | consultas | sugerencias | agradecimientos | objetos | tarjetas)"
  },
  "submission": {
    "id": "UUID v4 auto-generado por el cliente",
    "submittedAt": "Timestamp ISO 8601 con zona horaria (YYYY-MM-DDTHH:mm:ssZZ)",
    "source": "wordpress",
    "sourceSite": "https://www.metromalaga.es",
    "language": "es-ES"
  },
  "applicant": {
    "nombre": "Nombre del interesado",
    "apellidos": "Apellidos del interesado",
    "tipoDocumento": "NIF | PAS | NIE",
    "numeroDocumento": "Número de documento validado",
    "email": "Correo electrónico validado",
    "telefono": "Teléfono validado (formato español de 9 dígitos)",
    "nacionalidad": "Código de país ISO 3166-1 alpha-2 (ES, FR, etc.)",
    "direccionContacto": null
  },
  "representative": null,
  "postalReply": {
    "enabled": false,
    "addressMode": "misma | diferente",
    "direccionEnvio": null
  },
  "values": {
    "... Campos específicos del tipo de formulario ..."
  },
  "signatures": [],
  "attachments": [],
  "consents": [
    {
      "id": "consentimiento",
      "accepted": true,
      "acceptedAt": "Timestamp ISO 8601",
      "textVersion": "lopd-general-2026-06"
    }
  ],
  "metadata": {
    "referenceClientSide": null,
    "notes": "Notas del cliente"
  }
}
```

---

## 2. Sección: Datos Comunes del Interesado (`applicant`)

Contiene los datos de la persona física interesada.

*   **`nombre`**: String (Requerido)
*   **`apellidos`**: String (Requerido)
*   **`tipoDocumento`**: String (Requerido) — Valores válidos: `"NIF"`, `"PAS"`, `"NIE"`.
*   **`numeroDocumento`**: String (Requerido) — Validado por DNI/NIE en JS si corresponde.
*   **`email`**: String (Requerido) — Email validado.
*   **`telefono`**: String (Requerido) — Teléfono de 9 dígitos sin espacios.
*   **`nacionalidad`**: String (Requerido) — Código de dos letras ISO (Ej. `"ES"`, `"MA"`, `"GB"`).
*   **`direccionContacto`**: Objeto o `null` (Requerido condicionalmente).
    *   *Comportamiento*: Solo se incluye si el bloque de dirección del interesado está visible en el formulario (por haber marcado la casilla de respuesta postal en no-tarjetas, o siempre en tarjetas). Si no, viaja como `null`.
    *   *Campos internos del objeto*:
        *   `via`: Calle, avenida, etc. (Ej: `"Avenida de Andalucía"`)
        *   `numero`: Número del portal (Ej: `"12"`)
        *   `escalera`: Escalera (String o `null`)
        *   `piso`: Piso (String o `null`, Ej: `"3º"`)
        *   `puerta`: Puerta (String o `null`, Ej: `"B"`)
        *   `codigoPostal`: Código postal de 5 dígitos (Ej: `"29001"`)
        *   `municipio`: Municipio (Ej: `"Málaga"`)
        *   `provincia`: Provincia en minúsculas (Ej: `"malaga"`, `"sevilla"`, `"almeria"`, etc.)

---

## 3. Sección: Datos del Representante (`representative`)

Se utiliza únicamente si la casilla `solicitudRepresentante` está marcada (solo disponible en el formulario de **Tarjeta +Metro**). Si no está disponible o no está marcada, viaja como `null`.

*   *Campos internos del objeto*:
    *   `nombre`: Nombre del representante (Requerido)
    *   `apellidos`: Apellidos del representante (Requerido)
    *   `tipoDocumento`: Tipo de documento (`"NIF" | "PAS" | "NIE"`) (Requerido)
    *   `numeroDocumento`: Número de documento (Requerido)
    *   `email`: Email del representante (Requerido)
    *   `telefono`: Teléfono del representante (Requerido)

---

## 4. Sección: Configuración del Envío Postal (`postalReply`)

Indica si el usuario desea recibir las notificaciones físicas y dónde enviarlas.

*   **`enabled`**: Booleano (Requerido) — `true` si se marca "Deseo recibir respuesta por correo postal".
*   **`addressMode`**: String (Requerido) — `"misma"` (usar dirección de contacto) o `"diferente"` (usar dirección de envío alternativa).
*   **`direccionEnvio`**: Objeto o `null` (Requerido si `addressMode` es `"diferente"`).
    *   *Estructura del objeto*: Idéntica a `direccionContacto` (`via`, `numero`, `escalera`, `piso`, `puerta`, `codigoPostal`, `municipio`, `provincia`).

---

## 5. Sección: Valores Específicos (`values`)

Esta sección varía en función de la clave `tipoFormulario` enviada.

### A. Reclamaciones y Quejas (`tipoFormulario: "REC"`)
*   **`clasificacion`**: `"Reclamacion"` | `"Queja"`
*   **`canalRecepcion`**: `"Web"`
*   **`fechaIncidencia`**: Fecha (YYYY-MM-DD)
*   **`tipologia`**: Área de la queja (`"titulo"`, `"accesibilidad"`, `"informacion"`, `"instalaciones"`, `"personal"`, `"seguridad"`, `"servicio"`, `"limpieza"`, `"otros"`)
*   **`subtipologia`**: Subcategoría correspondiente a la tipología (Ej: `"recarga"`, `"cobro"`, `"ascensor"`, etc.)
*   **`tipoTitulo`**: Tipo de billete si aplica (Ej: `"monedero-metro-malaga"`, `"pago-emv-fisica"`, `"metropay"`, etc.)
*   **`numeroDab`**: Número de validadora/máquina si procede.
*   **`importeReclamado`**: Número decimal o `null` (Ej: `2.70`)
*   **`descripcionCorta`**: Resumen (Máx 100 caracteres)
*   **`descripcionDetallada`**: Explicación completa (Máx 2500 caracteres)

### B. Consulta de Información (`tipoFormulario: "CON"`)
*   **`tipologiaConsulta`**: Tipología de consulta (`"titulo"`, `"accesibilidad"`, `"informacion"`, etc.)
*   **`subtipologiaConsulta`**: Subcategoría (Ej: `"horarios"`, `"app"`)
*   **`tipoTituloConsulta`**: Tipo de título si aplica (Ej: `"monedero-metro-malaga"`, `"pago-emv-movil"`, `"metropay"`)
*   **`numeracionTituloConsulta`**: Número de tarjeta física si aplica o `null`.
*   **`panFisicaPrimeros6Consulta`**: Primeros 6 dígitos de tarjeta de crédito física o `null`.
*   **`panFisicaUltimos4Consulta`**: Últimos 4 dígitos de tarjeta de crédito física o `null`.
*   **`panMovilFisicaAsocPrimeros6Consulta`**: Primeros 6 dígitos de tarjeta física asociada a Google/Apple Pay o `null`.
*   **`panMovilFisicaAsocUltimos4Consulta`**: Últimos 4 dígitos de tarjeta física asociada o `null`.
*   **`panMovilVirtualPrimeros6Consulta`**: Primeros 6 dígitos de tarjeta virtual del móvil o `null`.
*   **`panMovilVirtualUltimos4Consulta`**: Últimos 4 dígitos de tarjeta virtual del móvil o `null`.
*   **`descripcionCortaConsulta`**: Resumen.
*   **`descripcionDetalladaConsulta`**: Consulta extendida.

### C. Sugerencias (`tipoFormulario: "SUG"`)
*   **`areaSugerencia`**: Área de mejora (`"accesibilidad"`, `"frecuencia"`, `"horarios"`, `"instalaciones"`, `"seguridad"`, `"tecnologia"`, `"otros"`)
*   **`lugarSugerencia`**: Estación o lugar (`"guadalmedina-l1"`, `"tren"`, `"otro"`, etc.)
*   **`trenSugerencia`**: Código del tren si aplica (Ej: `"UT-3010"`) o `null`.
*   **`otroLugarSugerencia`**: Texto libre si se seleccionó `"otro"` o `null`.
*   **`descripcionSugerencia`**: Explicación de la idea.

### D. Agradecimientos y Felicitaciones (`tipoFormulario: "AGR"`)
*   **`motivoAgradecimiento`**: Motivo (`"atencion-personal"`, `"resolucion-incidencia"`, `"recuperar-objeto"`, etc.)
*   **`fechaAgradecimiento`**: Fecha en que sucedió (YYYY-MM-DD) o `null`.
*   **`lugarAgradecimiento`**: `"estacion"`, `"tren"`, `"oac"` o `null`.
*   **`estacionAgradecimientoDetalle`**: Estación concreta si aplica o `null`.
*   **`trenAgradecimiento`**: Código de tren si aplica o `null`.
*   **`dirigidoAgradecimiento`**: Destinatario (`"personal-metro"`, `"seguridad"`, `"personal-oac"`, `"varios"`, `"general"`)
*   **`variosColectivos`**: Especificación de colectivos si aplica o `null`.
*   **`nombreEmpleado`**: Nombre o número de placa del personal si se conoce o `null`.
*   **`descripcionAgradecimiento`**: Mensaje de felicitación.

### E. Objetos Perdidos (`tipoFormulario: "OBJ"`)
*   **`tipoTituloObjetos`**: Tipo de título si procede (`"monedero-metro-malaga"`, `"metropay"`, etc.) o `null`.
*   **`numeracionTituloViajeObjetos`**: Número de tarjeta si aplica o `null`.
*   **`panTarjetaPrimeros6Objetos`**: Primeros 6 dígitos de tarjeta si aplica o `null`.
*   **`panTarjetaUltimos4Objetos`**: Últimos 4 dígitos de tarjeta si aplica o `null`.
*   **`fechaPerdida`**: Fecha del extravío (YYYY-MM-DD)
*   **`horaPerdida`**: Hora estimada (HH:MM) o `null`.
*   **`lineaMetroObjetos`**: `"1"`, `"2"` o `"ambas"`.
*   **`dondePerdidoObjetos`**: Lugar probable (`"estacion"`, `"tren"`, `"desconocido"`).
*   **`numeroTrenObjetos`**: Código del tren en el que se perdió (Ej: `"UT-3010"`) o `null`.
*   **`estacionPerdidaObjetos`**: Estación si se seleccionó `"estacion"` o `null`.
*   **`estacionOrigenObjetos`**: Estación de origen del viaje si aplica o `null`.
*   **`estacionDestinoObjetos`**: Estación de destino del viaje si aplica o `null`.
*   **`nombreObjetoObjetos`**: Tipo de objeto (Ej: `"Mochila"`)
*   **`colorObjetoObjetos`**: Color principal (Ej: `"Negro"`) o `null`.
*   **`distintivoObjetoObjetos`**: Rasgo particular (Ej: `"Llavero de oso"`) o `null`.
*   **`descripcionObjeto`**: Descripción detallada del objeto y contenido.

### F. Tarjetas +Metro (`tipoFormulario: "TAR"`)
*   **`motivoTarjeta`**: `"nueva"`, `"renovacion"`, `"duplicado"`, `"deterioro"`, `"modificacion"`
*   **`fechaNacimiento`**: Fecha (YYYY-MM-DD)
*   **`genero`**: `"H"` (Hombre) | `"M"` (Mujer) | `"O"` (Otro) | `null`
*   **`fechaCitaTarjeta`**: Fecha concertada (YYYY-MM-DD)
*   **`horaCitaTarjeta`**: Hora de la cita (HH:MM)
*   **`medioNotificacionTarjeta`**: `"email"` | `"impreso"`

---

## 6. Sección: Adjuntos (`attachments`)

Listado de ficheros que se envían por `multipart/form-data`.
*   *Campos de cada objeto*:
    *   `fieldId`: ID del input file (Ej: `"fotoObjeto"` o `"adjuntos"`).
    *   `fileName`: Nombre original del archivo (Ej: `"foto.jpg"`).
    *   `contentType`: Tipo MIME (Ej: `"image/jpeg"`).
    *   `sizeBytes`: Tamaño numérico en bytes.
    *   `storageMode`: Siempre `"multipart"`.
    *   `multipartFieldName`: Nombre del campo en el cuerpo del multipart HTTP. Formato sugerido: `file_[fieldId]_[index]`.
    *   `sha256`: Hash del archivo (opcional o vacío para verificar integridad en destino).

---

## 7. Sección: Firmas (`signatures`)

Listado de firmas manuscritas digitalizadas. Al igual que los adjuntos, viajan por `multipart/form-data`.
*   *Campos de cada objeto*:
    *   `fieldId`: ID del campo (siempre `"signature-data"`).
    *   `contentType`: `"image/png"`.
    *   `storageMode`: `"multipart"`.
    *   `multipartFieldName`: Nombre del campo en el cuerpo del multipart HTTP (Ej: `"signature_interesado_0"`).

---

## 8. Sección: Consentimientos (`consents`)

Listado de consentimientos legales aceptados obligatoriamente.
*   *Consentimiento LOPD General (Siempre requerido)*:
    *   `id`: `"consentimiento"`
    *   `accepted`: `true`
    *   `textVersion`: `"lopd-general-2026-06"`
*   *Confirmación de Veracidad (Solo requerido en Tarjeta +Metro)*:
    *   `id`: `"datosCorrectos"`
    *   `accepted`: `true`
    *   `textVersion`: `"declaracion-veracidad-2026-06"`
