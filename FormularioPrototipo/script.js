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
        const camposPersonalesRequired = ['tipoDocumento', 'numeroDocumento', 'nombre', 'apellidos', 'email'];
        camposPersonalesRequired.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.setAttribute('required', '');
        });
        
        // Campos específicos por tipo
        const camposEspecificos = {
            reclamaciones: ['clasificacion', 'canalRecepcion', 'fechaIncidencia', 'tipologia', 'lugarIncidencia', 'descripcionCorta', 'descripcionDetallada'],
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
            const seccion = campo.closest('.form-section');
            if (seccion && !seccion.classList.contains('hidden')) {
                if (!campo.value.trim()) {
                    campo.classList.add('error');
                    esValido = false;
                    if (!primerError) primerError = campo;
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
        if (email.value && !validarEmail(email.value)) {
            email.classList.add('error');
            esValido = false;
            if (!primerError) primerError = email;
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
        
        // Resetear contador de caracteres
        if (charCount) charCount.textContent = '0';

        // Ocultar campos opcionales de ubicación
        actualizarCamposLugarIncidencia('');
        
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
});
