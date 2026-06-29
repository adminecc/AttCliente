# Registro de mapeos y adaptaciones

Este documento recoge las decisiones de mapeo entre el formulario prototipo, la Azure Function y las listas reales de SharePoint.

La idea es mantener aqui cualquier ajuste de nombres de campos, normalizaciones de valores, columnas internas de SharePoint y reglas necesarias para que las solicitudes se acepten correctamente.

## Principios actuales

- El formulario puede enviar nombres pensados para el prototipo.
- La Azure Function debe adaptar esos nombres al contrato real de SharePoint.
- SharePoint debe recibir nombres internos de columna, no necesariamente los nombres visibles.
- El token generado es el identificador principal de cada solicitud.
- El token se guarda siempre en `Title`, que en las listas aparece como `N Solicitud` / `Nº Solicitud`.
- Antes de crear un item, la Function consulta las columnas reales de la lista y omite campos que no existan en esa lista.
- No se envian valores vacios a SharePoint para evitar errores en columnas de tipo `Choice`, `Number`, fecha u otros tipos estrictos.
- Si se omiten campos porque no existen en la lista destino, la Function debe registrar un warning.
- Si un campo existe pero el valor parece incompatible con el tipo de columna (`Choice`, `Number`, `DateTime`, `Boolean`), la Function debe registrar un warning antes de enviar a Graph.
- Si Graph rechaza el alta, con `DEBUG_ERRORS=true` la respuesta incluye `diagnostics.sharePoint` con lista, mensaje de Graph, warnings previos y resumen de campos enviados.
- Cada problema detectado en pruebas debe quedar registrado en este documento con fecha y estado.

## Adaptaciones generales

| Origen | Destino / comportamiento | Motivo |
| --- | --- | --- |
| `DNI` | `NIF` | Las listas de SharePoint aceptan `NIF`, `PAS` y `NIE`; no aceptan `DNI`. |
| Token generado (`REC-...`, `SUG-...`, etc.) | `Title` (`N Solicitud` / `Nº Solicitud`) | Es el identificador funcional principal de la solicitud. |
| Campos vacios (`""`, `null`, `undefined`) | No se envian a SharePoint | Evita errores `badArgument` en columnas con tipos u opciones cerradas. |
| Campos no existentes en la lista destino | Se omiten antes del `POST` a Graph y se registra warning | Evita errores como `Field 'NombreCompleto' is not recognized` y deja rastro para corregir mapeos. |
| `EstadoCliente` | `En tramite` | Toda solicitud nueva debe entrar con estado cliente inicial `En tramite`. |
| `DEBUG_ERRORS=true` | Solo diagnostico temporal | Permite devolver detalle de Graph en pruebas. Debe estar desactivado en uso normal. |

## Mapeo comun hacia SharePoint

Estos son los mapeos comunes aplicados desde `src/shared/sharepoint.js`.

| Payload / valor calculado | Columna interna SharePoint | Nota |
| --- | --- | --- |
| token generado | `Title` | En las listas aparece visualmente como `N Solicitud` / `Nº Solicitud`. |
| `nombre` | `Nombre` | Campo comun. |
| `apellidos` | `Apellidos` | Campo comun. |
| `tipoDocumento` | `TipoDeDocumento` | Debe usar valores admitidos por la lista, por ejemplo `NIF`, `PAS`, `NIE`. |
| `numeroDocumento` | `NumeroDeDocumento` | Nombre interno real observado en `Sugerencias`. |
| `email` | `CorreoElectronico` | Nombre interno real observado en `Sugerencias`. |
| `telefono` | `Telefono` | Campo comun. |
| `nacionalidad` | `Nacionalidad` | Si es columna `Choice`, el valor debe coincidir con una opcion real. |
| `token` | `TokenConsulta` | Campo secundario opcional; se envia solo si la lista contiene esa columna. El campo oficial sigue siendo `Title`. |
| `type.formValue` | `TipoFormulario` | Se envia solo si la lista contiene esa columna. |
| `type.key` | `TipoSolicitud` | Se envia solo si la lista contiene esa columna. |
| `"En tramite"` | `EstadoCliente` | Estado inicial por defecto de cualquier nueva solicitud. |
| `createdAt` | `FechaCreacion` | Se envia solo si la lista contiene esa columna. |
| `recibirPostal` | `RecibirPostal` | Se envia solo si la lista contiene esa columna. |
| `viaContacto` | `Direccion` | Nombre interno real observado en `Sugerencias`. |
| `numContacto` | `Numero` | En `Sugerencias` es columna numerica; no enviar si esta vacio. |
| `escContacto` | `Escalera` | Campo postal. |
| `pisoContacto` | `Piso` | Campo postal. |
| `puerContacto` | `Puerta` | Campo postal. |
| `cpContacto` | `CP` | Nombre interno real observado en `Sugerencias`. |
| `municipioContacto` | `Localidad` | Nombre interno real observado en `Sugerencias`. |
| `provinciaContacto` | `Provincia` | Campo postal. |
| payload completo | `PayloadJson` | Se envia solo si la lista contiene esa columna. |

## Mapeo especifico por tipo

Estos mapeos siguen en `FIELD_MAP` dentro de `src/shared/sharepoint.js`. Igual que los campos comunes, solo llegan a SharePoint si la columna existe en la lista destino.

### Reclamaciones

| Payload | Columna SharePoint |
| --- | --- |
| `clasificacion` | `Clasificacion` |
| `fechaIncidencia` | `FechaIncidencia` |
| `horaIncidencia` | `HoraIncidencia` |
| `tipologia` | `Tipologia` |
| `subtipologia` | `Subtipologia` |
| `lugarIncidencia` | `LugarIncidencia` |
| `trenIncidencia` | `TrenIncidencia` |
| `otroLugarIncidencia` | `OtroLugarIncidencia` |
| `tipoInstalacion` | `TipoInstalacion` |
| `tipoTitulo` | `TipoTitulo` |
| `importe_reclamado_1` | `ImporteReclamado` |
| `descripcionDetallada` | `Descripcion` |

### Consultas

| Payload | Columna SharePoint | Nota |
| --- | --- | --- |
| `descripcionDetalladaConsulta` | `Descripcion` | Es el unico texto obligatorio de consulta en el formulario actual. |
| `tipoTituloConsulta` | `TipoDeTitulo` | Se normaliza desde slug del prototipo a texto de SharePoint. |
| `numeracionTituloConsulta` | `NumTituloViaje` | Campo visible en SharePoint. |
| `tipologiaConsulta` | `Tipologia` | Se envia solo si existe en la lista destino. |
| `subtipologiaConsulta` | `Subtipologia` | Se envia solo si existe en la lista destino. |
| `lugarConsulta` | `LugarIncidencia` | Se envia solo si existe en la lista destino. |
| `trenConsulta` | `TrenIncidencia` | Se envia solo si existe en la lista destino. |
| `otroLugarConsulta` | `OtraUbicacion` | Pendiente de confirmar por lista; `ConsultaInformacion` no tiene esta columna. |
| `tipoInstalacionConsulta` | `TipoInstalacion` | Se envia solo si existe en la lista destino. |

### Sugerencias

| Payload | Columna SharePoint | Nota |
| --- | --- | --- |
| `lugarSugerencia` / `estacionSugerencia` | `Estacion` | En `Sugerencias` es columna `Choice`; se normalizan valores como `general`, `tren`, `otro`. |
| `otroLugarSugerencia` | `OtraUbicacion` | Texto libre cuando se elige otra ubicacion. |
| `tipoTituloSugerencia` | `TipoDeTitulo` | Se normaliza desde slug del prototipo a texto de SharePoint. |
| `numeracionTituloSugerencia` | `NumTituloViaje` | Numeracion del titulo de viaje. |
| `descripcionSugerencia` | `Descripcion` | Campo principal de descripcion. |

Adaptacion actual del prototipo:

- Si falta `areaSugerencia`, se usa `lugarSugerencia`.
- Si tambien falta, se usa `general`.
- Si falta `tituloSugerencia`, se usan los primeros 100 caracteres de `descripcionSugerencia`.
- Si no hay descripcion, se usa `Sugerencia`.
- `areaSugerencia` y `tituloSugerencia` se mantienen solo como campos derivados de validacion API; no existen como columnas reales en la lista `Sugerencias`.
- El contrato API considera obligatorios `lugarSugerencia` y `descripcionSugerencia`, que son los campos reales del prototipo.

### Agradecimientos

| Payload | Columna SharePoint |
| --- | --- |
| `motivoAgradecimiento` | `Motivo` |
| `fechaAgradecimiento` | `FechaEpisodio` |
| `lugarAgradecimiento` | `Lugar` |
| `estacionAgradecimientoDetalle` / `estacionAgradecimiento` | `Estacion` |
| `trenAgradecimiento` | `Tren` |
| `dirigidoAgradecimiento` | `DirigidoA` |
| `variosColectivos` | `Colectivos` |
| `nombreEmpleado` | `NumIdentificacionPersonaTrabajad` |
| `descripcionAgradecimiento` | `Descripcion` |

### Objetos perdidos

| Payload | Columna SharePoint |
| --- | --- |
| `fechaPerdida` | `FechaPerdida` |
| `horaPerdida` | `HoraPerdida` |
| `lineaMetroObjetos` | `LineaMetro` |
| `dondePerdidoObjetos` | `LugarPerdida` |
| `estacionPerdidaObjetos` | `EstacionPerdida` |
| `numeroTrenObjetos` | `NumeroTren` |
| `estacionOrigenObjetos` | `EstacionOrigen` |
| `estacionDestinoObjetos` | `EstacionDestino` |
| `nombreObjetoObjetos` | `NombreObjeto` |
| `colorObjetoObjetos` | `ColorObjeto` |
| `distintivoObjetoObjetos` | `DistintivoObjeto` |
| `descripcionObjeto` | `Descripcion` |

### Tarjetas +Metro

| Payload | Columna SharePoint |
| --- | --- |
| `motivoTarjeta` | `MotivoTarjeta` |
| `tipoTarjeta` | `TipoTarjeta` |
| `fechaNacimiento` | `FechaNacimiento` |
| `genero` | `Genero` |
| `direccionCompleta` | `DireccionCompleta` |
| `codigoPostal` | `CodigoPostal` |
| `municipio` | `Municipio` |
| `provincia` | `Provincia` |
| `puntoRecogida` | `PuntoRecogida` |

## Columnas reales observadas en `Sugerencias`

Consulta realizada contra:

`https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/Sugerencias`

Columnas internas relevantes observadas:

| Nombre interno | Nombre visible | Tipo / notas |
| --- | --- | --- |
| `Title` | `N solicitud` | Texto, requerido. |
| `Nombre` | `Nombre` | Texto. |
| `Apellidos` | `Apellidos` | Texto. |
| `TipoDeDocumento` | `Tipo de documento` | Choice: `NIF`, `PAS`, `NIE`. |
| `NumeroDeDocumento` | `N de documento` | Texto. |
| `CorreoElectronico` | `E-mail` | Texto. |
| `Telefono` | `Telefono` | Texto. |
| `Nacionalidad` | `Nacionalidad` | Choice con paises. |
| `Direccion` | `Direccion` | Texto. |
| `Numero` | `Numero` | Numero. |
| `Escalera` | `Escalera` | Texto. |
| `Piso` | `Piso` | Texto. |
| `Puerta` | `Puerta` | Texto. |
| `CP` | `CP` | Texto. |
| `Localidad` | `Localidad` | Texto. |
| `Provincia` | `Provincia` | Texto. |
| `Estacion` | `Estacion` | Choice. |
| `OtraUbicacion` | `OtraUbicacion` | Texto. |
| `TipoDeTitulo` | `Tipo de titulo` | Choice. |
| `NumTituloViaje` | `NumTituloViaje` | Texto. |
| `Descripcion` | `Descripcion` | Texto. |
| `EstadoCliente` | `EstadoCliente` | Choice: `En tramite`, `Resuelta aceptada`, `Resuelta gestionada`, `Resuelta denegada`. |

## Columnas reales observadas en `ConsultaInformacion`

Consulta realizada contra:

`https://metromalaga.sharepoint.com/sites/ConectaDEV/Lists/ConsultaInformacion`

Columnas internas relevantes observadas:

| Nombre interno | Nombre visible | Tipo / notas |
| --- | --- | --- |
| `Title` | `N solicitud` | Texto, requerido. Guarda el token. |
| `Nombre` | `Nombre` | Texto. |
| `Apellidos` | `Apellidos` | Texto. |
| `TipoDeDocumento` | `Tipo de documento` | Choice: `NIF`, `PAS`, `NIE`. |
| `NumeroDeDocumento` | `N de documento` | Texto. |
| `CorreoElectronico` | `E-mail` | Texto. |
| `Telefono` | `Telefono` | Texto. |
| `Nacionalidad` | `Nacionalidad` | Choice con paises. |
| `Direccion` | `Direccion` | Texto. |
| `Numero` | `Numero` | Numero. |
| `Escalera` | `Escalera` | Texto. |
| `Piso` | `Piso` | Texto. |
| `Puerta` | `Puerta` | Texto. |
| `CP` | `CP` | Texto. |
| `Localidad` | `Localidad` | Texto. |
| `Provincia` | `Provincia` | Texto. |
| `TipoDeTitulo` | `Tipo de titulo` | Choice. |
| `NumTituloViaje` | `NumTituloViaje` | Texto. |
| `Descripcion` | `Descripcion` | Texto. |
| `EstadoCliente` | `EstadoCliente` | Choice. |

## Problemas detectados

| Fecha | Lista / area | Problema | Estado | Resolucion / siguiente accion |
| --- | --- | --- | --- | --- |
| 2026-06-29 | Azure Functions v4 | `context.log.error` no existe y provocaba `500` vacio. | Solucionado | Usar `context.error(...)`; tests adaptados al runtime real. |
| 2026-06-29 | Sugerencias | `Estacion`, `OtraUbicacion`, `TipoDeTitulo` y `NumTituloViaje` no se rellenaban desde el prototipo. | Solucionado | Mapear `lugarSugerencia`, `otroLugarSugerencia`, `tipoTituloSugerencia` y `numeracionTituloSugerencia` a las columnas reales. |
| 2026-06-29 | Agradecimientos | Varios campos llegaban al payload pero no a SharePoint por nombres internos incorrectos. | Solucionado | Mapear a `Motivo`, `FechaEpisodio`, `Lugar`, `Estacion`, `Tren`, `DirigidoA`, `Colectivos` y `NumIdentificacionPersonaTrabajad`. |
| 2026-06-29 | Formulario prototipo | El modal mostraba una referencia local `ATT-*` en lugar del token real de la API. | Solucionado | El modal usa `response.token` devuelto por `crearSolicitud`. |
| 2026-06-29 | Sugerencias | La API rechazaba payloads reales del prototipo si no incluian `areaSugerencia` y `tituloSugerencia`. | Solucionado | El contrato obligatorio pasa a `lugarSugerencia` + `descripcionSugerencia`; los campos antiguos quedan como derivados opcionales. |
| 2026-06-29 | Diagnostico SharePoint | Cuando una columna existia pero tenia tipo/formato incorrecto era dificil identificar el campo causante. | Solucionado | Se anaden warnings preventivos para `Choice`, `Number`, `DateTime` y `Boolean`, mas `diagnostics.sharePoint` si Graph devuelve error. |
| 2026-06-29 | `Sugerencias` | `NombreCompleto` no existe en la lista. | Solucionado | Filtrar campos contra columnas reales antes del `POST` a Graph. |
| 2026-06-29 | `Sugerencias` | Varios campos comunes no existen en la lista (`TokenConsulta`, `TipoFormulario`, `TipoSolicitud`, `FechaCreacion`, `RecibirPostal`, `PayloadJson`, etc.). | Detectado | La Function los omite y avisa con warning; decidir si se crean columnas o se dejan fuera. |
| 2026-06-29 | `Sugerencias` | `DNI` no es valor admitido en `TipoDeDocumento`. | Solucionado | Normalizar `DNI` a `NIF`. |
| 2026-06-29 | `Sugerencias` | Valores vacios en columnas estrictas pueden provocar `badArgument`. | Solucionado | No enviar `""`, `null` ni `undefined` a SharePoint. |
| 2026-06-29 | `Sugerencias` | El estado inicial debe ser `En tramite`. | En observacion | Se envia `EstadoCliente = En tramite`; validar en pruebas reales si la lista exige otro literal exacto. |
| 2026-06-29 | Todas las listas | El token debe guardarse en `Nº Solicitud` y no depender de `TokenConsulta`. | Solucionado | `Title` recibe el token generado; la consulta busca por `Title` + email. |
| 2026-06-29 | `ConsultaInformacion` | El formulario no envia `descripcionCortaConsulta` y la lista no tiene `DescripcionCorta`. | Solucionado | `descripcionCortaConsulta` deja de ser obligatoria; se usa `descripcionDetalladaConsulta -> Descripcion`. |
| 2026-06-29 | `ConsultaInformacion` | `Tipo de titulo` y `NumTituloViaje` no se estaban mapeando al nombre interno real. | Solucionado | `tipoTituloConsulta -> TipoDeTitulo`; `numeracionTituloConsulta -> NumTituloViaje`. |
| 2026-06-29 | `ConsultaInformacion` | No existen columnas `Estacion` ni `OtraUbicacion`. | Detectado | No se pueden guardar esos campos en esta lista salvo que se creen columnas nuevas. |

## Pendientes de mapeo

| Lista | Estado | Notas |
| --- | --- | --- |
| `ReclamacionesQuejas` | Pendiente | Revisar columnas internas reales y valores `Choice`. |
| `ConsultaInformacion` | En curso | Columnas revisadas; pendiente validar valores exactos de `Choice` con pruebas reales. |
| `Agradecimientos` | Pendiente | Revisar columnas internas reales y valores `Choice`. |
| `Objetos Perdidos NUEVA` | Pendiente | Revisar columnas internas reales y valores `Choice`. |
| `ClientesTarjetaMetro` | Pendiente | Revisar columnas internas reales y valores `Choice`. |
| Campos comunes (`TokenConsulta`, `PayloadJson`, etc.) | Pendiente | Decidir si se crean columnas comunes en todas las listas o si solo se guardan donde existan. |
| `FIELD_MAP` | Pendiente | Ajustar nombres internos reales por lista cuando las pruebas indiquen discrepancias. |
