# Campos de referencia

Contrato vigente para `POST /api/solicitudes/crear`.

Los campos enviados a la API deben usar los nombres internos de SharePoint (`field_internal_name_for_create`). `tipoFormulario` se mantiene como campo de control para enrutar la solicitud a la lista correcta. `consentimiento`, `confirmEmail`, `recibirPostal` y adjuntos son campos de control del formulario/API y no se guardan directamente como columnas de la lista origen salvo que exista una columna equivalente. En Tarjetas +Metro, `Firma` es una columna real y se envia como `data:image/png;base64,...`.

## Campos comunes Formularios


| Campo API                                                                           | Lista SharePoint               | Nota                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `Title`                                                                             | Todas                         | Lo genera la API como token`REC-*`, `CON-*`, `SUG-*`, etc. |
| `Nombre`                                                                            | Todas excepto Tarjetas +Metro | Nombre de la persona solicitante.                          |
| `Apellidos`                                                                         | Todas excepto Tarjetas +Metro | Apellidos de la persona solicitante.                       |
| `TipoDeDocumento`                                                                   | Todas excepto Tarjetas +Metro | `NIF`, `PAS`, `NIE`.                                       |
| `NumeroDeDocumento`                                                                 | Todas excepto Tarjetas +Metro | Documento.                                                 |
| `CorreoElectronico`                                                                 | Todas excepto Tarjetas +Metro | Email.                                                     |
| `Telefono`                                                                          | Todas excepto Tarjetas +Metro | Telefono.                                                  |
| `Nacionalidad`                                                                      | Todas excepto Tarjetas +Metro | Debe coincidir con choice de SharePoint.                   |
| `Direccion`, `Numero`, `Escalera`, `Piso`, `Puerta`, `CP`, `Localidad`, `Provincia` | Todas                          | Direccion postal/contacto.                                 |
| `EstadoCliente`                                                                     | Todas con columna equivalente | La API lo inicializa como`En tramite`.                     |

## ConsultaInformacion

Campos especificos: `TipoDeTitulo`, `NumTituloViaje`, `Descripcion`.

Obligatorio API: `Descripcion`.

## Sugerencias

Campos especificos: `Estacion`, `OtraUbicacion`, `TipoDeTitulo`, `NumTituloViaje`, `Descripcion`.

Obligatorio API: `Estacion`, `Descripcion`.

## Agradecimientos

Campos especificos: `Motivo`, `FechaEpisodio`, `Lugar`, `Estacion`, `Tren`, `DirigidoA`, `Colectivos`, `NumIdentificacionPersonaTrabajad`, `Descripcion`.

Obligatorio API: `Motivo`, `Descripcion`.

Nota: NumIdentificacionPersonaTrabajad acepta string por si se indica nombre en lugar de número

## ReclamacionesQuejas

Campos directos usados por ahora: `Clasificacion`, `FechaYHoraConsulta`, `Lugar`, `TipoDeTitulo`, `NBilleteTitulo`, `ImporteAPagar`, `DescripcionConsulta`, `Observaciones`.

Obligatorio API: `Clasificacion`, `FechaYHoraConsulta`, `Lugar`, `DescripcionConsulta`.

Nota: `DAB`, `Tipologia`, `Subtipologia`, `EstadoDeLaResolucion` y otros campos de clasificacion avanzada son `lookup`; la API solo debe enviarlos cuando pueda resolverlos contra la lista auxiliar correspondiente. Actualmente el formulario envia los campos directos necesarios para registrar la reclamacion.

## Objetos Perdidos NUEVA

Campos directos usados: `TipoDeTitulo`, `NumTituloViaje`, `FechaPerdida`, `LineaMetro`, `Localizacion`, `EstPerdida`, `NUnidadTren`, `EstOrig`, `EstDest`, `TipoObjeto`, `ColorObj`, `DistintivoObj`, `Descripcion`.

Obligatorio API: `FechaPerdida`, `LineaMetro`, `Localizacion`, `TipoObjeto`, `Descripcion`.

Hay campos obligatorios según la selección de `Localización` (ver prototipo)

Nota: `FechaPerdida` tendrá la fecha y la hora.

## ClientesTarjetaMetro

Campos especificos: `NombreCliente`, `ApellidoCliente1`, `ApellidoCliente2`, `DNICliente`, `EmailCliente`, `TelefonoCliente1`, `TelefonoCliente2`, `NombreRep`, `ApellidoRep1`, `ApellidoRep2`, `DNIRep`, `EmailRep`, `TelefonoRep1`, `TelefonoRep2`, `Direccion`, `Numero`, `Escalera`, `Piso`, `Puerta`, `CP`, `Localidad`, `Provincia`, `MetodoNotificacion`, `Firma`.

Obligatorio API: `NombreCliente`, `ApellidoCliente1`, `DNICliente`, `EmailCliente`, `TelefonoCliente1`, `MetodoNotificacion`.

Los campos de direccion usan los mismos nombres internos que el resto de listas.

## Normalizacion de valores

La API normaliza los slugs del formulario a choices de SharePoint. Por ejemplo: `tarjeta-consorcio` -> `Tarjeta Monedero Consorcio de Transportes de Andalucia`, `general` -> `General / Ninguna especifica`, `atencion-personal` -> `Atencion del personal`. Por ello, se enviarán los slugs a la API.

## Adjuntos y firma

- Los adjuntos reales se envian como `multipart/form-data`; el JSON viaja en el campo `payload`.
- Reclamaciones/quejas usa campos multipart `file_adjuntos_0`, `file_adjuntos_1`, etc.
- Objetos perdidos usa campos multipart `file_fotoObjeto_0`, `file_fotoObjeto_1`, etc.
- Ambos controles deben admitir seleccion multiple y arrastrar archivos.
- La API sube esos archivos a `DocumentosAdjuntos/{Title}/nombre-original-saneado`.
- En `DocumentosAdjuntos`, `IDRef` guarda el ID numerico del item origen en la lista y `Visible` queda en `true` (ya establecido por defecto).
- La firma de Tarjetas +Metro no es adjunto: se guarda en `Firma` como data URL/base64.
