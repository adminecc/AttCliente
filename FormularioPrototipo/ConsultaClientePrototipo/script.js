document.addEventListener('DOMContentLoaded', () => {
  const cases = window.SAMPLE_CASES || [];
  let selectedCase = null;

  const searchForm = document.getElementById('searchForm');
  const verificationForm = document.getElementById('verificationForm');
  const caseIdInput = document.getElementById('caseId');
  const personalDataInput = document.getElementById('personalData');
  const verificationSection = document.getElementById('verificationSection');
  const resultSection = document.getElementById('resultSection');
  const messageArea = document.getElementById('messageArea');
  const attachmentsList = document.getElementById('attachmentsList');

  const statusConfig = {
    'En trámite': 'status-progress',
    'Resuelta aceptada': 'status-accepted',
    'Resuelta denegada': 'status-denied',
    'Resuelta gestionada': 'status-managed'
  };

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

  function hideVerification() {
    verificationSection.classList.add('hidden');
    personalDataInput.value = '';
    personalDataInput.classList.remove('error');
  }

  function renderAttachments(attachments) {
    if (!attachments.length) {
      attachmentsList.innerHTML = '<p class="empty-attachments">Este expediente no tiene archivos adjuntos disponibles.</p>';
      return;
    }

    attachmentsList.innerHTML = attachments.map((attachment) => `
      <a class="attachment-link" href="${attachment.url}" target="_blank" rel="noopener noreferrer">
        <span>
          <strong>${attachment.name}</strong>
          <span class="attachment-meta">${attachment.mimeType || 'archivo'} · ${attachment.size || 'tamaño no indicado'}</span>
        </span>
        <span class="attachment-action">Abrir</span>
      </a>
    `).join('');
  }

  function renderCase(caseRecord) {
    const statusClass = statusConfig[caseRecord.status] || 'status-progress';

    document.getElementById('resultCaseId').textContent = caseRecord.caseId;
    document.getElementById('resultStatus').textContent = caseRecord.status;
    document.getElementById('resultStatus').className = `status-badge ${statusClass}`;
    document.getElementById('resultType').textContent = caseRecord.type;
    document.getElementById('resultSubmittedAt').textContent = formatDate(caseRecord.submittedAt);
    document.getElementById('resultUpdatedAt').textContent = formatDate(caseRecord.updatedAt);
    document.getElementById('resultSummary').textContent = caseRecord.resolutionSummary || 'No hay información adicional disponible para este estado.';
    document.getElementById('resultNextStep').textContent = caseRecord.nextStep || '';

    renderAttachments(caseRecord.attachments || []);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showMessage('', '');
    hideResult();
    hideVerification();
    selectedCase = null;

    if (!caseIdInput.value.trim()) {
      caseIdInput.classList.add('error');
      showMessage('error', 'Introduce el identificador de la solicitud para continuar.');
      return;
    }

    caseIdInput.classList.remove('error');
    selectedCase = findCase(caseIdInput.value);

    if (!selectedCase) {
      showMessage('error', 'No se ha encontrado ninguna solicitud con ese identificador.');
      return;
    }

    verificationSection.classList.remove('hidden');
    personalDataInput.focus();
    showMessage('info', 'Solicitud localizada. Confirma ahora un dato personal asociado al caso.');
  });

  verificationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showMessage('', '');
    hideResult();

    if (!selectedCase) {
      showMessage('error', 'Busca primero un identificador de solicitud válido.');
      return;
    }

    if (!personalDataInput.value.trim()) {
      personalDataInput.classList.add('error');
      showMessage('error', 'Introduce el correo electrónico o teléfono asociado a la solicitud.');
      return;
    }

    if (!verifies(selectedCase, personalDataInput.value)) {
      personalDataInput.classList.add('error');
      showMessage('error', 'El dato indicado no coincide con la información registrada para este caso.');
      return;
    }

    personalDataInput.classList.remove('error');
    renderCase(selectedCase);
  });

  caseIdInput.addEventListener('input', () => caseIdInput.classList.remove('error'));
  personalDataInput.addEventListener('input', () => personalDataInput.classList.remove('error'));
});
