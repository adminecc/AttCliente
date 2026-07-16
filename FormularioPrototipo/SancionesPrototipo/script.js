document.addEventListener('DOMContentLoaded', () => {
  const API_CONFIG = {
    endpoint: ''
  };

  const form = document.getElementById('searchForm');
  const expedienteInput = document.getElementById('expediente');
  const dniInput = document.getElementById('dni');
  const searchButton = document.getElementById('searchButton');
  const message = document.getElementById('message');
  const result = document.getElementById('result');
  const payButton = document.getElementById('payButton');

  const PLACE_NAMES = {
    AND: 'Andalucía Tech',
    ATZ: 'Atarazanas',
    BAR: 'Barbarela',
    CDJ: 'Ciudad de la Justicia',
    CLI: 'Clínico',
    CRQ: 'Carranque',
    ELP: 'El Perchel',
    EPC: 'El Perchel',
    GDM: 'Guadalmedina',
    LIS: 'La Isla',
    LUZ: 'La Luz - La Paz',
    PBL: 'Puerta Blanca',
    PDE: 'Palacio de los Deportes',
    PDC: 'Palacio de los Deportes',
    PTA: 'Portada Alta',
    TOR: 'El Torcal',
    UNI: 'La Unión',
    UNV: 'Universidad'
  };

  const normalize = (value) => String(value || '').trim().toUpperCase();
  const normalizeDni = (value) => normalize(value).replace(/[\s-]/g, '');
  const comparablePlace = (value) => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function buildQueryPayload() {
    return {
      Title: normalize(expedienteInput.value),
      DNI: normalizeDni(dniInput.value)
    };
  }

  async function consult(payload) {
    if (!API_CONFIG.endpoint) {
      return (window.SAMPLE_SANCTIONS || []).find((item) => (
        normalize(item.Title) === payload.Title && normalizeDni(item.DNI) === payload.DNI
      ));
    }

    const response = await fetch(API_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.mensaje || body.error || `Error HTTP ${response.status}`);
    return body.encontrado === false ? undefined : (body.sancion || body);
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value || '-';
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return String(value);
    const formatted = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
    return formatted.replace(/,\s*/, ' ');
  }

  function formatAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
      : '-';
  }

  function mapPlace(value) {
    return PLACE_NAMES[comparablePlace(value)] || value || '-';
  }

  function canPay(status) {
    const value = comparablePlace(status);
    return ['PENDIENT', 'IMPAGAD', 'IMPAGO', 'PARCIAL'].some((item) => value.includes(item));
  }

  function render(sanction) {
    setText('resultTitle', sanction.Title);
    setText('resultName', sanction.NombreCliente);
    setText('resultDni', sanction.DNI);
    setText('resultType', sanction.TipoSolicitud);
    setText('resultInfraction', sanction.TipoInfraccion);
    setText('resultNotification', sanction.CodSancion);
    setText('resultReason', sanction.MotivoSancion);
    setText('resultDate', formatDate(sanction.FechaInfraccion));
    setText('resultPlace', mapPlace(sanction.OrigenFraude));
    setText('resultAmount', formatAmount(sanction.Importe));
    setText('resultPaymentStatus', sanction.EstadoDelPago);

    const hasTutor = Boolean(
      String(sanction.NombreTutor || '').trim() || String(sanction.DNITutor || '').trim(),
    );
    const guardianRecord = document.getElementById('guardianRecord');
    const peopleList = document.querySelector('.people-list');
    guardianRecord.hidden = !hasTutor;
    guardianRecord.style.display = hasTutor ? '' : 'none';
    peopleList.classList.toggle('single-person', !hasTutor);
    setText('resultGuardianName', sanction.NombreTutor);
    setText('resultGuardianDni', sanction.DNITutor);

    payButton.hidden = !canPay(sanction.EstadoDelPago);
    result.hidden = false;
  }

  function showMessage(text) {
    message.textContent = text;
    message.hidden = !text;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');
    result.hidden = true;
    expedienteInput.classList.remove('invalid');
    dniInput.classList.remove('invalid');

    const payload = buildQueryPayload();
    if (!/^SAN-\d{4}-[A-Z0-9]{6}$/.test(payload.Title)) {
      expedienteInput.classList.add('invalid');
      showMessage('Introduce un expediente con el formato SAN-2026-XXXXXX.');
      return;
    }
    if (!payload.DNI) {
      dniInput.classList.add('invalid');
      showMessage('Introduce el DNI.');
      return;
    }

    searchButton.disabled = true;
    searchButton.textContent = 'Consultando…';
    try {
      const sanction = await consult(payload);
      if (!sanction) throw new Error('No se ha encontrado una sanción con esos datos.');
      render(sanction);
    } catch (error) {
      showMessage(error.message);
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = 'Consultar';
    }
  });
});
