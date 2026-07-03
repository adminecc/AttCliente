# Formulario Prototipo

Este directorio contiene el prototipo funcional del formulario publico de Atencion al Cliente. Su objetivo es documentar y demostrar el comportamiento esperado para una implementacion de produccion: seleccion de tipo de solicitud, validacion, payload enviado a la API, adjuntos, firma y respuesta recibida.

El estilo visual no debe tomarse como contrato de produccion. El contrato funcional y de campos si debe respetarse en la medida considerada.

## Estructura

- `index.html`: pantalla principal del formulario con todos los tipos de solicitud.
- `script.js`: comportamiento del prototipo, validaciones, construccion del payload y envio a la API.
- `styles.css`: estilos del prototipo.
- `ConsultaClientePrototipo/`: prototipo separado para consulta del estado de una solicitud ya creada.
- `ejemplos_y_campos/`: esquemas, ejemplos y referencias de campos.

## Fuentes de verdad

- `ejemplos_y_campos/campos_referencia.md`: contrato funcional de campos, obligatorios, tipos de formulario, adjuntos y firma.
- `ConsultaClientePrototipo/README.md`: contrato funcional del prototipo de consulta de estado.
- `ejemplos_y_campos/unified-payload-schema.json`: esquema JSON del payload aceptado por la API.
- `ejemplos_y_campos/sharepoint_list_fields_reducido.csv`: campos reales de SharePoint para las listas completas: `ConsultaInformacion`, `Sugerencias`, `Agradecimientos`, `Objetos Perdidos NUEVA` y `ClientesTarjetaMetro`.

El CSV completo exportado desde SharePoint (`sharepoint_list_fields.csv`) se conserva como referencia tecnica. Para desarrollo del formulario se debe usar la version reducida cuando se necesite consultar nombres internos, tipos y choices de las listas cerradas.

## Ejecucion local

No hay proceso de build ni dependencias npm para este prototipo. Se puede servir como estatico con cualquier servidor local.

Ejemplo con Live Server:

```text
http://localhost:5500/
```

El formulario envia contra la Azure Function configurada en `script.js`:

```text
https://metroattfn-e0gucabgedacccey.spaincentral-01.azurewebsites.net/api/solicitudes/crear
```

Se pueden hacer pruebas en esta API pues está en desarrollo pero apunta a las listas de prueba creando los items satisfactoriamente. La lista de tarjetas + metro sí está en producción: evitar, en la medida de lo posible hacer pruebas en esta lista o avisar cuando se hayan introducido items de test.

## Tipos de solicitud

El campo de control `tipoFormulario` determina la lista destino:

- `consultas`: ConsultaInformacion.
- `sugerencias`: Sugerencias.
- `agradecimientos`: Agradecimientos.
- `reclamaciones`: ReclamacionesQuejas.
- `objetos`: Objetos Perdidos NUEVA.
- `tarjetas`: ClientesTarjetaMetro.

Los nombres de campos enviados a la API deben ser nombres internos de las listas SharePoint siempre que el campo exista en la lista destino. Los detalles de cada tipo se mantienen en `ejemplos_y_campos/campos_referencia.md`.

## Envio a la API

Si la solicitud no incluye archivos, el prototipo envia JSON:

```http
POST /api/solicitudes/crear
Content-Type: application/json
```

Si incluye archivos, envia `multipart/form-data`:

- Campo `payload`: JSON serializado de la solicitud.
- Campos de archivo: nombres generados por el prototipo, por ejemplo `file_adjuntos_0` o `file_fotoObjeto_0`.

La API devuelve un token publico de solicitud en la respuesta. Ese token es el valor que debe mostrarse al usuario en la ventana de confirmacion.

## Adjuntos y firma

Los adjuntos reales se usan en:

- Reclamaciones/quejas: input `adjuntos`.
- Objetos perdidos: input `fotoObjeto`.

Ambos controles admiten seleccion multiple y arrastrar archivos. Los archivos no se guardan como adjuntos nativos del item de lista; la API los sube a la biblioteca documental `DocumentosAdjuntos`, dentro de una carpeta con el token de la solicitud.

La firma de Tarjetas +Metro no es un adjunto. Se envia en el campo `Firma` como `data:image/png;base64,...`.

## Respuesta esperada

Tras una creacion correcta, la interfaz debe:

1. Mostrar el modal de confirmacion.
2. Mostrar el token devuelto por la API.
3. No generar referencias locales ficticias si la API ha respondido correctamente.

Si la API devuelve warnings, el prototipo los muestra en consola y los conserva en el log local.

## Logs de depuracion

El prototipo escribe entradas de depuracion en consola con el prefijo `[Metro API]` y guarda las ultimas llamadas en `localStorage` usando la clave:

```text
metroApiLogs
```

Estos logs son solo para desarrollo. No deben convertirse en almacenamiento funcional de produccion.

## Paquete entregado

Para la implementación del formulario en produccion con el comportamiento actual, los archivos entregados son:

- `index.html`
- `script.js`
- `styles.css`
- `README.md`
- `ConsultaClientePrototipo/`
- `ejemplos_y_campos/campos_referencia.md`
- `ejemplos_y_campos/unified-payload-schema.json`
- `ejemplos_y_campos/sharepoint_list_fields_reducido.csv`
