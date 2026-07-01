Azure Solution >> Azure Functions Node.js v4 para crear/consultar solicitudes y guardar items en SharePoint.
FormularioPrototipo >> HTML/CSS/JS del formulario dinamico prototipo conectado a la API.
FormularioPrototipo/ejemplos_y_campos >> Contrato de campos SharePoint, schemas y ejemplos de payload.
FormularioPrototipo/ConsultaClientePrototipo >> Prototipo de consulta publica de solicitudes.
MockUp_Plataforma_DigOAC >> Mockup de plataforma interna.

Notas actuales:

- El token `XXX-2026-XXXXXXXX` es el identificador principal y se guarda en `Title` / Nº solicitud.
- Los adjuntos de usuario se guardan en la biblioteca `DocumentosAdjuntos`, en una carpeta por token.
- En `DocumentosAdjuntos`, `IDRef` guarda el ID numerico del item origen y `Visible` se marca como `true`.
- La firma de Tarjetas +Metro se guarda como data URL/base64 en la columna `Firma`, no como adjunto.
