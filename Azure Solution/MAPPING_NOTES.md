# Registro de contrato SharePoint

Este documento recoge el contrato entre el formulario prototipo, la Azure Function y las listas reales de SharePoint.

## Principios actuales

- Los campos funcionales enviados a `POST /api/solicitudes/crear` deben usar nombres internos reales de SharePoint (`field_internal_name_for_create`).
- `tipoFormulario` se mantiene como campo de control para enrutar a la lista destino.
- `consentimiento`, `confirmEmail`, `recibirPostal`, adjuntos, firmas y metadatos son campos de control; no se guardan como columnas salvo que exista una columna directa.
- El token generado es el identificador principal y se guarda en `Title`, visible como numero de solicitud.
- La Function ya no usa `FIELD_MAP` para traducir nombres del prototipo a SharePoint.
- La Function si mantiene normalizacion de valores para choices cuando el prototipo envia slugs.
- Antes de crear un item, la Function consulta las columnas reales de la lista y omite campos que no existan, dejando warning.
- Si un campo existe pero el valor parece incompatible con su tipo (`Choice`, `Number`, `DateTime`, `Boolean`), la Function deja warning antes de llamar a Graph.
- Con `DEBUG_ERRORS=true`, los errores de Graph incluyen `diagnostics.sharePoint` con lista, mensaje, warnings y resumen de campos enviados.

## Campos comunes ConectaDEV

| Campo | Nota |
| --- | --- |
| `Title` | Token generado por API. |
| `Nombre`, `Apellidos`, `TipoDeDocumento`, `NumeroDeDocumento`, `CorreoElectronico`, `Telefono`, `Nacionalidad` | Datos de solicitante. |
| `Direccion`, `Numero`, `Escalera`, `Piso`, `Puerta`, `CP`, `Localidad`, `Provincia` | Direccion postal/contacto si aplica. |
| `EstadoCliente` | Se inicializa como `En tramite` en Consulta, Sugerencias y Agradecimientos. |

## ConsultaInformacion

| Campo | Uso |
| --- | --- |
| `TipoDeTitulo` | Choice normalizado desde slug si aplica. |
| `NumTituloViaje` | Numeracion del titulo. |
| `Descripcion` | Texto principal obligatorio. |

## Sugerencias

| Campo | Uso |
| --- | --- |
| `Estacion` | Choice normalizado desde slug. Obligatorio. |
| `OtraUbicacion` | Texto libre si aplica. |
| `TipoDeTitulo` | Choice normalizado desde slug si aplica. |
| `NumTituloViaje` | Numeracion del titulo. |
| `Descripcion` | Texto principal obligatorio. |

## Agradecimientos

| Campo | Uso |
| --- | --- |
| `Motivo` | Choice normalizado desde slug. Obligatorio. |
| `FechaEpisodio` | Fecha del episodio si aplica. |
| `Lugar` | Choice normalizado desde slug. |
| `Estacion` | Choice normalizado desde slug. |
| `Tren` | Choice, incluye `No se que tren es`. |
| `DirigidoA` | Choice normalizado desde slug. |
| `Colectivos` | Texto libre. |
| `NumIdentificacionPersonaTrabajad` | Identificador de persona trabajadora. |
| `Descripcion` | Texto principal obligatorio. |

## ReclamacionesQuejas

| Campo | Uso |
| --- | --- |
| `Clasificacion` | Choice normalizado desde slug. Obligatorio. |
| `FechaYHoraConsulta` | Fecha/hora de los hechos. Obligatorio. |
| `Lugar` | Choice de ubicacion normalizado desde slug. Obligatorio. |
| `TipoDeTitulo` | Choice normalizado desde slug si aplica. |
| `NBilleteTitulo` | Numero de billete/titulo. |
| `DAB` | Lookup. La API normaliza codigos del prototipo (`ATZ-DAB-101` -> `DAB 101`) y resuelve `DABLookupId` si el valor existe en la lista auxiliar. |
| `PuntoDeVenta` | Choice de estacion/punto de venta si aplica. |
| `TipoDeInstalacion` | Choice normalizado (`dab` -> `DAB`) cuando aplica. |
| `NClienteNTarjCredito` | Identificador auxiliar para MetroPay/tarjeta cuando aplica. |
| `ImporteAPagar` | Importe reclamado si aplica. |
| `DescripcionConsulta` | Texto principal obligatorio. |
| `Observaciones` | Detalles auxiliares no estructurados. |

La API convierte campos lookup a `CampoLookupId`. Si el payload trae un numero, lo usa como ID; si trae texto, busca el valor en la lista auxiliar por `Title`.
Pendiente: `DAB` tiene valores duplicados por estacion en su lista auxiliar; ahora se resuelve por titulo y falta desambiguar con `EstacionLookupId`. Tambien falta validar catalogos reales para `Tipologia`, `Subtipologia`, `EstadoDeLaResolucion` y otros lookups que aun no tienen campo visible en el prototipo.

## Objetos Perdidos NUEVA

| Campo | Uso |
| --- | --- |
| `FechaPerdida` | Fecha del extravio. Obligatorio. |
| `Localizacion` | Choice normalizado desde slug/estacion. Obligatorio. |
| `NUnidadTren` | Numero/unidad de tren si aplica. |
| `TipoObjeto` | Tipo de objeto. Obligatorio. |
| `TipoDeTitulo` | Choice normalizado desde slug si aplica. |
| `NumTituloViaje` | Numeracion del titulo. |
| `Descripcion` | Descripcion principal obligatoria. |
| `Observaciones` | Hora, linea, origen/destino u otros detalles. |
| `Estado` | Por defecto `Registrado`. |
| `TipoRegistro` | Por defecto `Objeto Perdido Reclamado`. |

## ClientesTarjetaMetro

| Campo | Uso |
| --- | --- |
| `NombreCliente`, `ApellidoCliente1`, `ApellidoCliente2`, `DNICliente`, `EmailCliente`, `TelefonoCliente1`, `TelefonoCliente2` | Datos del cliente. |
| `NombreRep`, `ApellidoRep1`, `ApellidoRep2`, `DNIRep`, `EmailRep`, `TelefonoRep1`, `TelefonoRep2` | Representante si aplica. |
| `MetodoNotificacion` | Choice normalizado (`email` -> `Correo`, `impreso` -> `Impresion`). |
| `Firma` | Nombre del archivo de firma subido como adjunto nativo del item. |
| `Title` | Token generado por API aunque la columna no sea requerida. |

## Adjuntos y firma

- El endpoint `POST /api/solicitudes/crear` acepta JSON puro o `multipart/form-data`.
- En multipart, el campo `payload` contiene el JSON y los campos de archivo se suben despues de crear el item.
- La firma de Tarjetas +Metro se envia como `signature_interesado_0` y se adjunta al item con nombre `firma-tarjeta-metro.png`.
- La columna `Firma` de `ClientesTarjetaMetro` guarda el nombre del archivo de firma.
- Si SharePoint REST rechaza un archivo, la solicitud queda creada y la respuesta incluye `warnings`.
- Prueba real 2026-06-29: la Function recibe multipart y crea el item, pero la subida de firma devolvio `401`; falta revisar permiso/admin consent de SharePoint REST para la app registrada.

## Problemas detectados

| Fecha | Lista / area | Problema | Estado | Resolucion / siguiente accion |
| --- | --- | --- | --- | --- |
| 2026-06-29 | Azure Functions v4 | `context.log.error` no existe y provocaba `500` vacio. | Solucionado | Usar `context.error(...)`; tests adaptados al runtime real. |
| 2026-06-29 | Sugerencias | Campos de ubicacion/titulo no llegaban a SharePoint. | Solucionado | El payload API usa `Estacion`, `OtraUbicacion`, `TipoDeTitulo`, `NumTituloViaje`, `Descripcion`. |
| 2026-06-29 | Agradecimientos | Varios campos llegaban con nombres prototipo. | Solucionado | El payload API usa nombres internos reales (`Motivo`, `FechaEpisodio`, `Lugar`, etc.). |
| 2026-06-29 | Formulario prototipo | El modal mostraba referencia local `ATT-*`. | Solucionado | El modal usa `response.token`. |
| 2026-06-29 | Diagnostico SharePoint | Eran dificiles de detectar errores de tipo/formato. | Solucionado | Warnings preventivos y `diagnostics.sharePoint`. |
| 2026-06-29 | Contrato API | Habia dependencia de `FIELD_MAP` y nombres prototipo. | En curso | API y prototipo migrados a nombres directos; lookup resolver generico implementado; quedan pendientes catalogos/controles de `Tipologia` y `Subtipologia`. |
| 2026-06-29 | Adjuntos / firma | El prototipo declaraba multipart pero enviaba JSON. | Codigo preparado / permiso pendiente | El prototipo envia `FormData` cuando hay binarios y la API intenta subir adjuntos por SharePoint REST. Prueba real: item `1372`, token `TAR-2026-UYCZGF22`, adjunto rechazado con `401`. |
| 2026-06-29 | Tarjetas +Metro | Registros de prueba de adjuntos/firma. | Solucionado | Borrados items `1372` y `1374` en `ClientesTarjetaMetro` con Graph (`204`). |
