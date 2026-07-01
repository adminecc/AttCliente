# Prototipo de consulta de estado de casos

Este prototipo permite consultar el estado de una solicitud, reclamación, sugerencia, agradecimiento, objeto perdido o solicitud de tarjeta +Metro mediante un número de caso y un dato personal de confirmación.

## Estructura

- `index.html`: pantalla pública de consulta.
- `styles.css`: estilos propios del prototipo, alineados con el formulario principal.
- `script.js`: comportamiento de la interfaz, búsqueda y verificación.
- `data/sample-cases.js`: casos ficticios de muestra en un archivo de datos separado.
- `data/demo-credentials.txt`: IDs y datos de confirmación para pruebas.
- `attachments/`: adjuntos ficticios asociados a los casos.

## Cómo probarlo

Abre directamente `index.html` en el navegador. No hace falta servidor local.

Para probar todos los estados y tipos de solicitud, copia los datos de `data/demo-credentials.txt`.

## Flujo funcional esperado

1. El usuario introduce el ID de solicitud o número de caso.
2. En la misma pantalla introduce el correo electrónico o teléfono usado en la solicitud.
3. Al pulsar `Buscar`, el sistema valida ambos datos en una única operación.
4. Si la combinación coincide, se muestra el expediente.
5. Si no coincide, se muestra un error genérico y no se expone información del expediente.
6. Si el caso tiene adjuntos, se muestran como enlaces normales con una pequeña etiqueta por tipo de archivo.

Los enlaces de adjuntos no usan el atributo `download`. La intención es que el navegador intente abrir el archivo por defecto. Si el navegador o dispositivo no tiene visor para el tipo de archivo, descargará el archivo o mostrará su comportamiento nativo.

## Seguimiento visual

El seguimiento tiene siempre dos pasos:

- `En trámite`: aparece siempre activo porque el caso ya ha sido registrado.
- Estado final: aparece como `Pendiente de resolución` si el caso sigue en trámite, o como `Resuelta aceptada`, `Resuelta denegada` o `Resuelta gestionada` si el expediente ya está cerrado.

Cuando el caso solo está en trámite, la línea queda abierta. Cuando existe un estado resuelto, la línea se cierra con el estado correspondiente.

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

## Adjuntos de muestra

El prototipo incluye ejemplos de tipos habituales:

- PDF: `attachments/acuse-reclamacion.pdf`
- Imagen: `attachments/foto-incidencia.svg`
- HTML: `attachments/respuesta-consulta.html`
- Texto: `attachments/valoracion-sugerencia.txt`
- CSV: `attachments/resumen-datos-tarjeta.csv`

La interfaz asigna una etiqueta compacta por familia de archivo: PDF, imagen, hoja de cálculo/CSV, documento, comprimido, código/HTML, texto y archivo genérico. Está hecho así para que el prototipo no dependa de librerías externas; en producción el desarrollador puede sustituir esas etiquetas por la librería de iconos que prefiera.

Los adjuntos deben mostrarse con iconos que, en este prototipo están simplificados, pero se espera que sean algo más acordes a los diferentes tipos de archivos.

Se espera también que al pulsar en los archivos el navegador actúe por defecto como él decida, ya sea descargándolos si no tiene ninguna aplicación para abrirlos, o abriéndolos y mostrándolos si es capaz, aunque estaría bien tener el botón de descargarlos directamente por si el navegador en algún caso no diera la opción de forma nativa.

## Modelo de datos del prototipo

Provisionalmente, cada elemento de `data/sample-cases.js` sigue esta forma:

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
      "url": "attachments/acuse-reclamacion.pdf",
      "mimeType": "application/pdf",
      "size": "5 KB"
    }
  ]
}
```

`personalData` se usa solo para simular la verificación en cliente. En producción no debe viajar al navegador.

## Sustitución por API real

Aun estamos pendientes de desarrollar la api para la consulta por lo que podría haber ligeras variaciones. Comentamos en cuanto esté lista.
