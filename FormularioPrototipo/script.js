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
        
        // Resetear campos required según la sección
        actualizarCamposRequired(tipo);
        
        // Mostrar u ocultar la opción de respuesta postal según proceda (no aplica a tarjetas)
        const recibirPostal = document.getElementById('recibirPostal');
        const containerRecibirPostal = recibirPostal ? recibirPostal.closest('.form-group') : null;
        if (containerRecibirPostal) {
            containerRecibirPostal.classList.toggle('hidden', tipo === 'tarjetas');
            if (tipo === 'tarjetas') {
                recibirPostal.checked = false;
                const direccionContactoContainer = document.getElementById('direccionContactoContainer');
                if (direccionContactoContainer) direccionContactoContainer.classList.add('hidden');
            }
        }
        
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
        const camposPersonalesRequired = ['tipoDocumento', 'numeroDocumento', 'nombre', 'apellidos', 'email', 'confirmEmail', 'telefono'];
        camposPersonalesRequired.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.setAttribute('required', '');
        });
        
        // Campos específicos por tipo
        const camposEspecificos = {
            reclamaciones: ['clasificacion', 'canalRecepcion', 'fechaIncidencia', 'tipologia', 'lugarIncidencia', 'descripcionCorta', 'descripcionDetallada'],
            consultas: ['descripcionCortaConsulta', 'descripcionDetalladaConsulta'],
            sugerencias: ['areaSugerencia', 'tituloSugerencia', 'descripcionSugerencia'],
            agradecimientos: ['motivoAgradecimiento', 'descripcionAgradecimiento'],
            objetos: ['tipoObjeto', 'categoriaObjeto', 'fechaPerdida', 'descripcionObjeto'],
            tarjetas: ['motivoTarjeta', 'tipoTarjeta', 'fechaNacimiento', 'direccionCompleta', 'codigoPostal', 'municipio', 'provincia', 'puntoRecogida']
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
    function actualizarCamposLugarIncidencia(lugarValue) {
        if (grupoTrenIncidencia && trenIncidencia) {
            grupoTrenIncidencia.classList.toggle('hidden', lugarValue !== 'tren');
            if (lugarValue !== 'tren') trenIncidencia.value = '';
        }

        if (grupoOtroLugarIncidencia && otroLugarIncidencia) {
            grupoOtroLugarIncidencia.classList.toggle('hidden', lugarValue !== 'otro');
            if (lugarValue !== 'otro') otroLugarIncidencia.value = '';
        }
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
        const recibirPostal = document.getElementById('recibirPostal');
        if (recibirPostal) recibirPostal.checked = false;
        const direccionContactoContainer = document.getElementById('direccionContactoContainer');
        if (direccionContactoContainer) direccionContactoContainer.classList.add('hidden');
        const grupoTrenConsulta = document.getElementById('grupoTrenConsulta');
        if (grupoTrenConsulta) grupoTrenConsulta.classList.add('hidden');
        const grupoOtroLugarConsulta = document.getElementById('grupoOtroLugarConsulta');
        if (grupoOtroLugarConsulta) grupoOtroLugarConsulta.classList.add('hidden');
        
        // Limpiar y ocultar bloques condicionales de títulos de viaje
        if (typeof ocultarYResetearTodosLosBloques === 'function') {
            ocultarYResetearTodosLosBloques();
        }

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
    
    // Envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (validarFormulario()) {
            // Aquí iría la lógica de envío real (fetch/AJAX)
            console.log('Formulario válido, enviando...');
            
            // Simular envío
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
        if (!input.id.includes('Nacimiento')) {
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

    // Listener para desplegar Dirección de Contacto al marcar "Deseo recibir respuesta por correo postal"
    const recibirPostal = document.getElementById('recibirPostal');
    const direccionContactoContainer = document.getElementById('direccionContactoContainer');
    if (recibirPostal && direccionContactoContainer) {
        recibirPostal.addEventListener('change', (e) => {
            direccionContactoContainer.classList.toggle('hidden', !e.target.checked);
        });
    }

    // ============================================
    // GESTIÓN CONDICIONAL POR TIPO DE TÍTULO (RECLAMACIONES)
    // ============================================
    const dabsPorEstacion = {
        'guadalmedina-l1': ['DAB-G1-01', 'DAB-G1-02'],
        'guadalmedina-l2': ['DAB-G2-01', 'DAB-G2-02'],
        'atarazanas': ['DAB-AT-01', 'DAB-AT-02', 'DAB-AT-03'],
        'andalucia-tech': ['DAB-AT-04', 'DAB-AT-05'],
        'carranque': ['DAB-CA-01', 'DAB-CA-02'],
        'barbarela': ['DAB-BA-01', 'DAB-BA-02'],
        'el-clinico': ['DAB-EC-01', 'DAB-EC-02'],
        'la-union': ['DAB-LU-01', 'DAB-LU-02'],
        'universidad': ['DAB-UN-01', 'DAB-UN-02'],
        'ciudad-justicia': ['DAB-CJ-01', 'DAB-CJ-02'],
        'el-consul': ['DAB-CO-01', 'DAB-CO-02'],
        'el-perchel-l1': ['DAB-P1-01', 'DAB-P1-02', 'DAB-P1-03'],
        'el-perchel-l2': ['DAB-P2-01', 'DAB-P2-02'],
        'paraninfo': ['DAB-PA-01', 'DAB-PA-02'],
        'portada-alta': ['DAB-PO-01', 'DAB-PO-02'],
        'la-luz-la-paz': ['DAB-LL-01', 'DAB-LL-02'],
        'la-isla': ['DAB-LI-01', 'DAB-LI-02'],
        'puerta-blanca': ['DAB-PB-01', 'DAB-PB-02'],
        'princesa-huelin': ['DAB-PH-01', 'DAB-PH-02'],
        'el-torcal': ['DAB-TO-01', 'DAB-TO-02'],
        'palacio-deportes': ['DAB-PD-01', 'DAB-PD-02']
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
                subBloque.id.startsWith('bloqueTarjetaOtras')
            )) {
                subBloque.classList.add('hidden');
            }
        });
    }

    function ocultarYResetearTodosLosBloques() {
        const bloques = [
            'bloqueTituloViaje',
            'bloqueEMV',
            'bloqueABT',
            'bloqueOnline',
            'bloqueMaquina',
            'bloqueTituloRecargado',
            'bloqueDabTarjeta',
            'bloqueTarjetaOtras2',
            'bloqueTarjetaOtras3',
            'bloqueTituloViajeObjetos',
            'bloqueTarjetaObjetos'
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
            } else if (opcion === 'pago-tarjeta-ocasional') {
                if (bloqueEMV) bloqueEMV.classList.remove('hidden');
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
            if (e.target.value === 'Tarjeta') {
                if (bloqueDabTarjeta) bloqueDabTarjeta.classList.remove('hidden');
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
    // GESTIÓN CONDICIONAL POR TIPO DE TÍTULO (OBJETOS PERDIDOS)
    // ============================================
    const tipoTituloObjetos = document.getElementById('tipoTituloObjetos');
    const bloqueTituloViajeObjetos = document.getElementById('bloqueTituloViajeObjetos');
    const bloqueTarjetaObjetos = document.getElementById('bloqueTarjetaObjetos');

    if (tipoTituloObjetos) {
        tipoTituloObjetos.addEventListener('change', (e) => {
            if (bloqueTituloViajeObjetos) {
                resetearBloque(bloqueTituloViajeObjetos);
                bloqueTituloViajeObjetos.classList.add('hidden');
            }
            if (bloqueTarjetaObjetos) {
                resetearBloque(bloqueTarjetaObjetos);
                bloqueTarjetaObjetos.classList.add('hidden');
            }

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
                if (bloqueTituloViajeObjetos) bloqueTituloViajeObjetos.classList.remove('hidden');
            } else if (opcion === 'pago-tarjeta-ocasional' || opcion === 'metropay') {
                if (bloqueTarjetaObjetos) bloqueTarjetaObjetos.classList.remove('hidden');
            }
        });
    }
});
