# Plataforma OAC

Prototipo navegable de una plataforma para gestionar reclamaciones, quejas, consultas, incidencias, sugerencias y agradecimientos de una Oficina de Atención a la Clientela de una empresa de transporte ferroviario.

El objetivo no es ofrecer una aplicación productiva, sino una demo funcional y visual para explicar internamente cómo podría funcionar un sistema centralizado de gestión de casos: entrada multicanal, identificador único, estados, SLA, acuse de recibo, seguimiento externo, roles internos, auditoría y reporting.

## Cómo ejecutar

```bash
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:3000`.

Comandos útiles:

```bash
npm run typecheck
npm run build
```

## Rutas principales

- `/`: landing pública del Servicio de Atención a la Clientela.
- `/nueva-reclamacion`: formulario externo con justificante simulado.
- `/seguimiento`: consulta pública por código y email/documento.
- `/seguimiento/OAC-2026-000123`: vista pública saneada del caso.
- `/app`: dashboard interno.
- `/app/casos`: bandeja de casos con filtros.
- `/app/casos/nuevo`: alta manual asistida por canal.
- `/app/casos/OAC-2026-000123`: ficha interna completa.
- `/app/tareas`: vista de tareas para responsables internos.
- `/app/reporting`: métricas visuales simuladas.
- `/app/auditoria`: eventos del sistema.
- `/app/configuracion`: configuración visible solo con rol Administrador.

## Usuarios y roles simulados

La cabecera interna incluye un selector de rol visible. No hay autenticación real; se simulan permisos de interfaz mediante `canAccess(role, action, resource)`.

Roles incluidos:

- Administrador: acceso completo, incluida configuración.
- Supervisor OAC: bandeja completa, reasignación, estados críticos, métricas y auditoría.
- Operador OAC: alta y gestión operativa de casos, sin configuración global.
- Responsable interno: vista departamental simulada para Infraestructura.
- Auditor/Consulta: lectura de casos, eventos y métricas.
- Usuario externo: representado por las vistas públicas de seguimiento.

## Datos de ejemplo

Los datos viven en `lib/data.ts` y cubren:

- `OAC-2026-000123`: reclamación web por retraso y falta de información.
- `OAC-2026-000124`: incidencia telefónica de accesibilidad con transcripción simulada.
- `OAC-2026-000125`: consulta por email con extracción IA simulada.
- `OAC-2026-000126`: agradecimiento en tablet OAC cerrado y notificado.
- `OAC-2026-000127`: caso generado desde el formulario público de la demo.
- `OAC-2026-000128`: caso generado desde alta manual con documento físico simulado.

Cada caso incluye estado interno, estado público, canal, tipo, SLA, responsable, departamento, timeline público, timeline interno, comentarios, comunicaciones y adjuntos simulados.

## Arquitectura propuesta

- Next.js App Router con TypeScript.
- Tailwind CSS para interfaz sobria y corporativa.
- Componentes reutilizables en `components/`.
- Datos mock tipados en `lib/data.ts`.
- Modelo de permisos evolutivo en `lib/permissions.ts`.
- Rutas públicas e internas separadas.
- Vista pública deliberadamente saneada: no enseña notas internas, responsable, departamento, adjuntos privados ni auditoría completa.

## Qué partes son mock

- Persistencia de datos.
- Envío de emails.
- Generación de justificantes PDF.
- Adjuntos y repositorio documental.
- Integración con SharePoint.
- Integración con centralita.
- Transcripción de llamadas.
- Clasificación IA asistida.
- Autenticación y autorización real.
- Filtros y acciones internas, que muestran comportamiento simulado.

## Por qué no SharePoint como núcleo

SharePoint puede quedar como repositorio documental: escaneos, evidencias, adjuntos, plantillas firmadas o documentos asociados al expediente.

La gestión operativa debe vivir en una base relacional porque el sistema necesita entidades conectadas y consultables: casos, solicitantes, canales, estados, SLA, departamentos, responsables, eventos, comunicaciones, adjuntos, auditoría y permisos.

Tratar SharePoint como base de datos operativa dificulta asegurar trazabilidad consistente, integridad referencial, consultas complejas, control de plazos, auditoría, reporting fiable, separación entre vista interna y externa, evolución a RBAC real y publicación de un portal de seguimiento para la ciudadanía o clientela.

## Siguiente evolución

- Autenticación con Azure AD.
- PostgreSQL.
- Integración documental con SharePoint o Azure Blob.
- Envío real de emails.
- Integración con centralita.
- Transcripción de llamadas.
- Clasificación IA asistida.
- Power BI.
- Auditoría avanzada.

## Evolución a producción

Para convertir este prototipo en producto habría que introducir una API real, base de datos relacional, migraciones, autenticación, autorización backend, validación de formularios, generación documental, notificaciones transaccionales, almacenamiento documental, logging, auditoría inmutable, pruebas automatizadas y despliegue en un entorno corporativo.
