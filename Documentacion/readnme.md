

# Documentacion AttCliente

Documentos vivos principales:

- `Azure Solution/README.md`: guia tecnica de la Azure Function, variables, despliegue, endpoints y adjuntos.
- `Azure Solution/MAPPING_NOTES.md`: contrato real entre formulario, API y listas SharePoint.
- `FormularioPrototipo/ejemplos_y_campos/campos_referencia.md`: resumen de campos internos SharePoint usados por el prototipo.
- `FormularioPrototipo/ejemplos_y_campos/unified-payload-schema.json`: schema del payload del formulario.
- `Azure Solution/metro-form-schema.json`: schema equivalente usado desde la solucion Azure.

Estado funcional actual:

- El token `XXX-2026-XXXXXXXX` se guarda como `Title` / Nº solicitud.
- Los adjuntos se guardan en `DocumentosAdjuntos/{token}`.
- `DocumentosAdjuntos.IDRef` guarda el ID numerico del item origen.
- `DocumentosAdjuntos.Visible` queda en `true`.
- La firma de Tarjetas +Metro se guarda en `Firma` como `data:image/png;base64,...`.
