document.addEventListener('DOMContentLoaded', () => {
  const cases = window.SAMPLE_CASES || [];

  const searchForm = document.getElementById('searchForm');
  const caseIdInput = document.getElementById('caseId');
  const personalDataInput = document.getElementById('personalData');
  const resultSection = document.getElementById('resultSection');
  const messageArea = document.getElementById('messageArea');
  const attachmentsList = document.getElementById('attachmentsList');
  const trackingLine = document.getElementById('trackingLine');

  function normalizeCaseId(value) {
    return String(value || '').trim().toUpperCase();
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizePhone(value) {
    return String(value || '').replace(/[^\d]/g, '').replace(/^0034/, '').replace(/^34/, '');
  }

  function findCase(caseId) {
    const normalizedId = normalizeCaseId(caseId);
    return cases.find((item) => normalizeCaseId(item.caseId) === normalizedId);
  }

  function verifies(caseRecord, value) {
    const inputEmail = normalizeEmail(value);
    const inputPhone = normalizePhone(value);
    const expectedEmail = normalizeEmail(caseRecord.personalData.email);
    const expectedPhone = normalizePhone(caseRecord.personalData.phone);

    return (inputEmail && inputEmail === expectedEmail) || (inputPhone && inputPhone === expectedPhone);
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

  function showMessage(type, text) {
    messageArea.innerHTML = text ? `<div class="message ${type}">${text}</div>` : '';
  }

  function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${value}T00:00:00`));
  }

  function hideResult() {
    resultSection.classList.add('hidden');
    attachmentsList.innerHTML = '';
  }

  function renderAttachments(attachments) {
    if (!attachments.length) {
      attachmentsList.innerHTML = '<p class="empty-attachments">Este expediente no tiene archivos adjuntos disponibles.</p>';
      return;
    }

    attachmentsList.innerHTML = attachments.map((attachment) => {
      const type = getAttachmentType(attachment);

      return `
      <a class="attachment-link" href="${attachment.url}" target="_blank" rel="noopener noreferrer">
        <span class="file-type-badge file-type-${type.key}" aria-hidden="true">${type.label}</span>
        <span>
          <strong>${attachment.name}</strong>
          <span class="attachment-meta">${attachment.size || 'tamaño no indicado'}</span>
        </span>
        <span class="attachment-action">Abrir</span>
      </a>
    `;
    }).join('');
  }

  function renderTracking(status) {
    const isOpen = status === 'En trámite';
    const finalStatus = isOpen ? 'Pendiente de resolución' : status;

    trackingLine.className = `tracking-line ${isOpen ? 'tracking-open' : 'tracking-closed'}`;
    trackingLine.innerHTML = `
      <div class="tracking-step active">
        <span class="tracking-dot" aria-hidden="true"></span>
        <strong>En trámite</strong>
      </div>
      <div class="tracking-step ${isOpen ? 'waiting' : 'active final'}">
        <span class="tracking-dot" aria-hidden="true"></span>
        <strong>${finalStatus}</strong>
      </div>
    `;
  }

  function renderCase(caseRecord) {
    document.getElementById('resultCaseId').textContent = caseRecord.caseId;
    document.getElementById('resultType').textContent = caseRecord.type;
    document.getElementById('resultSubmittedAt').textContent = formatDate(caseRecord.submittedAt);
    document.getElementById('resultUpdatedAt').textContent = formatDate(caseRecord.updatedAt);
    document.getElementById('resultSummary').textContent = caseRecord.resolutionSummary || 'No hay información adicional disponible para este estado.';
    document.getElementById('resultNextStep').textContent = caseRecord.nextStep || '';

    renderTracking(caseRecord.status);
    renderAttachments(caseRecord.attachments || []);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  searchForm.addEventListener('submit', (event) => {
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
      showMessage('error', 'Introduce el correo electrónico o teléfono asociado a la solicitud.');
      return;
    }

    const selectedCase = findCase(caseIdInput.value);

    if (!selectedCase || !verifies(selectedCase, personalDataInput.value)) {
      caseIdInput.classList.add('error');
      personalDataInput.classList.add('error');
      showMessage('error', 'No se ha encontrado una solicitud que coincida con el identificador y el dato de confirmación.');
      return;
    }

    renderCase(selectedCase);
  });

  caseIdInput.addEventListener('input', () => caseIdInput.classList.remove('error'));
  personalDataInput.addEventListener('input', () => personalDataInput.classList.remove('error'));
});
