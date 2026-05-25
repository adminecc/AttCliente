📋 metro-form-schema.json
El contrato JSON completo que el diseñador del formulario dinámico necesita. Contiene:

listasDestino — los 6 tipos de solicitud posibles
camposComunes — campos que aparecen siempre (listaDestino, nombre, email, teléfono, fecha)
formulariosPorTipo — campos específicos de cada lista, con sus validaciones, dependencias entre campos (ej: estación depende de línea), tipos de campo (select, textarea, rating, file…), colores y iconos por tipo
captcha y honeypot — configuración de seguridad front-end
submit — endpoint, headers y mensajes de respuesta


⚡ Las 3 Azure Functions
fn1-validateRequest.js

Comprueba el campo honeypot (si viene relleno, devuelve un 200 falso para no revelar al bot que fue detectado)
Verifica el token CAPTCHA contra la API de hCaptcha
Valida campos comunes obligatorios, formato email y teléfono ES
Valida campos específicos según listaDestino
Controla longitudes de texto y fecha no futura
Devuelve el payload sanitizado (sin captchaToken ni _hp_metro) listo para fn3

fn2-generateToken.js

Genera tokens con formato XXX-YYYY-CCCCCCCC

XXX = prefijo por tipo: INC, SUG, REC, INF, OBJ, ACC
YYYY = año actual
CCCCCCCC = 8 chars con crypto.randomInt (criptográficamente seguro, sin ambiguos O/0/I/1)


Incluye función validarFormatoToken() para usarla en el endpoint de consulta de estado
Es importada directamente por fn3 para evitar latencia de red innecesaria

fn3-createSharePointItem.js

Autenticación con certificado: convierte el thumbprint hex de Azure Portal a Base64URL, firma un client_assertion JWT con RS256, y obtiene el access_token de Entra ID
Normaliza automáticamente la clave privada PEM (aunque en App Settings llegue sin saltos de línea)
Determina la lista de destino con el mapping listaDestino → InternalName de SharePoint
Construye el ítem con campos comunes + campos específicos según el tipo
Llama a POST /sites/{siteId}/lists/{listName}/items de MS Graph
Devuelve solicitudId, token y email para que el orquestador envíe el correo


Lo que tendrías que ajustar antes de desplegar:

En local.settings.template.json → rellenar las 7 variables de entorno con los valores reales de tu tenant
En fn3 → los InternalName de las columnas de SharePoint (los que hay son propuesta, deben coincidir exactamente con los que crees en las listas)
SHAREPOINT_SITE_ID → obtenerlo con GET https://graph.microsoft.com/v1.0/sites/{tenant}.sharepoint.com:/sites/MetroMalaga