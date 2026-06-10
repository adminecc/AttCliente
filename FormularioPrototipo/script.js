/**
 * Formulario Unificado de Atención al Cliente - Metro
 * Gestión dinámica de formularios según tipo seleccionado
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================
    const form = document.getElementById('mainForm');
    const tipoFormulario = document.getElementById('tipoFormulario');
    const formContainer = document.getElementById('formContainer');
    
    // Secciones del formulario
    const secciones = {
        datosPersonales: document.getElementById('datosPersonales'),
        reclamaciones: document.getElementById('seccionReclamaciones'),
        consultas: document.getElementById('seccionConsultas'),
        sugerencias: document.getElementById('seccionSugerencias'),
        agradecimientos: document.getElementById('seccionAgradecimientos'),
        objetos: document.getElementById('seccionObjetos'),
        tarjetas: document.getElementById('seccionTarjetas'),

        consentimiento: document.getElementById('seccionConsentimiento')
    };
    
    // Modal
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalReference = document.getElementById('modalReference');
    
    // Botones
    const btnLimpiar = document.getElementById('btnLimpiar');
    
    // Campos específicos
    const tipologia = document.getElementById('tipologia');
    const subtipologia = document.getElementById('subtipologia');
    const lugarIncidencia = document.getElementById('lugarIncidencia');
    const grupoTrenIncidencia = document.getElementById('grupoTrenIncidencia');
    const trenIncidencia = document.getElementById('trenIncidencia');
    const grupoOtroLugarIncidencia = document.getElementById('grupoOtroLugarIncidencia');
    const otroLugarIncidencia = document.getElementById('otroLugarIncidencia');
    const lugarSugerencia = document.getElementById('lugarSugerencia');
    const grupoTrenSugerencia = document.getElementById('grupoTrenSugerencia');
    const trenSugerencia = document.getElementById('trenSugerencia');
    const grupoOtroLugarSugerencia = document.getElementById('grupoOtroLugarSugerencia');
    const otroLugarSugerencia = document.getElementById('otroLugarSugerencia');
    const descripcionCorta = document.getElementById('descripcionCorta');
    const charCount = document.getElementById('charCount');
    
    // ============================================
    // DATOS DE SUBTIPOLOGÍAS
    // ============================================
    const subtipologias = {
        titulo: [
            { value: 'recarga', text: 'Problemas de recarga' },
            { value: 'validacion', text: 'Errores de validación' },
            { value: 'cobro', text: 'Cobro incorrecto' },
            { value: 'deterioro', text: 'Tarjeta deteriorada' },
            { value: 'perdida', text: 'Pérdida de saldo' }
        ],
        accesibilidad: [
            { value: 'ascensor', text: 'Ascensor fuera de servicio' },
            { value: 'escalera', text: 'Escalera mecánica averiada' },
            { value: 'rampa', text: 'Rampa no accesible' },
            { value: 'senalizacion', text: 'Señalización insuficiente' },
            { value: 'braille', text: 'Falta de información en Braille' }
        ],
        informacion: [
            { value: 'horarios', text: 'Información de horarios incorrecta' },
            { value: 'paneles', text: 'Paneles informativos averiados' },
            { value: 'megafonia', text: 'Megafonía deficiente' },
            { value: 'planos', text: 'Planos desactualizados' },
            { value: 'app', text: 'Problemas con la app' }
        ],
        instalaciones: [
            { value: 'climatizacion', text: 'Climatización inadecuada' },
            { value: 'iluminacion', text: 'Iluminación deficiente' },
            { value: 'asientos', text: 'Asientos en mal estado' },
            { value: 'puertas', text: 'Puertas defectuosas' },
            { value: 'otros-inst', text: 'Otras instalaciones' }
        ],
        personal: [
            { value: 'trato', text: 'Trato inadecuado' },
            { value: 'informacion-p', text: 'Información incorrecta' },
            { value: 'ausencia', text: 'Ausencia de personal' },
            { value: 'identificacion', text: 'Falta de identificación' }
        ],
        seguridad: [
            { value: 'robo', text: 'Robo o hurto' },
            { value: 'acoso', text: 'Acoso' },
            { value: 'vandalismo', text: 'Vandalismo' },
            { value: 'emergencia', text: 'Actuación en emergencia' }
        ],
        servicio: [
            { value: 'retraso', text: 'Retraso significativo' },
            { value: 'frecuencia', text: 'Frecuencia insuficiente' },
            { value: 'aglomeracion', text: 'Aglomeraciones' },
            { value: 'interrupcion', text: 'Interrupción del servicio' },
            { value: 'correspondencia', text: 'Problemas en correspondencias' }
        ],
        limpieza: [
            { value: 'vagones', text: 'Limpieza de vagones' },
            { value: 'estaciones', text: 'Limpieza de estaciones' },
            { value: 'aseos', text: 'Estado de aseos' },
            { value: 'olores', text: 'Malos olores' }
        ],
        otros: [
            { value: 'otro-general', text: 'Otro motivo' }
        ]
    };
    
    // ============================================
    // CONFIGURACIÓN DE SECCIONES POR TIPO
    // ============================================
    const configuracionTipos = {
        reclamaciones: {
            titulo: 'Reclamaciones y Quejas',
            secciones: ['datosPersonales', 'reclamaciones', 'consentimiento']
        },
        consultas: {
            titulo: 'Consulta de Información',
            secciones: ['datosPersonales', 'consultas', 'consentimiento']
        },
        sugerencias: {
            titulo: 'Sugerencias',
            secciones: ['datosPersonales', 'sugerencias', 'consentimiento']
        },
        agradecimientos: {
            titulo: 'Agradecimientos y Felicitaciones',
            secciones: ['datosPersonales', 'agradecimientos', 'consentimiento']
        },
        objetos: {
            titulo: 'Objetos Perdidos',
            secciones: ['datosPersonales', 'objetos', 'consentimiento']
        },
        tarjetas: {
            titulo: 'Tarjetas +Metro',
            secciones: ['datosPersonales', 'tarjetas', 'consentimiento']
        }
    };
    
    // ============================================
    // FUNCIONES PRINCIPALES
    // ============================================
    
    /**
     * Muestra las secciones correspondientes al tipo de formulario seleccionado
     */
    function mostrarSecciones(tipo) {
        // Ocultar todas las secciones primero
        Object.values(secciones).forEach(seccion => {
            if (seccion) seccion.classList.add('hidden');
        });
        
        if (!tipo || !configuracionTipos[tipo]) {
            formContainer.classList.add('hidden');
            return;
        }
        
        // Mostrar el contenedor principal
        formContainer.classList.remove('hidden');
        
        // Mostrar las secciones correspondientes
        configuracionTipos[tipo].secciones.forEach(nombreSeccion => {
            if (secciones[nombreSeccion]) {
                secciones[nombreSeccion].classList.remove('hidden');
            }
        });
        
        // Ajustar elementos específicos para tarjeta +Metro
        const txtTituloDatosPersonales = document.getElementById('txtTituloDatosPersonales');
        const disclaimerTarjetas = document.getElementById('disclaimerTarjetas');
        const grupoRepresentanteCheck = document.getElementById('grupoRepresentanteCheck');
        const grupoDatosCorrectosCheck = document.getElementById('grupoDatosCorrectosCheck');
        const containerFirmaTarjetas = document.getElementById('containerFirmaTarjetas');
        const lopdTextoTarjetas = document.getElementById('lopdTextoTarjetas');
        
        if (tipo === 'tarjetas') {
            if (txtTituloDatosPersonales) txtTituloDatosPersonales.textContent = 'Datos personales del interesado';
            if (disclaimerTarjetas) disclaimerTarjetas.classList.remove('hidden');
            if (grupoRepresentanteCheck) grupoRepresentanteCheck.classList.remove('hidden');
            if (grupoDatosCorrectosCheck) grupoDatosCorrectosCheck.classList.remove('hidden');
            if (containerFirmaTarjetas) containerFirmaTarjetas.classList.remove('hidden');
            if (lopdTextoTarjetas) lopdTextoTarjetas.classList.remove('hidden');
            
            // Actualizar visibilidad de representante/dirección según el checkbox
            if (typeof actualizarVisibilidadRepresentante === 'function') {
                actualizarVisibilidadRepresentante();
            }
            // Actualizar estado de la firma (habilitar/deshabilitar)
            if (typeof actualizarEstadoFirma === 'function') {
                actualizarEstadoFirma();
            }
        } else {
            if (txtTituloDatosPersonales) txtTituloDatosPersonales.textContent = 'Datos personales';
            if (disclaimerTarjetas) disclaimerTarjetas.classList.add('hidden');
            if (grupoRepresentanteCheck) {
                grupoRepresentanteCheck.classList.add('hidden');
                const checkboxRep = grupoRepresentanteCheck.querySelector('input[type="checkbox"]');
                if (checkboxRep) checkboxRep.checked = false;
            }
            if (grupoDatosCorrectosCheck) {
                grupoDatosCorrectosCheck.classList.add('hidden');
                const checkboxCorrectos = grupoDatosCorrectosCheck.querySelector('input[type="checkbox"]');
                if (checkboxCorrectos) checkboxCorrectos.checked = false;
            }
            if (containerFirmaTarjetas) containerFirmaTarjetas.classList.add('hidden');
            if (lopdTextoTarjetas) lopdTextoTarjetas.classList.add('hidden');
            
            // Si no es tarjetas, restauramos comportamiento normal para representante
            const bloqueRepresentante = document.getElementById('bloqueRepresentante');
            if (bloqueRepresentante) bloqueRepresentante.classList.add('hidden');
            
            // Actualizar visibilidad de envío y de dirección de contacto
            if (typeof actualizarVisibilidadEnvio === 'function') {
                actualizarVisibilidadEnvio();
            }
        }
        
        // Resetear campos required según la sección
        actualizarCamposRequired(tipo);
        comprobarCamposObligatorios();
        
        // Scroll suave al inicio del formulario
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    /**
     * Actualiza los campos required según el tipo de formulario
     */
    function actualizarCamposRequired(tipo) {
        // Primero, quitar required de todos los campos específicos
        const todosLosCampos = form.querySelectorAll('[data-required]');
        todosLosCampos.forEach(campo => {
            campo.removeAttribute('required');
        });
        
        // Los campos de datos personales siempre son required
        const camposPersonalesRequired = ['tipoDocumento', 'numeroDocumento', 'nombre', 'apellidos', 'email', 'confirmEmail', 'telefono', 'viaContacto', 'numContacto', 'cpContacto', 'municipioContacto', 'provinciaContacto'];
        camposPersonalesRequired.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.setAttribute('required', '');
        });
        
        // Campos específicos por tipo
        const camposEspecificos = {
            reclamaciones: ['clasificacion', 'canalRecepcion', 'fechaIncidencia', 'tipologia', 'lugarIncidencia', 'descripcionCorta', 'descripcionDetallada'],
            consultas: ['descripcionCortaConsulta', 'descripcionDetalladaConsulta'],
            sugerencias: ['areaSugerencia', 'lugarSugerencia', 'descripcionSugerencia'],
            agradecimientos: ['motivoAgradecimiento', 'dirigidoAgradecimiento', 'descripcionAgradecimiento'],
            objetos: ['fechaPerdida', 'lineaMetroObjetos', 'dondePerdidoObjetos', 'nombreObjetoObjetos', 'descripcionObjeto'],
            tarjetas: ['motivoTarjeta', 'fechaNacimiento', 'fechaCitaTarjeta', 'horaCitaTarjeta', 'medioNotificacionTarjeta']
        };
        
        if (camposEspecificos[tipo]) {
            camposEspecificos[tipo].forEach(id => {
                const campo = document.getElementById(id);
                if (campo) campo.setAttribute('required', '');
            });
        }
    }
    
    /**
     * Actualiza las opciones de subtipología según la tipología seleccionada
     */
    function actualizarSubtipologias(tipologiaValue) {
        subtipologia.innerHTML = '<option value="">Seleccione...</option>';
        
        if (tipologiaValue && subtipologias[tipologiaValue]) {
            subtipologias[tipologiaValue].forEach(opcion => {
                const option = document.createElement('option');
                option.value = opcion.value;
                option.textContent = opcion.text;
                subtipologia.appendChild(option);
            });
        }
    }

    /**
     * Muestra campos opcionales según Estación / Lugar
     */
    function actualizarCamposLugar(lugarValue, grupoTren, tren, grupoOtroLugar, otroLugar) {
        if (grupoTren && tren) {
            grupoTren.classList.toggle('hidden', lugarValue !== 'tren');
            if (lugarValue !== 'tren') tren.value = '';
        }

        if (grupoOtroLugar && otroLugar) {
            grupoOtroLugar.classList.toggle('hidden', lugarValue !== 'otro');
            if (lugarValue !== 'otro') otroLugar.value = '';
        }
    }

    function actualizarCamposLugarIncidencia(lugarValue) {
        actualizarCamposLugar(lugarValue, grupoTrenIncidencia, trenIncidencia, grupoOtroLugarIncidencia, otroLugarIncidencia);
    }

    function actualizarCamposLugarSugerencia(lugarValue) {
        actualizarCamposLugar(lugarValue, grupoTrenSugerencia, trenSugerencia, grupoOtroLugarSugerencia, otroLugarSugerencia);
    }
    
    /**
     * Genera un número de referencia único
     */
    function generarReferencia() {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const aleatorio = Math.floor(Math.random() * 90000) + 10000;
        return `ATT-${año}-${aleatorio}`;
    }
    
    /**
     * Valida el formulario antes del envío
     */
    /**
     * Comprueba si todos los campos requeridos visibles están rellenos y habilita/deshabilita el botón de enviar
     */
    function comprobarCamposObligatorios() {
        const camposRequired = form.querySelectorAll('[required]');
        let todosRellenos = true;
        
        camposRequired.forEach(campo => {
            if (!campo.closest('.hidden')) {
                if (campo.type === 'checkbox') {
                    if (!campo.checked) {
                        todosRellenos = false;
                    }
                } else {
                    if (!campo.value.trim()) {
                        todosRellenos = false;
                    }
                }
            }
        });
        
        const btnEnviar = document.getElementById('btnEnviar');
        if (btnEnviar) {
            btnEnviar.disabled = !todosRellenos;
        }
    }

    function validarFormulario() {
        const camposRequired = form.querySelectorAll('[required]');
        let primerError = null;
        let esValido = true;
        
        // Limpiar errores previos
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        camposRequired.forEach(campo => {
            // Solo validar campos visibles

            if (!campo.closest('.hidden')) {
                if (!campo.value.trim()) {
                    campo.classList.add('error');
                    esValido = false;
                    if (!primerError) primerError = campo;
                }
            }
        });

        // Validar campos PAN con longitudes exactas (solo si son visibles)
        const inputsPan = form.querySelectorAll('.input-pan');
        inputsPan.forEach(input => {
            if (!input.closest('.hidden')) {
                const val = input.value.trim();
                if (val === '' && !input.hasAttribute('required')) {
                    return;
                }
                const maxLength = parseInt(input.getAttribute('maxlength'), 10);
                if (val.length !== maxLength || /\D/.test(val)) {
                    input.classList.add('error');
                    esValido = false;
                    if (!primerError) primerError = input;
                }
            }
        });
        
        // Validar checkbox de consentimiento
        const consentimiento = document.getElementById('consentimiento');
        if (!consentimiento.checked) {
            esValido = false;
            if (!primerError) primerError = consentimiento;
        }
        
        // Validar email
        const email = document.getElementById('email');
        const confirmEmail = document.getElementById('confirmEmail');
        if (email.value && !validarEmail(email.value)) {
            email.classList.add('error');
            esValido = false;
            if (!primerError) primerError = email;
        }
        if (confirmEmail && confirmEmail.value && (confirmEmail.value !== email.value || !validarEmail(confirmEmail.value))) {
            confirmEmail.classList.add('error');
            esValido = false;
            if (!primerError) primerError = confirmEmail;
        }
        
        // Validar teléfono español (9 dígitos con prefijo opcional)
        const telefono = document.getElementById('telefono');
        if (telefono && telefono.value) {
            const normalizedPhone = telefono.value.replace(/[\s-]/g, '');
            const phoneRegex = /^(?:\+34|34|0034)?[6789]\d{8}$/;
            if (!phoneRegex.test(normalizedPhone)) {
                telefono.classList.add('error');
                esValido = false;
                if (!primerError) primerError = telefono;
            }
        }

        // Validar DNI/NIE español
        const tipoDocumento = document.getElementById('tipoDocumento');
        const numeroDocumento = document.getElementById('numeroDocumento');
        if (tipoDocumento && numeroDocumento && numeroDocumento.value) {
            const tipo = tipoDocumento.value;
            if (tipo === 'NIF' || tipo === 'NIE') {
                if (!validarDNI_NIE(numeroDocumento.value)) {
                    numeroDocumento.classList.add('error');
                    esValido = false;
                    if (!primerError) primerError = numeroDocumento;
                }
            }
        }

        // Validar email del representante (si está visible)
        const emailRep = document.getElementById('emailRep');
        const confirmEmailRep = document.getElementById('confirmEmailRep');
        if (emailRep && !emailRep.closest('.hidden')) {
            if (emailRep.value && !validarEmail(emailRep.value)) {
                emailRep.classList.add('error');
                esValido = false;
                if (!primerError) primerError = emailRep;
            }
            if (confirmEmailRep && confirmEmailRep.value && (confirmEmailRep.value !== emailRep.value || !validarEmail(confirmEmailRep.value))) {
                confirmEmailRep.classList.add('error');
                esValido = false;
                if (!primerError) primerError = confirmEmailRep;
            }
        }
        
        // Validar teléfono del representante (si está visible)
        const telefonoRep = document.getElementById('telefonoRep');
        if (telefonoRep && !telefonoRep.closest('.hidden') && telefonoRep.value) {
            const normalizedPhone = telefonoRep.value.replace(/[\s-]/g, '');
            const phoneRegex = /^(?:\+34|34|0034)?[6789]\d{8}$/;
            if (!phoneRegex.test(normalizedPhone)) {
                telefonoRep.classList.add('error');
                esValido = false;
                if (!primerError) primerError = telefonoRep;
            }
        }

        // Validar DNI/NIE del representante (si está visible)
        const tipoDocumentoRep = document.getElementById('tipoDocumentoRep');
        const numeroDocumentoRep = document.getElementById('numeroDocumentoRep');
        if (tipoDocumentoRep && numeroDocumentoRep && !numeroDocumentoRep.closest('.hidden') && numeroDocumentoRep.value) {
            const tipo = tipoDocumentoRep.value;
            if (tipo === 'NIF' || tipo === 'NIE') {
                if (!validarDNI_NIE(numeroDocumentoRep.value)) {
                    numeroDocumentoRep.classList.add('error');
                    esValido = false;
                    if (!primerError) primerError = numeroDocumentoRep;
                }
            }
        }
        
        if (primerError) {
            primerError.focus();
            primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return esValido;
    }
    
    /**
     * Valida formato de email
     */
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    /**
     * Valida formato y letra de DNI/NIE español
     */
    function validarDNI_NIE(value) {
        const cleanValue = value.trim().toUpperCase().replace(/[\s-]/g, '');
        const dniNieRegex = /^[XYZ\d]\d{7}[A-Z]$/;
        if (!dniNieRegex.test(cleanValue)) {
            return false;
        }
        
        let numberStr = cleanValue.substring(0, 8);
        if (numberStr.startsWith('X')) {
            numberStr = '0' + numberStr.substring(1);
        } else if (numberStr.startsWith('Y')) {
            numberStr = '1' + numberStr.substring(1);
        } else if (numberStr.startsWith('Z')) {
            numberStr = '2' + numberStr.substring(1);
        }
        
        const number = parseInt(numberStr, 10);
        const letter = cleanValue.charAt(8);
        const validLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
        const expectedLetter = validLetters.charAt(number % 23);
        
        return letter === expectedLetter;
    }
    
    /**
     * Limpia todos los campos del formulario
     */
    function limpiarFormulario() {
        form.reset();
        formContainer.classList.add('hidden');
        
        // Limpiar errores
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        // Limpiar lista de archivos
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = '';
        const fileListConsultas = document.getElementById('fileListConsultas');
        if (fileListConsultas) fileListConsultas.innerHTML = '';
        
        // Resetear contador de caracteres
        if (charCount) charCount.textContent = '0';
        const charCountConsulta = document.getElementById('charCountConsulta');
        if (charCountConsulta) charCountConsulta.textContent = '0';

        // Ocultar campos opcionales de ubicación
        actualizarCamposLugarIncidencia('');
        actualizarCamposLugarSugerencia('');
        const recibirPostal = document.getElementById('recibirPostal');
        if (recibirPostal) recibirPostal.checked = false;
        // La visibilidad de la dirección de contacto se actualizará al inicializar el formulario
        
        // Limpiar dirección de envío
        const direccionEnvioSelect = document.getElementById('direccionEnvioSelect');
        if (direccionEnvioSelect) direccionEnvioSelect.value = 'misma';
        if (typeof actualizarVisibilidadEnvio === 'function') {
            actualizarVisibilidadEnvio();
        }
        const grupoTrenConsulta = document.getElementById('grupoTrenConsulta');
        if (grupoTrenConsulta) grupoTrenConsulta.classList.add('hidden');
        const grupoOtroLugarConsulta = document.getElementById('grupoOtroLugarConsulta');
        if (grupoOtroLugarConsulta) grupoOtroLugarConsulta.classList.add('hidden');
        
        // Resetear elementos del representante y firma de +Metro
        const solicitudRepresentante = document.getElementById('solicitudRepresentante');
        if (solicitudRepresentante) solicitudRepresentante.checked = false;
        
        if (typeof limpiarFirma === 'function') {
            limpiarFirma();
        }
        if (typeof actualizarEstadoFirma === 'function') {
            actualizarEstadoFirma();
        }
        
        // Limpiar y ocultar bloques condicionales de títulos de viaje
        if (typeof ocultarYResetearTodosLosBloques === 'function') {
            ocultarYResetearTodosLosBloques();
        }

        // Resetear contadores de textareas
        document.querySelectorAll('textarea.textarea').forEach(textarea => {
            const currentCount = document.getElementById('charCount_' + textarea.id);
            if (currentCount) currentCount.textContent = '0';
        });

        comprobarCamposObligatorios();

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * Muestra el modal de confirmación
     */
    function mostrarModal() {
        modalReference.textContent = generarReferencia();
        modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Cierra el modal y resetea el formulario
     */
    function cerrarModal() {
        modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        limpiarFormulario();
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Cambio de tipo de formulario
    tipoFormulario.addEventListener('change', (e) => {
        mostrarSecciones(e.target.value);
    });
    
    // Cambio de tipología (para reclamaciones)
    if (tipologia) {
        tipologia.addEventListener('change', (e) => {
            actualizarSubtipologias(e.target.value);
        });
    }

    // Cambio de Estación / Lugar (para mostrar tren u otra ubicación)
    if (lugarIncidencia) {
        lugarIncidencia.addEventListener('change', (e) => {
            actualizarCamposLugarIncidencia(e.target.value);
        });
    }

    if (lugarSugerencia) {
        lugarSugerencia.addEventListener('change', (e) => {
            actualizarCamposLugarSugerencia(e.target.value);
        });
    }
    
    // Contador de caracteres para descripción corta
    if (descripcionCorta) {
        descripcionCorta.addEventListener('input', (e) => {
            charCount.textContent = e.target.value.length;
        });
    }
    
    // Gestión de archivos adjuntos
    const fileInputs = document.querySelectorAll('.file-input');
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const fileListContainer = input.closest('.file-upload').querySelector('.file-list');
            
            if (fileListContainer) {
                fileListContainer.innerHTML = '';
                files.forEach((file, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <span>📄 ${file.name}</span>
                        <span style="color: var(--color-gray-500); font-size: 0.8125rem;">
                            (${(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button type="button" class="file-item-remove" data-index="${index}" title="Eliminar">✕</button>
                    `;
                    fileListContainer.appendChild(fileItem);
                });
            }
        });
    });
    
    // Eliminar archivos individuales
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('file-item-remove')) {
            const fileItem = e.target.closest('.file-item');
            const fileUpload = e.target.closest('.file-upload');
            const input = fileUpload.querySelector('.file-input');
            
            fileItem.remove();
            
            // Si no quedan archivos, limpiar el input
            const remainingFiles = fileUpload.querySelectorAll('.file-item');
            if (remainingFiles.length === 0) {
                input.value = '';
            }
        }
    });
    
    /**
     * Comprueba si un elemento está oculto en el DOM o dentro de un contenedor oculto.
     * Sirve para implementar la opción A (enviar campos condicionales ocultos como null).
     */
    function esElementoOculto(el) {
        return el.closest('.hidden') !== null || el.offsetParent === null;
    }

    /**
     * Genera el payload estructurado completo listo para su envío (o descarga de prueba)
     * unificando las secciones de datos comunes, representante, envío y values por tipo.
     */
    function generarPayloadFormulario() {
        const tipoHtml = tipoFormulario.value;
        const typeCode = {
            reclamaciones: 'REC',
            consultas: 'CON',
            sugerencias: 'SUG',
            agradecimientos: 'AGR',
            objetos: 'OBJ',
            tarjetas: 'TAR'
        }[tipoHtml] || 'GEN';

        const refCliente = modalReference.textContent || generarReferencia();

        // 1. Obtener datos del solicitante
        const direccionContactoContainer = document.getElementById('direccionContactoContainer');
        const direccionContacto = (direccionContactoContainer && !esElementoOculto(direccionContactoContainer)) ? {
            via: document.getElementById('viaContacto').value || null,
            numero: document.getElementById('numContacto').value || null,
            escalera: document.getElementById('escContacto').value || null,
            piso: document.getElementById('pisoContacto').value || null,
            puerta: document.getElementById('puerContacto').value || null,
            codigoPostal: document.getElementById('cpContacto').value || null,
            municipio: document.getElementById('municipioContacto').value || null,
            provincia: document.getElementById('provinciaContacto').value || null
        } : null;

        // 2. Obtener datos del representante (si aplica y está visible)
        const bloqueRepresentante = document.getElementById('bloqueRepresentante');
        const representative = (bloqueRepresentante && !esElementoOculto(bloqueRepresentante)) ? {
            nombre: document.getElementById('nombreRep').value || null,
            apellidos: document.getElementById('apellidosRep').value || null,
            tipoDocumento: document.getElementById('tipoDocumentoRep').value || null,
            numeroDocumento: document.getElementById('numeroDocumentoRep').value || null,
            email: document.getElementById('emailRep').value || null,
            telefono: document.getElementById('telefonoRep').value || null
        } : null;

        // 3. Obtener respuesta postal
        const recibirPostal = document.getElementById('recibirPostal');
        const postalReplyEnabled = recibirPostal ? recibirPostal.checked : false;
        
        const direccionEnvioSelect = document.getElementById('direccionEnvioSelect');
        const addressMode = (direccionEnvioSelect && !esElementoOculto(direccionEnvioSelect)) ? direccionEnvioSelect.value : 'misma';

        const direccionEnvioContainer = document.getElementById('direccionEnvioContainer');
        const direccionEnvio = (direccionEnvioContainer && !esElementoOculto(direccionEnvioContainer)) ? {
            via: document.getElementById('viaEnvio').value || null,
            numero: document.getElementById('numEnvio').value || null,
            escalera: document.getElementById('escEnvio').value || null,
            piso: document.getElementById('pisoEnvio').value || null,
            puerta: document.getElementById('puerEnvio').value || null,
            codigoPostal: document.getElementById('cpEnvio').value || null,
            municipio: document.getElementById('municipioEnvio').value || null,
            provincia: document.getElementById('provinciaEnvio').value || null
        } : null;

        // 4. Obtener campos específicos del formulario activo (valores dinámicos en 'values')
        const values = {};
        const seccionActiva = secciones[tipoHtml];
        if (seccionActiva) {
            // Obtener inputs, selects y textareas dentro de la sección activa
            const camposEspecificos = seccionActiva.querySelectorAll('input, select, textarea');
            camposEspecificos.forEach(campo => {
                // Ignorar inputs de tipo file (están en attachments) o botones
                if (campo.type === 'file' || campo.type === 'submit' || campo.type === 'button') {
                    return;
                }
                
                // Mapear nombre de campo usando su name o id
                let nombreCampo = campo.name || campo.id;
                
                // Opción A: Si el campo está oculto (su contenedor está oculto), se envía como null
                if (esElementoOculto(campo)) {
                    values[nombreCampo] = null;
                } else {
                    if (campo.type === 'checkbox') {
                        values[nombreCampo] = campo.checked;
                    } else if (campo.type === 'radio') {
                        if (campo.checked) {
                            values[nombreCampo] = campo.value;
                        }
                    } else {
                        values[nombreCampo] = campo.value !== '' ? campo.value : null;
                    }
                }
            });
        }

        // 5. Adjuntos y Firmas en formato estructurado (referenciando el multipart)
        const attachments = [];
        const signatures = [];

        // Archivos adjuntos
        const fileInputs = form.querySelectorAll('.file-input');
        fileInputs.forEach(input => {
            if (esElementoOculto(input)) return;
            const files = input.files;
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    attachments.push({
                        fieldId: input.id,
                        fileName: file.name,
                        contentType: file.type || 'application/octet-stream',
                        sizeBytes: file.size,
                        storageMode: 'multipart',
                        multipartFieldName: `file_${input.id}_${i}`,
                        sha256: "" // Reservado para checksum opcional
                    });
                }
            }
        });

        // Firma (solo para tarjetas si está visible)
        const signatureCanvas = document.getElementById('signature-canvas');
        const signatureData = document.getElementById('signature-data');
        if (signatureData && signatureData.value && !esElementoOculto(signatureCanvas)) {
            signatures.push({
                fieldId: "signature-data",
                contentType: "image/png",
                storageMode: "multipart",
                multipartFieldName: "signature_interesado_0"
            });
        }

        // 6. Consentimientos
        const consents = [];
        const consentimientoCheckbox = document.getElementById('consentimiento');
        if (consentimientoCheckbox && consentimientoCheckbox.checked) {
            consents.push({
                id: "consentimiento",
                accepted: true,
                acceptedAt: new Date().toISOString(),
                textVersion: "lopd-general-2026-06"
            });
        }
        
        const datosCorrectosCheckbox = document.getElementById('datosCorrectos');
        if (datosCorrectosCheckbox && !esElementoOculto(datosCorrectosCheckbox) && datosCorrectosCheckbox.checked) {
            consents.push({
                id: "datosCorrectos",
                accepted: true,
                acceptedAt: new Date().toISOString(),
                textVersion: "declaracion-veracidad-2026-06"
            });
        }

        // Devolver el payload estructurado
        return {
            tipoFormulario: typeCode,
            form: {
                id: "metro-atencion-cliente-unificado",
                version: "1.0.0",
                typeCode: typeCode,
                legacyType: tipoHtml
            },
            submission: {
                id: crypto.randomUUID ? crypto.randomUUID() : 'f' + (Math.random() * 1e16).toString(16),
                submittedAt: new Date().toISOString(),
                source: "wordpress",
                sourceSite: window.location.origin,
                language: "es-ES"
            },
            applicant: {
                nombre: document.getElementById('nombre').value || null,
                apellidos: document.getElementById('apellidos').value || null,
                tipoDocumento: document.getElementById('tipoDocumento').value || null,
                numeroDocumento: document.getElementById('numeroDocumento').value || null,
                email: document.getElementById('email').value || null,
                telefono: document.getElementById('telefono').value || null,
                nacionalidad: document.getElementById('nacionalidad').value || null,
                direccionContacto: direccionContacto
            },
            representative: representative,
            postalReply: {
                enabled: postalReplyEnabled,
                addressMode: addressMode,
                direccionEnvio: direccionEnvio
            },
            values: values,
            signatures: signatures,
            attachments: attachments,
            consents: consents,
            metadata: {
                referenceClientSide: refCliente,
                notes: `Envío automático de prueba - tipo ${typeCode}`
            }
        };
    }

    // Envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Asegurar sincronización de dirección si procede
        if (typeof sincronizarDireccionEnvio === 'function') {
            sincronizarDireccionEnvio();
        }
        
        if (validarFormulario()) {
            console.log('Formulario válido, procesando envío...');
            
            // Establecer referencia visible en el modal
            const referenciaFinal = generarReferencia();
            modalReference.textContent = referenciaFinal;

            // =========================================================================
            // SOLO PARA PRUEBAS Y PROTOTIPADO (NO USAR EN PRODUCCIÓN)
            // =========================================================================
            // Las siguientes líneas de código generan y fuerzan la descarga local
            // de un archivo JSON que contiene el payload completo estructurado. 
            // Esto sirve exclusivamente para validar la coherencia y calidad de los datos.
            // 
            // EN ENTORNO DE PRODUCCIÓN:
            // Este bloque debe eliminarse por completo. En su lugar, el payload unificado
            // junto con los adjuntos y la firma (si existen) se enviará de forma robusta
            // y estandarizada mediante un objeto FormData multipart/form-data haciendo
            // una petición HTTP POST (fetch/AJAX) al endpoint definitivo de la API (Azure Function).
            // =========================================================================
            try {
                const payload = generarPayloadFormulario();
                const jsonString = JSON.stringify(payload, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const linkDescarga = document.createElement('a');
                linkDescarga.href = url;
                linkDescarga.download = `solicitud-${referenciaFinal}.json`;
                document.body.appendChild(linkDescarga);
                linkDescarga.click();
                
                // Limpieza de recursos del DOM
                document.body.removeChild(linkDescarga);
                URL.revokeObjectURL(url);
                
                console.log('JSON de prueba descargado correctamente:', payload);
            } catch (errorDescarga) {
                console.error('Error generando/descargando el JSON de prueba:', errorDescarga);
            }
            // =========================================================================

            // Simular animación de envío antes de abrir el modal de confirmación
            const btnEnviar = document.getElementById('btnEnviar');
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<span class="btn-icon">⏳</span> Enviando...';
            
            setTimeout(() => {
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = '<span class="btn-icon">📤</span> Enviar solicitud';
                mostrarModal();
            }, 1500);
        }
    });
    
    // Botón limpiar
    btnLimpiar.addEventListener('click', () => {
        if (confirm('¿Está seguro de que desea limpiar todos los campos del formulario?')) {
            limpiarFormulario();
        }
    });
    
    // Cerrar modal
    modalClose.addEventListener('click', cerrarModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            cerrarModal();
        }
    });
    
    // Quitar clase error al escribir
    form.addEventListener('input', (e) => {
        if (e.target.classList.contains('error')) {
            e.target.classList.remove('error');
        }
    });
    
    // Validación en tiempo real del email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', (e) => {
            if (e.target.value && !validarEmail(e.target.value)) {
                e.target.classList.add('error');
            } else {
                e.target.classList.remove('error');
            }
        });
    }
    
    // Validación en tiempo real del confirmEmail y bloqueo de paste
    const confirmEmailInput = document.getElementById('confirmEmail');
    if (confirmEmailInput && emailInput) {
        confirmEmailInput.addEventListener('blur', (e) => {
            if (e.target.value && (e.target.value !== emailInput.value || !validarEmail(e.target.value))) {
                e.target.classList.add('error');
            } else {
                e.target.classList.remove('error');
            }
        });

        confirmEmailInput.addEventListener('paste', (e) => {
            e.preventDefault();
        });

        // Al perder el foco el email principal, si ya hay valor en la confirmación, re-validar coincidencia
        emailInput.addEventListener('blur', (e) => {
            if (confirmEmailInput.value) {
                if (confirmEmailInput.value !== e.target.value) {
                    confirmEmailInput.classList.add('error');
                } else {
                    confirmEmailInput.classList.remove('error');
                }
            }
        });
    }
    
    // Preview de foto carnet
    const fotoCarnet = document.getElementById('fotoCarnet');
    const fotoPreview = document.getElementById('fotoPreview');
    if (fotoCarnet && fotoPreview) {
        fotoCarnet.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fotoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 150px; max-height: 200px; border-radius: var(--radius); margin-top: var(--spacing-md);">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Establecer fecha máxima en campos de fecha (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (input.id.includes('Cita')) {
            input.setAttribute('min', today);
        } else if (!input.id.includes('Nacimiento')) {
            input.setAttribute('max', today);
        }
    });

    // ============================================
    // GESTIÓN DINÁMICA DE SECCIÓN CONSULTAS
    // ============================================
    function actualizarSubtipologiasConsulta(tipologiaValue) {
        const subtipologiaConsulta = document.getElementById('subtipologiaConsulta');
        if (!subtipologiaConsulta) return;
        subtipologiaConsulta.innerHTML = '<option value="">Seleccione...</option>';
        
        if (tipologiaValue && subtipologias[tipologiaValue]) {
            subtipologias[tipologiaValue].forEach(opcion => {
                const option = document.createElement('option');
                option.value = opcion.value;
                option.textContent = opcion.text;
                subtipologiaConsulta.appendChild(option);
            });
        }
    }

    const tipologiaConsulta = document.getElementById('tipologiaConsulta');
    if (tipologiaConsulta) {
        tipologiaConsulta.addEventListener('change', (e) => {
            actualizarSubtipologiasConsulta(e.target.value);
        });
    }

    const lugarConsulta = document.getElementById('lugarConsulta');
    const grupoTrenConsulta = document.getElementById('grupoTrenConsulta');
    const trenConsulta = document.getElementById('trenConsulta');
    const grupoOtroLugarConsulta = document.getElementById('grupoOtroLugarConsulta');
    const otroLugarConsulta = document.getElementById('otroLugarConsulta');
    if (lugarConsulta) {
        lugarConsulta.addEventListener('change', (e) => {
            const value = e.target.value;
            if (grupoTrenConsulta && trenConsulta) {
                grupoTrenConsulta.classList.toggle('hidden', value !== 'tren');
                if (value !== 'tren') trenConsulta.value = '';
            }
            if (grupoOtroLugarConsulta && otroLugarConsulta) {
                grupoOtroLugarConsulta.classList.toggle('hidden', value !== 'otro');
                if (value !== 'otro') otroLugarConsulta.value = '';
            }
        });
    }

    const descripcionCortaConsulta = document.getElementById('descripcionCortaConsulta');
    const charCountConsulta = document.getElementById('charCountConsulta');
    if (descripcionCortaConsulta && charCountConsulta) {
        descripcionCortaConsulta.addEventListener('input', (e) => {
            charCountConsulta.textContent = e.target.value.length;
        });
    }



    // ============================================
    // GESTIÓN CONDICIONAL POR TIPO DE TÍTULO (RECLAMACIONES)
    // ============================================
    const dabsPorEstacion = {
        'guadalmedina-l1': ['GDL-DAB-101', 'GDL-DAB-102', 'GDL-DAB-103', 'GDL-DAB-104'],
        'guadalmedina-l2': ['GDL-DAB-101', 'GDL-DAB-102', 'GDL-DAB-103', 'GDL-DAB-104'],
        'atarazanas': ['ATZ-DAB-101', 'ATZ-DAB-102', 'ATZ-DAB-103'],
        'andalucia-tech': ['TCH-DAB-101', 'TCH-DAB-102'],
        'carranque': ['CRR-DAB-101', 'CRR-DAB-102'],
        'barbarela': ['BBL-DAB-101', 'BBL-DAB-102'],
        'el-clinico': ['CLI-DAB-101', 'CLI-DAB-102'],
        'la-union': ['LUN-DAB-101', 'LUN-DAB-102'],
        'universidad': ['UNI-DAB-101', 'UNI-DAB-102'],
        'ciudad-justicia': ['CDJ-DAB-101', 'CDJ-DAB-102', 'CDJ-DAB-201'],
        'el-consul': ['CNS-DAB-101', 'CNS-DAB-102'],
        'el-perchel-l1': ['PCH-DAB-101', 'PCH-DAB-102', 'PCH-DAB-103', 'PCH-DAB-104', 'PCH-DAB-105'],
        'el-perchel-l2': ['PCH-DAB-101', 'PCH-DAB-102', 'PCH-DAB-103', 'PCH-DAB-104', 'PCH-DAB-105'],
        'paraninfo': ['PRF-DAB-101'],
        'portada-alta': ['PTD-DAB-101', 'PTD-DAB-102'],
        'la-luz-la-paz': ['LZP-DAB-101', 'LZP-DAB-102', 'LZP-DAB-201'],
        'la-isla': ['ISL-DAB-101', 'ISL-DAB-102'],
        'puerta-blanca': ['PBL-DAB-101', 'PBL-DAB-102', 'PBL-DAB-201'],
        'princesa-huelin': ['PRI-DAB-101', 'PRI-DAB-102'],
        'el-torcal': ['TOR-DAB-101', 'TOR-DAB-102'],
        'palacio-deportes': ['PDD-DAB-101', 'PDD-DAB-102', 'PDD-DAB-103']
    };

    function resetearBloque(bloque) {
        if (!bloque) return;
        bloque.querySelectorAll('input, select, textarea').forEach(campo => {
            if (campo.type === 'checkbox' || campo.type === 'radio') {
                campo.checked = false;
            } else {
                campo.value = '';
            }
            campo.classList.remove('error');
        });
        bloque.querySelectorAll('.form-grid, .form-group').forEach(subBloque => {
            if (subBloque.id && (
                subBloque.id.startsWith('bloqueOnline') || 
                subBloque.id.startsWith('bloqueMaquina') || 
                subBloque.id.startsWith('bloqueTituloRecargado') || 
                subBloque.id.startsWith('bloqueDabTarjeta') || 
                subBloque.id.startsWith('bloqueTarjetaOtras') ||
                subBloque.id.startsWith('bloqueTituloViajeObjetos') ||
                subBloque.id.startsWith('bloqueTarjetaBancariaObjetos') ||
                subBloque.id.startsWith('bloqueEstacionObjetos') ||
                subBloque.id.startsWith('bloqueTrenObjetos') ||
                subBloque.id.startsWith('bloqueTituloViajeConsulta') ||
                subBloque.id.startsWith('bloqueTarjetaFisicaConsulta') ||
                subBloque.id.startsWith('bloqueTarjetaMovilConsulta')
            )) {
                subBloque.classList.add('hidden');
            }
        });
    }

    function ocultarYResetearTodosLosBloques() {
        const bloques = [
            'bloqueTituloViaje',
            'bloqueEMV',
            'bloqueEMVFisica',
            'bloqueEMVMovil',
            'bloqueABT',
            'bloqueOnline',
            'bloqueMaquina',
            'bloqueTituloRecargado',
            'bloqueDabTarjeta',
            'bloqueDabTarjetaFisica',
            'bloqueDabTarjetaMovil',
            'bloqueTarjetaOtras2',
            'bloqueTarjetaOtras3',
            'bloqueTituloViajeObjetos',
            'bloqueTarjetaBancariaObjetos',
            'bloqueEstacionObjetos',
            'bloqueTrenObjetos',
            'bloqueTituloViajeConsulta',
            'bloqueTarjetaFisicaConsulta',
            'bloqueTarjetaMovilConsulta',
            'grupoEstacionAgradecimiento',
            'grupoTrenAgradecimiento',
            'grupoVariosColectivos',
            'bloqueRepresentante',
            'grupoDatosCorrectosCheck',
            'containerFirmaTarjetas'
        ];
        bloques.forEach(id => {
            const bloque = document.getElementById(id);
            if (bloque) {
                resetearBloque(bloque);
                bloque.classList.add('hidden');
            }
        });
    }

    // Sanitizador PAN: Solo números
    const inputsPan = document.querySelectorAll('.input-pan');
    inputsPan.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });

    // Event Listener Principal para tipo de título
    const tipoTitulo = document.getElementById('tipoTitulo');
    const bloqueTituloViaje = document.getElementById('bloqueTituloViaje');
    const bloqueEMV = document.getElementById('bloqueEMV');
    const bloqueABT = document.getElementById('bloqueABT');

    if (tipoTitulo) {
        tipoTitulo.addEventListener('change', (e) => {
            ocultarYResetearTodosLosBloques();
            const opcion = e.target.value;
            const opcionesTituloViaje = [
                'monedero-metro-malaga',
                'billete-ocasional',
                'masmetro',
                'tarjeta-consorcio',
                'tarjeta-consorcio-joven',
                'tarjeta-consorcio-familia-numerosa'
            ];

            if (opcionesTituloViaje.includes(opcion)) {
                if (bloqueTituloViaje) bloqueTituloViaje.classList.remove('hidden');
            } else if (opcion === 'pago-emv-fisica' || opcion === 'pago-emv-movil') {
                if (bloqueEMV) bloqueEMV.classList.remove('hidden');
                const bloqueEMVFisica = document.getElementById('bloqueEMVFisica');
                const bloqueEMVMovil = document.getElementById('bloqueEMVMovil');
                if (opcion === 'pago-emv-fisica') {
                    if (bloqueEMVFisica) bloqueEMVFisica.classList.remove('hidden');
                } else if (opcion === 'pago-emv-movil') {
                    if (bloqueEMVMovil) bloqueEMVMovil.classList.remove('hidden');
                }
            } else if (opcion === 'metropay') {
                if (bloqueABT) bloqueABT.classList.remove('hidden');
            }
        });
    }

    // Sub-condicionales: Punto de venta o recarga
    const puntoVentaRecarga = document.getElementById('punto_venta_recarga');
    const bloqueOnline = document.getElementById('bloqueOnline');
    const bloqueMaquina = document.getElementById('bloqueMaquina');
    if (puntoVentaRecarga) {
        puntoVentaRecarga.addEventListener('change', (e) => {
            const opcion = e.target.value;
            if (opcion === 'Online') {
                if (bloqueOnline) bloqueOnline.classList.remove('hidden');
                if (bloqueMaquina) {
                    resetearBloque(bloqueMaquina);
                    bloqueMaquina.classList.add('hidden');
                }
            } else if (opcion === 'Maquina') {
                if (bloqueMaquina) bloqueMaquina.classList.remove('hidden');
                if (bloqueOnline) {
                    resetearBloque(bloqueOnline);
                    bloqueOnline.classList.add('hidden');
                }
            } else {
                if (bloqueOnline) {
                    resetearBloque(bloqueOnline);
                    bloqueOnline.classList.add('hidden');
                }
                if (bloqueMaquina) {
                    resetearBloque(bloqueMaquina);
                    bloqueMaquina.classList.add('hidden');
                }
            }
        });
    }

    // Filtrado de DABs por estación
    const estacionSelect = document.getElementById('estacion');
    const numeroDabSelect = document.getElementById('numero_dab');
    if (estacionSelect && numeroDabSelect) {
        estacionSelect.addEventListener('change', (e) => {
            const estacion = e.target.value;
            numeroDabSelect.innerHTML = '<option value="">Seleccione...</option>';
            if (estacion && dabsPorEstacion[estacion]) {
                dabsPorEstacion[estacion].forEach(dab => {
                    const option = document.createElement('option');
                    option.value = dab;
                    option.textContent = dab;
                    numeroDabSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Seleccione primero una estación...";
                numeroDabSelect.appendChild(option);
            }
        });
    }

    // Sub-condicionales de tipo_operacion
    const tipoOperacion = document.getElementById('tipo_operacion');
    const bloqueTituloRecargado = document.getElementById('bloqueTituloRecargado');
    if (tipoOperacion) {
        tipoOperacion.addEventListener('change', (e) => {
            if (e.target.value === 'Recarga') {
                if (bloqueTituloRecargado) bloqueTituloRecargado.classList.remove('hidden');
            } else {
                if (bloqueTituloRecargado) {
                    resetearBloque(bloqueTituloRecargado);
                    bloqueTituloRecargado.classList.add('hidden');
                }
            }
        });
    }

    // Sub-condicionales de modo_pago
    const modoPago = document.getElementById('modo_pago');
    const bloqueDabTarjeta = document.getElementById('bloqueDabTarjeta');
    if (modoPago) {
        modoPago.addEventListener('change', (e) => {
            const opcion = e.target.value;
            if (opcion === 'Tarjeta-fisica' || opcion === 'Tarjeta-movil') {
                if (bloqueDabTarjeta) bloqueDabTarjeta.classList.remove('hidden');
                const bloqueDabTarjetaFisica = document.getElementById('bloqueDabTarjetaFisica');
                const bloqueDabTarjetaMovil = document.getElementById('bloqueDabTarjetaMovil');
                if (opcion === 'Tarjeta-fisica') {
                    if (bloqueDabTarjetaFisica) bloqueDabTarjetaFisica.classList.remove('hidden');
                    if (bloqueDabTarjetaMovil) {
                        resetearBloque(bloqueDabTarjetaMovil);
                        bloqueDabTarjetaMovil.classList.add('hidden');
                    }
                } else {
                    if (bloqueDabTarjetaMovil) bloqueDabTarjetaMovil.classList.remove('hidden');
                    if (bloqueDabTarjetaFisica) {
                        resetearBloque(bloqueDabTarjetaFisica);
                        bloqueDabTarjetaFisica.classList.add('hidden');
                    }
                }
            } else {
                if (bloqueDabTarjeta) {
                    resetearBloque(bloqueDabTarjeta);
                    bloqueDabTarjeta.classList.add('hidden');
                }
            }
        });
    }

    // Sub-condicionales de tipo_tarjeta_bancaria_2 (EMV)
    const tipoTarjetaBancaria2 = document.getElementById('tipo_tarjeta_bancaria_2');
    const bloqueTarjetaOtras2 = document.getElementById('bloqueTarjetaOtras2');
    if (tipoTarjetaBancaria2) {
        tipoTarjetaBancaria2.addEventListener('change', (e) => {
            if (e.target.value === 'Otras') {
                if (bloqueTarjetaOtras2) bloqueTarjetaOtras2.classList.remove('hidden');
            } else {
                if (bloqueTarjetaOtras2) {
                    resetearBloque(bloqueTarjetaOtras2);
                    bloqueTarjetaOtras2.classList.add('hidden');
                }
            }
        });
    }

    // Sub-condicionales de tipo_tarjeta_bancaria_3 (ABT)
    const tipoTarjetaBancaria3 = document.getElementById('tipo_tarjeta_bancaria_3');
    const bloqueTarjetaOtras3 = document.getElementById('bloqueTarjetaOtras3');
    if (tipoTarjetaBancaria3) {
        tipoTarjetaBancaria3.addEventListener('change', (e) => {
            if (e.target.value === 'Otras') {
                if (bloqueTarjetaOtras3) bloqueTarjetaOtras3.classList.remove('hidden');
            } else {
                if (bloqueTarjetaOtras3) {
                    resetearBloque(bloqueTarjetaOtras3);
                    bloqueTarjetaOtras3.classList.add('hidden');
                }
            }
        });
    }

    // ============================================
    // GESTIÓN DINÁMICA DE OBJETOS PERDIDOS
    // ============================================
    const estacionesPorLinea = {
        '1': [
            { value: 'guadalmedina-l1', text: 'Guadalmedina' },
            { value: 'atarazanas', text: 'Atarazanas' },
            { value: 'andalucia-tech', text: 'Andalucía Tech' },
            { value: 'carranque', text: 'Carranque' },
            { value: 'barbarela', text: 'Barbarela' },
            { value: 'el-clinico', text: 'El Clínico' },
            { value: 'la-union', text: 'La Unión' },
            { value: 'universidad', text: 'Universidad' },
            { value: 'ciudad-justicia', text: 'Ciudad de la Justicia' },
            { value: 'el-consul', text: 'El Cónsul' },
            { value: 'el-perchel-l1', text: 'El Perchel' },
            { value: 'paraninfo', text: 'Paraninfo' },
            { value: 'portada-alta', text: 'Portada Alta' }
        ],
        '2': [
            { value: 'guadalmedina-l2', text: 'Guadalmedina' },
            { value: 'la-luz-la-paz', text: 'La Luz - La Paz' },
            { value: 'la-isla', text: 'La Isla' },
            { value: 'el-perchel-l2', text: 'El Perchel' },
            { value: 'puerta-blanca', text: 'Puerta Blanca' },
            { value: 'princesa-huelin', text: 'Princesa - Huelin' },
            { value: 'el-torcal', text: 'El Torcal' },
            { value: 'palacio-deportes', text: 'Palacio de los Deportes' }
        ],
        'ambas': [
            { value: 'guadalmedina-l1', text: 'Guadalmedina' },
            { value: 'atarazanas', text: 'Atarazanas' },
            { value: 'andalucia-tech', text: 'Andalucía Tech' },
            { value: 'carranque', text: 'Carranque' },
            { value: 'barbarela', text: 'Barbarela' },
            { value: 'el-clinico', text: 'El Clínico' },
            { value: 'la-union', text: 'La Unión' },
            { value: 'universidad', text: 'Universidad' },
            { value: 'ciudad-justicia', text: 'Ciudad de la Justicia' },
            { value: 'el-consul', text: 'El Cónsul' },
            { value: 'el-perchel-l1', text: 'El Perchel' },
            { value: 'paraninfo', text: 'Paraninfo' },
            { value: 'portada-alta', text: 'Portada Alta' },
            { value: 'guadalmedina-l2', text: 'Guadalmedina' },
            { value: 'la-luz-la-paz', text: 'La Luz - La Paz' },
            { value: 'la-isla', text: 'La Isla' },
            { value: 'el-perchel-l2', text: 'El Perchel' },
            { value: 'puerta-blanca', text: 'Puerta Blanca' },
            { value: 'princesa-huelin', text: 'Princesa - Huelin' },
            { value: 'el-torcal', text: 'El Torcal' },
            { value: 'palacio-deportes', text: 'Palacio de los Deportes' }
        ]
    };

    // 1. Desplegable tipo de título para Objetos
    const tipoTituloObjetos = document.getElementById('tipoTituloObjetos');
    const bloqueTituloViajeObjetos = document.getElementById('bloqueTituloViajeObjetos');
    const bloqueTarjetaBancariaObjetos = document.getElementById('bloqueTarjetaBancariaObjetos');

    if (tipoTituloObjetos) {
        tipoTituloObjetos.addEventListener('change', (e) => {
            const opcion = e.target.value;
            
            // Ocultar y resetear bloques específicos de Objetos
            if (bloqueTituloViajeObjetos) {
                resetearBloque(bloqueTituloViajeObjetos);
                bloqueTituloViajeObjetos.classList.add('hidden');
            }
            if (bloqueTarjetaBancariaObjetos) {
                resetearBloque(bloqueTarjetaBancariaObjetos);
                bloqueTarjetaBancariaObjetos.classList.add('hidden');
            }

            const opcionesFisicas = [
                'monedero-metro-malaga',
                'billete-ocasional',
                'masmetro',
                'tarjeta-consorcio',
                'tarjeta-consorcio-joven',
                'tarjeta-consorcio-familia-numerosa'
            ];
            const opcionesBancarias = [
                'pago-tarjeta-ocasional',
                'metropay'
            ];

            if (opcionesFisicas.includes(opcion)) {
                if (bloqueTituloViajeObjetos) bloqueTituloViajeObjetos.classList.remove('hidden');
            } else if (opcionesBancarias.includes(opcion)) {
                if (bloqueTarjetaBancariaObjetos) bloqueTarjetaBancariaObjetos.classList.remove('hidden');
            }
        });
    }

    // 1c. Desplegables y campos condicionales para Consulta de Información
    const tipoTituloConsulta = document.getElementById('tipoTituloConsulta');
    const bloqueTituloViajeConsulta = document.getElementById('bloqueTituloViajeConsulta');
    const bloqueTarjetaFisicaConsulta = document.getElementById('bloqueTarjetaFisicaConsulta');
    const bloqueTarjetaMovilConsulta = document.getElementById('bloqueTarjetaMovilConsulta');

    if (tipoTituloConsulta) {
        tipoTituloConsulta.addEventListener('change', (e) => {
            const opcion = e.target.value;

            // Ocultar y resetear los bloques de Consulta
            if (bloqueTituloViajeConsulta) {
                resetearBloque(bloqueTituloViajeConsulta);
                bloqueTituloViajeConsulta.classList.add('hidden');
            }
            if (bloqueTarjetaFisicaConsulta) {
                resetearBloque(bloqueTarjetaFisicaConsulta);
                bloqueTarjetaFisicaConsulta.classList.add('hidden');
            }
            if (bloqueTarjetaMovilConsulta) {
                resetearBloque(bloqueTarjetaMovilConsulta);
                bloqueTarjetaMovilConsulta.classList.add('hidden');
            }

            const opcionesFisicas = [
                'monedero-metro-malaga',
                'billete-ocasional',
                'masmetro',
                'tarjeta-consorcio',
                'tarjeta-consorcio-joven',
                'tarjeta-consorcio-familia-numerosa'
            ];
            
            const opcionesFisicaOBancaria = [
                'pago-emv-fisica',
                'metropay'
            ];

            if (opcionesFisicas.includes(opcion)) {
                if (bloqueTituloViajeConsulta) bloqueTituloViajeConsulta.classList.remove('hidden');
            } else if (opcionesFisicaOBancaria.includes(opcion)) {
                if (bloqueTarjetaFisicaConsulta) bloqueTarjetaFisicaConsulta.classList.remove('hidden');
            } else if (opcion === 'pago-emv-movil') {
                if (bloqueTarjetaMovilConsulta) bloqueTarjetaMovilConsulta.classList.remove('hidden');
            }
            
            comprobarCamposObligatorios();
        });
    }

    // 2. Filtrado dinámico de estaciones por línea
    const lineaMetroObjetos = document.getElementById('lineaMetroObjetos');
    const estacionPerdidaObjetos = document.getElementById('estacionPerdidaObjetos');
    const estacionOrigenObjetos = document.getElementById('estacionOrigenObjetos');
    const estacionDestinoObjetos = document.getElementById('estacionDestinoObjetos');

    function poblarSelectEstaciones(select, lista) {
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione...</option>';
        lista.forEach(estacion => {
            const option = document.createElement('option');
            option.value = estacion.value;
            option.textContent = estacion.text;
            select.appendChild(option);
        });
    }

    function resetearSelectEstaciones(select) {
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione primero una línea...</option>';
    }

    if (lineaMetroObjetos) {
        lineaMetroObjetos.addEventListener('change', (e) => {
            const linea = e.target.value;
            
            // Si cambia la línea, resetear valores seleccionados de ubicación
            if (estacionPerdidaObjetos) {
                estacionPerdidaObjetos.value = '';
                estacionPerdidaObjetos.classList.remove('error');
            }
            if (estacionOrigenObjetos) {
                estacionOrigenObjetos.value = '';
                estacionOrigenObjetos.classList.remove('error');
            }
            if (estacionDestinoObjetos) {
                estacionDestinoObjetos.value = '';
                estacionDestinoObjetos.classList.remove('error');
            }

            if (linea && estacionesPorLinea[linea]) {
                const lista = estacionesPorLinea[linea];
                poblarSelectEstaciones(estacionPerdidaObjetos, lista);
                poblarSelectEstaciones(estacionOrigenObjetos, lista);
                poblarSelectEstaciones(estacionDestinoObjetos, lista);
            } else {
                resetearSelectEstaciones(estacionPerdidaObjetos);
                resetearSelectEstaciones(estacionOrigenObjetos);
                resetearSelectEstaciones(estacionDestinoObjetos);
            }
        });
    }

    // 3. ¿Dónde lo has perdido? (Estación vs Tren vs No lo sé)
    const dondePerdidoObjetos = document.getElementById('dondePerdidoObjetos');
    const bloqueEstacionObjetos = document.getElementById('bloqueEstacionObjetos');
    const bloqueTrenObjetos = document.getElementById('bloqueTrenObjetos');
    const grupoNumeroTrenObjetos = document.getElementById('grupoNumeroTrenObjetos');

    if (dondePerdidoObjetos) {
        dondePerdidoObjetos.addEventListener('change', (e) => {
            const opcion = e.target.value;
            
            if (opcion === 'estacion') {
                if (bloqueEstacionObjetos) bloqueEstacionObjetos.classList.remove('hidden');
                if (bloqueTrenObjetos) {
                    resetearBloque(bloqueTrenObjetos);
                    bloqueTrenObjetos.classList.add('hidden');
                }
            } else if (opcion === 'tren') {
                if (bloqueTrenObjetos) {
                    bloqueTrenObjetos.classList.remove('hidden');
                    if (grupoNumeroTrenObjetos) grupoNumeroTrenObjetos.classList.remove('hidden');
                }
                if (bloqueEstacionObjetos) {
                    resetearBloque(bloqueEstacionObjetos);
                    bloqueEstacionObjetos.classList.add('hidden');
                }
            } else if (opcion === 'desconocido') {
                if (bloqueTrenObjetos) {
                    bloqueTrenObjetos.classList.remove('hidden');
                    if (grupoNumeroTrenObjetos) {
                        const inputTren = grupoNumeroTrenObjetos.querySelector('input');
                        if (inputTren) inputTren.value = '';
                        grupoNumeroTrenObjetos.classList.add('hidden');
                    }
                }
                if (bloqueEstacionObjetos) {
                    resetearBloque(bloqueEstacionObjetos);
                    bloqueEstacionObjetos.classList.add('hidden');
                }
            } else {
                if (bloqueEstacionObjetos) {
                    resetearBloque(bloqueEstacionObjetos);
                    bloqueEstacionObjetos.classList.add('hidden');
                }
                if (bloqueTrenObjetos) {
                    resetearBloque(bloqueTrenObjetos);
                    bloqueTrenObjetos.classList.add('hidden');
                }
            }
        });
    }

    // 4. Gestión de Lugar en Agradecimientos (Estación vs Tren vs OAC)
    const lugarAgradecimiento = document.getElementById('lugarAgradecimiento');
    const grupoEstacionAgradecimiento = document.getElementById('grupoEstacionAgradecimiento');
    const grupoTrenAgradecimiento = document.getElementById('grupoTrenAgradecimiento');

    if (lugarAgradecimiento) {
        lugarAgradecimiento.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'estacion') {
                if (grupoEstacionAgradecimiento) grupoEstacionAgradecimiento.classList.remove('hidden');
                if (grupoTrenAgradecimiento) {
                    resetearBloque(grupoTrenAgradecimiento);
                    grupoTrenAgradecimiento.classList.add('hidden');
                }
            } else if (val === 'tren') {
                if (grupoTrenAgradecimiento) grupoTrenAgradecimiento.classList.remove('hidden');
                if (grupoEstacionAgradecimiento) {
                    resetearBloque(grupoEstacionAgradecimiento);
                    grupoEstacionAgradecimiento.classList.add('hidden');
                }
            } else {
                if (grupoEstacionAgradecimiento) {
                    resetearBloque(grupoEstacionAgradecimiento);
                    grupoEstacionAgradecimiento.classList.add('hidden');
                }
                if (grupoTrenAgradecimiento) {
                    resetearBloque(grupoTrenAgradecimiento);
                    grupoTrenAgradecimiento.classList.add('hidden');
                }
            }
        });
    }

    // 5. Gestión de Destinatario en Agradecimientos (Colectivos varios)
    const dirigidoAgradecimiento = document.getElementById('dirigidoAgradecimiento');
    const grupoVariosColectivos = document.getElementById('grupoVariosColectivos');

    if (dirigidoAgradecimiento) {
        dirigidoAgradecimiento.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'varios') {
                if (grupoVariosColectivos) grupoVariosColectivos.classList.remove('hidden');
            } else {
                if (grupoVariosColectivos) {
                    resetearBloque(grupoVariosColectivos);
                    grupoVariosColectivos.classList.add('hidden');
                }
            }
        });
    }

    // ============================================
    // GESTIÓN DE TARJETAS +METRO Y FIRMA
    // ============================================

    // 1. Visibilidad del representante y la dirección postal
    const solicitudRepresentante = document.getElementById('solicitudRepresentante');
    const bloqueRepresentante = document.getElementById('bloqueRepresentante');
    const recibirPostalNormalContainer = document.getElementById('recibirPostalNormalContainer');
    const recibirPostal = document.getElementById('recibirPostal');
    const direccionContactoContainer = document.getElementById('direccionContactoContainer');

    function actualizarVisibilidadRepresentante() {
        if (!solicitudRepresentante || !bloqueRepresentante) return;

        const esTarjetas = (tipoFormulario.value === 'tarjetas');

        if (esTarjetas && solicitudRepresentante.checked) {
            // Mostrar representante
            bloqueRepresentante.classList.remove('hidden');
        } else {
            // Ocultar representante
            bloqueRepresentante.classList.add('hidden');
        }
        comprobarCamposObligatorios();
    }

    if (solicitudRepresentante) {
        solicitudRepresentante.addEventListener('change', actualizarVisibilidadRepresentante);
    }

    // 1b. Visibilidad y sincronización de la dirección de envío postal
    const grupoDireccionEnvioSelect = document.getElementById('grupoDireccionEnvioSelect');
    const direccionEnvioSelect = document.getElementById('direccionEnvioSelect');
    const direccionEnvioContainer = document.getElementById('direccionEnvioContainer');
    const tituloDireccionContacto = document.getElementById('tituloDireccionContacto');

    function sincronizarDireccionEnvio() {
        const esTarjetas = (tipoFormulario.value === 'tarjetas');
        if (esTarjetas && recibirPostal && recibirPostal.checked && direccionEnvioSelect && direccionEnvioSelect.value === 'misma') {
            const fields = [
                { src: 'viaContacto', dest: 'viaEnvio' },
                { src: 'numContacto', dest: 'numEnvio' },
                { src: 'escContacto', dest: 'escEnvio' },
                { src: 'pisoContacto', dest: 'pisoEnvio' },
                { src: 'puerContacto', dest: 'puerEnvio' },
                { src: 'cpContacto', dest: 'cpEnvio' },
                { src: 'municipioContacto', dest: 'municipioEnvio' },
                { src: 'provinciaContacto', dest: 'provinciaEnvio' }
            ];
            fields.forEach(pair => {
                const srcEl = document.getElementById(pair.src);
                const destEl = document.getElementById(pair.dest);
                if (srcEl && destEl) {
                    destEl.value = srcEl.value;
                }
            });
        }
    }

    function limpiarDireccionEnvio() {
        const fields = ['viaEnvio', 'numEnvio', 'escEnvio', 'pisoEnvio', 'puerEnvio', 'cpEnvio', 'municipioEnvio', 'provinciaEnvio'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.classList.remove('error');
            }
        });
    }

    function actualizarVisibilidadEnvio() {
        if (!recibirPostal || !direccionContactoContainer) return;
        
        const esTarjetas = (tipoFormulario.value === 'tarjetas');

        if (esTarjetas) {
            // Para tarjetas: Dirección de contacto y título "Dirección del interesado" siempre visibles
            direccionContactoContainer.classList.remove('hidden');
            if (tituloDireccionContacto) tituloDireccionContacto.classList.remove('hidden');
            
            if (recibirPostal.checked) {
                // Mostrar selector de dirección de envío
                if (grupoDireccionEnvioSelect) grupoDireccionEnvioSelect.classList.remove('hidden');
                
                if (direccionEnvioSelect && direccionEnvioSelect.value === 'misma') {
                    if (direccionEnvioContainer) direccionEnvioContainer.classList.add('hidden');
                    sincronizarDireccionEnvio();
                } else {
                    if (direccionEnvioContainer) direccionEnvioContainer.classList.remove('hidden');
                }
            } else {
                // Ocultar selector de dirección de envío y campos alternativos
                if (grupoDireccionEnvioSelect) grupoDireccionEnvioSelect.classList.add('hidden');
                if (direccionEnvioContainer) direccionEnvioContainer.classList.add('hidden');
                limpiarDireccionEnvio();
            }
        } else {
            // Para otros formularios: Ocultar selector de dirección de envío, campos alternativos y título
            if (grupoDireccionEnvioSelect) grupoDireccionEnvioSelect.classList.add('hidden');
            if (direccionEnvioContainer) direccionEnvioContainer.classList.add('hidden');
            if (tituloDireccionContacto) tituloDireccionContacto.classList.add('hidden');
            limpiarDireccionEnvio();
            
            // La visibilidad de la dirección de contacto depende del check normal
            direccionContactoContainer.classList.toggle('hidden', !recibirPostal.checked);
        }
        comprobarCamposObligatorios();
    }

    if (recibirPostal) {
        recibirPostal.addEventListener('change', actualizarVisibilidadEnvio);
    }

    if (direccionEnvioSelect) {
        direccionEnvioSelect.addEventListener('change', (e) => {
            if (e.target.value === 'diferente') {
                limpiarDireccionEnvio();
            }
            actualizarVisibilidadEnvio();
        });
    }

    // Escuchar cambios en la dirección del interesado para mantener sincronizada la de envío si corresponde
    const contactFields = ['viaContacto', 'numContacto', 'escContacto', 'pisoContacto', 'puerContacto', 'cpContacto', 'municipioContacto', 'provinciaContacto'];
    contactFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', sincronizarDireccionEnvio);
            el.addEventListener('change', sincronizarDireccionEnvio);
        }
    });

    // 2. Control del estado de la Firma y Checkboxes de Consentimiento
    const datosCorrectos = document.getElementById('datosCorrectos');
    const consentimiento = document.getElementById('consentimiento');
    const containerFirmaTarjetas = document.getElementById('containerFirmaTarjetas');

    function actualizarEstadoFirma() {
        if (!datosCorrectos || !consentimiento || !containerFirmaTarjetas) return;

        const esTarjetas = (tipoFormulario.value === 'tarjetas');

        if (esTarjetas && datosCorrectos.checked && consentimiento.checked) {
            containerFirmaTarjetas.style.opacity = '1';
            containerFirmaTarjetas.style.pointerEvents = 'auto';
        } else {
            // Atenuar y bloquear interacción
            containerFirmaTarjetas.style.opacity = '0.4';
            containerFirmaTarjetas.style.pointerEvents = 'none';
            // Limpiar la firma
            limpiarFirma();
        }
        comprobarCamposObligatorios();
    }

    if (datosCorrectos) {
        datosCorrectos.addEventListener('change', actualizarEstadoFirma);
    }
    if (consentimiento) {
        consentimiento.addEventListener('change', actualizarEstadoFirma);
    }

    // 3. Lógica del Signature Pad (HTML5 Canvas)
    const canvas = document.getElementById('signature-canvas');
    const signatureData = document.getElementById('signature-data');
    const clearSignatureBtn = document.getElementById('clear-signature-btn');

    let drawing = false;

    function limpiarFirma() {
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (signatureData) {
            signatureData.value = '';
        }
        comprobarCamposObligatorios();
    }

    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener('click', limpiarFirma);
    }

    if (canvas && signatureData) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#1e293b'; // Slate 800 (sleek dark gray/black)
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        function getMousePos(canvasDom, e) {
            const rect = canvasDom.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvasDom.width / rect.width),
                y: (clientY - rect.top) * (canvasDom.height / rect.height)
            };
        }

        function startDrawing(e) {
            // Solo permitir firmar si está activado
            if (containerFirmaTarjetas.style.pointerEvents === 'none') return;
            drawing = true;
            const pos = getMousePos(canvas, e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }

        function draw(e) {
            if (!drawing) return;
            const pos = getMousePos(canvas, e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }

        function stopDrawing() {
            if (!drawing) return;
            drawing = false;
            // Guardar firma en hidden input
            signatureData.value = canvas.toDataURL();
            comprobarCamposObligatorios();
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        canvas.addEventListener('touchstart', (e) => {
            if (e.target === canvas) e.preventDefault();
            startDrawing(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (e.target === canvas) e.preventDefault();
            draw(e);
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (e.target === canvas) e.preventDefault();
            stopDrawing();
        }, { passive: false });
    }

    // Contador de caracteres dinámico para campos de descripción (textarea)
    const textareas = document.querySelectorAll('textarea.textarea');
    textareas.forEach(textarea => {
        textarea.setAttribute('maxlength', '2500');
        
        // Crear el span del contador
        const counterSpan = document.createElement('span');
        counterSpan.className = 'char-counter';
        counterSpan.style.display = 'block';
        counterSpan.style.textAlign = 'right';
        counterSpan.style.marginTop = '0.25rem';
        counterSpan.style.fontSize = '0.75rem';
        counterSpan.style.color = 'var(--color-gray-500)';
        
        const currentCount = document.createElement('span');
        currentCount.id = 'charCount_' + textarea.id;
        currentCount.textContent = textarea.value.length;
        
        counterSpan.appendChild(currentCount);
        counterSpan.appendChild(document.createTextNode('/2500'));
        
        // Insertar después de la textarea en el DOM
        textarea.parentNode.insertBefore(counterSpan, textarea.nextSibling);
        
        // Escuchar el input para actualizar el valor
        textarea.addEventListener('input', (e) => {
            currentCount.textContent = e.target.value.length;
        });
    });

    // Event listeners para habilitar/deshabilitar botón de enviar dinámicamente
    form.addEventListener('input', comprobarCamposObligatorios);
    form.addEventListener('change', comprobarCamposObligatorios);

    // Ejecución inicial para asegurar el estado correcto del botón
    comprobarCamposObligatorios();
});
