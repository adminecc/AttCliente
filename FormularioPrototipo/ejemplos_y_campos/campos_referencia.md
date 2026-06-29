# Campos de referencia

Contrato vigente para `POST /api/solicitudes/crear`.

Los campos enviados a la API deben usar los nombres internos de SharePoint (`field_internal_name_for_create`). `tipoFormulario` se mantiene como campo de control para enrutar la solicitud a la lista correcta. `consentimiento`, `confirmEmail`, `recibirPostal`, adjuntos y firmas son campos de control del formulario/API y no se guardan directamente como columnas salvo que exista una columna equivalente.

## Campos comunes ConectaDEV

| Campo API | Lista SharePoint | Nota |
| --- | --- | --- |
| `Title` | Todas | Lo genera la API como token `REC-*`, `CON-*`, `SUG-*`, etc. |
| `Nombre` | Todas ConectaDEV | Nombre de la persona solicitante. |
| `Apellidos` | Todas ConectaDEV | Apellidos de la persona solicitante. |
| `TipoDeDocumento` | Todas ConectaDEV | `NIF`, `PAS`, `NIE`. |
| `NumeroDeDocumento` | Todas ConectaDEV | Documento. |
| `CorreoElectronico` | Todas ConectaDEV | Email. |
| `Telefono` | Todas ConectaDEV | Telefono. |
| `Nacionalidad` | Todas ConectaDEV | Debe coincidir con choice de SharePoint. |
| `Direccion`, `Numero`, `Escalera`, `Piso`, `Puerta`, `CP`, `Localidad`, `Provincia` | Listas que tengan direccion | Direccion postal/contacto. |
| `EstadoCliente` | Consulta, Sugerencias, Agradecimientos | La API lo inicializa como `En tramite`. |

## ConsultaInformacion

Campos especificos: `TipoDeTitulo`, `NumTituloViaje`, `Descripcion`.

Obligatorio API: `Descripcion`.

## Sugerencias

Campos especificos: `Estacion`, `OtraUbicacion`, `TipoDeTitulo`, `NumTituloViaje`, `Descripcion`.

Obligatorio API: `Estacion`, `Descripcion`.

## Agradecimientos

Campos especificos: `Motivo`, `FechaEpisodio`, `Lugar`, `Estacion`, `Tren`, `DirigidoA`, `Colectivos`, `NumIdentificacionPersonaTrabajad`, `Descripcion`.

Obligatorio API: `Motivo`, `Descripcion`.

## ReclamacionesQuejas

Campos directos usados por ahora: `Clasificacion`, `FechaYHoraConsulta`, `Lugar`, `TipoDeTitulo`, `NBilleteTitulo`, `ImporteAPagar`, `DescripcionConsulta`, `Observaciones`.

Obligatorio API: `Clasificacion`, `FechaYHoraConsulta`, `Lugar`, `DescripcionConsulta`.

Pendiente: `Tipologia`, `Subtipologia`, `DAB`, `EstadoDeLaResolucion`, etc. son `lookup`; no deben enviarse como texto hasta resolver los IDs de lookup.

## Objetos Perdidos NUEVA

Campos directos usados por ahora: `FechaPerdida`, `Localizacion`, `NUnidadTren`, `TipoObjeto`, `TipoDeTitulo`, `NumTituloViaje`, `Descripcion`, `Observaciones`, `Estado`, `TipoRegistro`.

Obligatorio API: `FechaPerdida`, `Localizacion`, `TipoObjeto`, `Descripcion`.

La API inicializa `Estado = Registrado` y `TipoRegistro = Objeto Perdido Reclamado` si no llegan informados.

## ClientesTarjetaMetro

Campos especificos: `NombreCliente`, `ApellidoCliente1`, `ApellidoCliente2`, `DNICliente`, `EmailCliente`, `TelefonoCliente1`, `TelefonoCliente2`, `NombreRep`, `ApellidoRep1`, `ApellidoRep2`, `DNIRep`, `EmailRep`, `TelefonoRep1`, `TelefonoRep2`, `MetodoNotificacion`, `Firma`.

Obligatorio API: `NombreCliente`, `ApellidoCliente1`, `DNICliente`, `EmailCliente`, `TelefonoCliente1`, `MetodoNotificacion`.

## Normalizacion de valores

La API sigue normalizando slugs del formulario a choices de SharePoint. Por ejemplo: `tarjeta-consorcio` -> `Tarjeta Monedero Consorcio de Transportes de Andalucia`, `general` -> `General / Ninguna especifica`, `atencion-personal` -> `Atencion del personal`.
