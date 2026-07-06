const API_BASE_URL = 'https://metroattfn-e0gucabgedacccey.spaincentral-01.azurewebsites.net';

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const caseIdInput = document.getElementById('caseId');
  const personalDataInput = document.getElementById('personalData');
  const searchButton = document.getElementById('searchButton');
  const resultSection = document.getElementById('resultSection');
  const messageArea = document.getElementById('messageArea');
  const attachmentsList = document.getElementById('attachmentsList');
  const trackingLine = document.getElementById('trackingLine');

  function normalizeCaseId(value) {
    return String(value || '').trim().toUpperCase();
  }

  function showMessage(type, text) {
    messageArea.innerHTML = text ? `<div class="message ${type}">${escapeHtml(text)}</div>` : '';
  }

  function setLoading(isLoading) {
    searchButton.disabled = isLoading;
    searchButton.querySelector('.btn-icon').textContent = isLoading ? '...' : '';
    searchButton.lastChild.textContent = isLoading ? ' Buscando' : ' Buscar';
  }

  function formatDate(value) {
    if (!value) return '-';
    const rawValue = String(value);
    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return value;

    const hasTime = /[T\s]\d{2}:\d{2}/.test(rawValue);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    if (hasTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('es-ES', options).format(date);
  }

  function hideResult() {
    resultSection.classList.add('hidden');
    attachmentsList.innerHTML = '';
  }

  function getAttachmentType(attachment) {
    const value = `${attachment.mimeType || ''} ${attachment.url || ''} ${attachment.name || ''}`.toLowerCase();

    if (value.includes('pdf')) return { key: 'pdf', label: 'PDF' };
    if (value.includes('image') || /\.(png|jpe?g|gif|webp|svg)\b/.test(value)) return { key: 'image', label: 'IMG' };
    if (value.includes('spreadsheet') || /\.(xlsx?|csv)\b/.test(value)) return { key: 'sheet', label: 'XLS' };
    if (value.includes('word') || /\.(docx?|odt|rtf)\b/.test(value)) return { key: 'doc', label: 'DOC' };
    if (value.includes('zip') || /\.(zip|rar|7z)\b/.test(value)) return { key: 'zip', label: 'ZIP' };
    if (value.includes('html') || /\.(html?|xml|json)\b/.test(value)) return { key: 'code', label: 'WEB' };
    if (value.includes('text') || /\.txt\b/.test(value)) return { key: 'text', label: 'TXT' };

    return { key: 'file', label: 'FILE' };
  }

  function renderAttachments(attachments) {
    if (!attachments.length) {
      attachmentsList.innerHTML = '<p class="empty-attachments">Este expediente no tiene archivos adjuntos disponibles.</p>';
      return;
    }

    attachmentsList.innerHTML = attachments.map((attachment) => {
      const type = getAttachmentType(attachment);
      const url = escapeAttribute(attachment.url || '#');

      return `
      <a class="attachment-link" href="${url}" target="_blank" rel="noopener noreferrer">
        <span class="file-type-badge file-type-${type.key}" aria-hidden="true">${type.label}</span>
        <span>
          <strong>${escapeHtml(attachment.name || 'Adjunto')}</strong>
          <span class="attachment-meta">${escapeHtml(attachment.size || 'tamano no indicado')}</span>
        </span>
        <span class="attachment-action">Abrir</span>
      </a>
    `;
    }).join('');
  }

  function renderTracking(status) {
    const normalizedStatus = status || 'En tramite';
    const statusKey = normalizedStatus.toLowerCase();
    const isOpen = statusKey.includes('tram') || statusKey.includes('registr');
    const finalStatus = isOpen ? 'Pendiente de resolucion' : normalizedStatus;

    trackingLine.className = `tracking-line ${isOpen ? 'tracking-open' : 'tracking-closed'}`;
    trackingLine.innerHTML = `
      <div class="tracking-step active">
        <span class="tracking-dot" aria-hidden="true"></span>
        <strong>En tramite</strong>
      </div>
      <div class="tracking-step ${isOpen ? 'waiting' : 'active final'}">
        <span class="tracking-dot" aria-hidden="true"></span>
        <strong>${escapeHtml(finalStatus)}</strong>
      </div>
    `;
  }

  function renderCase(caseRecord) {
    const normalizedCase = normalizeSolicitud(caseRecord);

    document.getElementById('resultCaseId').textContent = normalizedCase.caseId;
    document.getElementById('resultType').textContent = normalizedCase.type;
    document.getElementById('resultSubmittedAt').textContent = formatDate(normalizedCase.submittedAt);
    document.getElementById('resultUpdatedAt').textContent = formatDate(normalizedCase.updatedAt);
    document.getElementById('resultSummary').textContent = normalizedCase.resolutionSummary;
    document.getElementById('resultNextStep').textContent = normalizedCase.nextStep;

    renderTracking(normalizedCase.status);
    renderAttachments(normalizedCase.attachments);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function consultarSolicitud(token, personalData) {
    const payload = buildConsultaPayload(token, personalData);
    const response = await fetch(`${API_BASE_URL}/api/solicitudes/consultar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.encontrado) {
      throw new Error(body.mensaje || body.error || 'No se ha encontrado una solicitud con esos datos.');
    }

    return body.solicitud;
  }

  function buildConsultaPayload(token, personalData) {
    const value = String(personalData || '').trim();
    const payload = { token, personalData: value };

    if (value.includes('@')) {
      payload.email = value;
    } else {
      payload.telefono = value;
    }

    return payload;
  }

  function normalizeSolicitud(solicitud) {
    const timeline = Array.isArray(solicitud.timeline) ? solicitud.timeline : [];
    const status = solicitud.status || solicitud.estado || 'En tramite';
    const submittedAt = solicitud.submittedAt || solicitud.fechaCreacion || timeline[0]?.fecha || '';
    const updatedAt = solicitud.updatedAt || solicitud.fechaModificacionEstadoCliente || timeline[0]?.fecha || submittedAt;
    const responseText = solicitud.resolutionSummary || solicitud.respuestaOrganizacion?.texto || '';

    return {
      caseId: solicitud.caseId || solicitud.token || solicitud.titulo || '-',
      type: normalizeRequestTypeName(solicitud.type || solicitud.tipoFormulario || solicitud.lista || 'Solicitud'),
      status,
      submittedAt,
      updatedAt,
      resolutionSummary: responseText || buildDefaultSummary(status),
      nextStep: solicitud.nextStep || buildNextStep(status, responseText),
      attachments: normalizeAttachments(solicitud.attachments || solicitud.adjuntos || []),
    };
  }

  function normalizeRequestTypeName(value) {
    const normalized = String(value || '').trim();
    const key = normalized.toLowerCase();
    const typeNames = {
      reclamaciones: 'Reclamaciones y quejas',
      reclamacionesquejas: 'Reclamaciones y quejas',
      'reclamaciones y quejas': 'Reclamaciones y quejas',
      consultas: 'Consulta de Información',
      consultainformacion: 'Consulta de Información',
      'consulta de informacion': 'Consulta de Información',
      'consulta de información': 'Consulta de Información',
      sugerencias: 'Sugerencias',
      agradecimientos: 'Agradecimientos y felicitaciones',
      'agradecimientos y felicitaciones': 'Agradecimientos y felicitaciones',
      objetos: 'Objetos perdidos',
      'objetos perdidos': 'Objetos perdidos',
      'objetos perdidos nueva': 'Objetos perdidos',
      tarjetas: 'Solicitud de tarjeta +Metro',
      clientestarjetametro: 'Solicitud de tarjeta +Metro',
      'datos personales para confeccion de tarjetas +metro': 'Solicitud de tarjeta +Metro',
      'datos personales para confección de tarjetas +metro': 'Solicitud de tarjeta +Metro',
      'solicitud de tarjeta +metro': 'Solicitud de tarjeta +Metro',
    };

    return typeNames[key] || normalized || 'Solicitud';
  }

  function normalizeAttachments(attachments) {
    return attachments.map((attachment) => ({
      name: attachment.name || attachment.nombre || 'Adjunto',
      url: attachment.url || attachment.urlDescarga || attachment.webUrl || '#',
      mimeType: attachment.mimeType || attachment.tipo || '',
      size: attachment.size || formatFileSize(attachment.sizeBytes || attachment.tamanioBytes || 0),
    }));
  }

  function buildDefaultSummary(status) {
    const value = String(status || '').toLowerCase();
    if (value.includes('tram') || value.includes('registr')) {
      return 'La solicitud esta registrada y pendiente de revision por el area responsable.';
    }

    return 'La solicitud tiene una actualizacion registrada.';
  }

  function buildNextStep(status, responseText) {
    if (responseText) {
      return 'Revise la informacion de estado indicada por Metro de Malaga.';
    }

    const value = String(status || '').toLowerCase();
    if (value.includes('tram') || value.includes('registr')) {
      return 'Recibira una notificacion cuando se incorpore una respuesta al expediente.';
    }

    return '';
  }

  function formatFileSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('', '');
    hideResult();
    caseIdInput.classList.remove('error');
    personalDataInput.classList.remove('error');

    if (!caseIdInput.value.trim()) {
      caseIdInput.classList.add('error');
      showMessage('error', 'Introduce el identificador de la solicitud para continuar.');
      return;
    }

    if (!personalDataInput.value.trim()) {
      personalDataInput.classList.add('error');
      showMessage('error', 'Introduce el correo electronico o telefono asociado a la solicitud.');
      return;
    }

    try {
      setLoading(true);
      const solicitud = await consultarSolicitud(normalizeCaseId(caseIdInput.value), personalDataInput.value.trim());
      renderCase(solicitud);
    } catch (error) {
      caseIdInput.classList.add('error');
      personalDataInput.classList.add('error');
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  });

  caseIdInput.addEventListener('input', () => caseIdInput.classList.remove('error'));
  personalDataInput.addEventListener('input', () => personalDataInput.classList.remove('error'));
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
