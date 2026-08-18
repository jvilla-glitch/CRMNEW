/* =========================================================
   SISTEMA DE GESTIÓN DE DESPACHO — Frontend
   Consume la API de Apps Script (ver config.js para la URL).
   ========================================================= */

const ESTADOS_COLOR = {
  pendiente: 'badge-amber',
  cumplido: 'badge-green',
  pagado: 'badge-green',
  realizada: 'badge-green',
  vencido: 'badge-burgundy',
  cancelada: 'badge-gray',
  activo: 'badge-green',
  concluido: 'badge-gray'
};

const MODULES = {
  Expedientes: {
    label: 'Expedientes',
    columns: ['numero_interno', 'materia', 'fuero', 'estado', 'fecha_apertura'],
    fields: [
      { key: 'numero_interno', label: 'Número interno', type: 'text', required: true, placeholder: 'Ej. 014/2026' },
      { key: 'cliente_id', label: 'Cliente', type: 'ref', refSheet: 'Clientes', refLabel: 'nombre' },
      { key: 'contraparte', label: 'Contraparte', type: 'text', checkConflict: true },
      { key: 'materia', label: 'Materia', type: 'select', options: ['civil', 'mercantil', 'penal', 'laboral', 'familiar', 'administrativo'] },
      { key: 'fuero', label: 'Fuero', type: 'select', options: ['local', 'federal'] },
      { key: 'juzgado', label: 'Juzgado / Tribunal', type: 'text' },
      { key: 'numero_causa', label: 'Número de causa / toca', type: 'text' },
      { key: 'estado', label: 'Estado', type: 'select', options: ['activo', 'suspendido', 'concluido', 'en apelación', 'en amparo'] },
      { key: 'fecha_apertura', label: 'Fecha de apertura', type: 'date' },
      { key: 'notas', label: 'Notas', type: 'textarea' }
    ]
  },
  Plazos: {
    label: 'Plazos',
    columns: ['descripcion', 'fecha_vencimiento', 'estado', 'responsable'],
    badgeColumn: 'fecha_vencimiento',
    fields: [
      { key: 'expediente_id', label: 'Expediente', type: 'ref', refSheet: 'Expedientes', refLabel: 'numero_interno', required: true },
      { key: 'descripcion', label: 'Descripción del plazo', type: 'text', required: true, placeholder: 'Ej. Contestar demanda' },
      { key: 'tipo_termino', label: 'Tipo de término', type: 'select', options: ['habil', 'natural'] },
      { key: 'ambito', label: 'Ámbito', type: 'select', options: ['local', 'federal'] },
      { key: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', computeTrigger: true },
      { key: 'dias', label: 'Días', type: 'number', computeTrigger: true },
      { key: 'fecha_vencimiento', label: 'Fecha de vencimiento (calculada)', type: 'text', readonly: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['pendiente', 'cumplido', 'vencido'] },
      { key: 'responsable', label: 'Responsable', type: 'text' }
    ]
  },
  Agenda: {
    label: 'Agenda',
    columns: ['tipo', 'fecha', 'hora', 'lugar', 'estado'],
    fields: [
      { key: 'expediente_id', label: 'Expediente', type: 'ref', refSheet: 'Expedientes', refLabel: 'numero_interno' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['audiencia', 'junta', 'comparecencia', 'otro'] },
      { key: 'fecha', label: 'Fecha', type: 'date', required: true },
      { key: 'hora', label: 'Hora', type: 'time' },
      { key: 'lugar', label: 'Lugar', type: 'text' },
      { key: 'notas', label: 'Notas', type: 'textarea' },
      { key: 'estado', label: 'Estado', type: 'select', options: ['pendiente', 'realizada', 'cancelada'] }
    ]
  },
  Clientes: {
    label: 'Clientes',
    columns: ['nombre', 'tipo_persona', 'telefono', 'email'],
    fields: [
      { key: 'nombre', label: 'Nombre / Razón social', type: 'text', required: true },
      { key: 'tipo_persona', label: 'Tipo de persona', type: 'select', options: ['física', 'moral'] },
      { key: 'rfc', label: 'RFC', type: 'text' },
      { key: 'telefono', label: 'Teléfono', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'direccion', label: 'Dirección', type: 'textarea' },
      { key: 'notas', label: 'Notas', type: 'textarea' }
    ]
  },
  Documentos: {
    label: 'Documentos',
    columns: ['nombre', 'tipo', 'fecha_subida', 'version'],
    fields: [
      { key: 'expediente_id', label: 'Expediente', type: 'ref', refSheet: 'Expedientes', refLabel: 'numero_interno', required: true },
      { key: 'nombre', label: 'Nombre del documento', type: 'text', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['demanda', 'contestación', 'promoción', 'resolución', 'prueba', 'contrato', 'otro'] },
      { key: 'url', label: 'Enlace (Google Drive)', type: 'text', placeholder: 'https://drive.google.com/...' },
      { key: 'fecha_subida', label: 'Fecha', type: 'date' },
      { key: 'version', label: 'Versión', type: 'text', placeholder: 'v1' }
    ]
  },
  Facturacion: {
    label: 'Facturación',
    columns: ['concepto', 'monto', 'estado_pago', 'fecha'],
    fields: [
      { key: 'expediente_id', label: 'Expediente', type: 'ref', refSheet: 'Expedientes', refLabel: 'numero_interno' },
      { key: 'cliente_id', label: 'Cliente', type: 'ref', refSheet: 'Clientes', refLabel: 'nombre', required: true },
      { key: 'concepto', label: 'Concepto', type: 'text', required: true },
      { key: 'monto', label: 'Monto (MXN)', type: 'number' },
      { key: 'modalidad', label: 'Modalidad', type: 'select', options: ['iguala', 'destajo', 'éxito'] },
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'estado_pago', label: 'Estado de pago', type: 'select', options: ['pendiente', 'pagado'] },
      { key: 'folio_cfdi', label: 'Folio CFDI', type: 'text' }
    ]
  },
  Contrapartes: {
    label: 'Contrapartes',
    columns: ['nombre', 'abogado_contrario'],
    fields: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true },
      { key: 'abogado_contrario', label: 'Abogado contrario', type: 'text' },
      { key: 'notas', label: 'Notas', type: 'textarea' }
    ]
  }
};

let currentModule = 'Expedientes';
let currentRecords = [];
let refCache = {}; // { sheetName: [records] }
let editingId = null;

function apiGet(params) {
  const url = new URL(getApiUrl());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url).then(r => r.json());
}

function apiPost(payload) {
  return fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

async function getRefRecords(sheetName) {
  if (!refCache[sheetName]) {
    const res = await apiGet({ action: 'list', sheet: sheetName });
    refCache[sheetName] = res.ok ? res.data : [];
  }
  return refCache[sheetName];
}

function refDisplay(sheetName, refLabel, id) {
  const list = refCache[sheetName] || [];
  const rec = list.find(r => String(r.id) === String(id));
  return rec ? rec[refLabel] : (id ? `#${id}` : '—');
}

/* ---------- Navegación ---------- */
document.getElementById('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentModule = btn.dataset.module;
  loadModule();
});

async function loadModule() {
  const cfg = MODULES[currentModule];
  document.getElementById('module-eyebrow').textContent = 'Módulo';
  document.getElementById('module-title').textContent = cfg.label;
  document.getElementById('alert-banner').classList.add('hidden');

  // precargar hojas de referencia usadas por este módulo
  const refSheets = new Set(cfg.fields.filter(f => f.type === 'ref').map(f => f.refSheet));
  await Promise.all([...refSheets].map(getRefRecords));

  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('data-table').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');

  const res = await apiGet({ action: 'list', sheet: currentModule });
  currentRecords = res.ok ? res.data : [];

  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('data-table').classList.remove('hidden');
  renderTable();
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - today) / (1000*60*60*24));
}

function badgeForPlazo(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  let cls = 'badge-green';
  if (d < 0) cls = 'badge-burgundy';
  else if (d <= 2) cls = 'badge-burgundy';
  else if (d <= 5) cls = 'badge-amber';
  const label = d < 0 ? `venció hace ${Math.abs(d)}d` : (d === 0 ? 'hoy' : `${d}d`);
  return `<span class="badge ${cls}">${dateStr} · ${label}</span>`;
}

function renderTable() {
  const cfg = MODULES[currentModule];
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');
  head.innerHTML = cfg.columns.map(c => {
    const field = cfg.fields.find(f => f.key === c);
    return `<th>${field ? field.label : c}</th>`;
  }).join('');

  if (currentRecords.length === 0) {
    body.innerHTML = '';
    document.getElementById('empty-state').classList.remove('hidden');
    return;
  }
  document.getElementById('empty-state').classList.add('hidden');

  body.innerHTML = currentRecords.map(rec => {
    const cells = cfg.columns.map(c => {
      const field = cfg.fields.find(f => f.key === c);
      let val = rec[c];
      if (field && field.type === 'ref') {
        val = refDisplay(field.refSheet, field.refLabel, val);
      }
      if (c === cfg.badgeColumn) {
        return `<td>${badgeForPlazo(val)}</td>`;
      }
      if (['estado', 'estado_pago', 'tipo_termino'].includes(c) && val) {
        const cls = ESTADOS_COLOR[val] || 'badge-gray';
        return `<td><span class="badge ${cls}">${val}</span></td>`;
      }
      return `<td>${val === undefined || val === '' ? '—' : val}</td>`;
    }).join('');
    return `<tr data-id="${rec.id}">${cells}</tr>`;
  }).join('');

  body.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const rec = currentRecords.find(r => String(r.id) === tr.dataset.id);
      openModal(rec);
    });
  });
}

/* ---------- Modal / formulario ---------- */
document.getElementById('btn-new').addEventListener('click', () => openModal(null));
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingId = null;
}

async function openModal(record) {
  const cfg = MODULES[currentModule];
  editingId = record ? record.id : null;
  document.getElementById('modal-title').textContent = record ? `Editar — ${cfg.label}` : `Nuevo — ${cfg.label}`;
  document.getElementById('modal-delete').classList.toggle('hidden', !record);

  const form = document.getElementById('modal-form');
  form.innerHTML = '';

  for (const field of cfg.fields) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    wrap.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.innerHTML = '<option value="">—</option>' + field.options.map(o => `<option value="${o}">${o}</option>`).join('');
    } else if (field.type === 'ref') {
      input = document.createElement('select');
      const list = await getRefRecords(field.refSheet);
      input.innerHTML = '<option value="">—</option>' + list.map(r => `<option value="${r.id}">${r[field.refLabel]}</option>`).join('');
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = field.type === 'text' ? 'text' : field.type;
      if (field.placeholder) input.placeholder = field.placeholder;
    }
    input.name = field.key;
    if (field.readonly) input.readOnly = true;
    if (record && record[field.key] !== undefined) input.value = record[field.key];
    wrap.appendChild(input);
    form.appendChild(wrap);

    // Recalcular vencimiento de plazo cuando cambian fecha_inicio, dias, tipo o ambito
    if (currentModule === 'Plazos' && field.computeTrigger) {
      input.addEventListener('change', () => recomputeDeadlinePreview(form));
    }
    if (currentModule === 'Plazos' && (field.key === 'tipo_termino' || field.key === 'ambito')) {
      input.addEventListener('change', () => recomputeDeadlinePreview(form));
    }

    // Verificación de conflicto al capturar la contraparte
    if (field.checkConflict) {
      input.addEventListener('blur', () => runConflictCheck(input.value));
    }
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
}

async function recomputeDeadlinePreview(form) {
  const fi = form.elements['fecha_inicio'] ? form.elements['fecha_inicio'].value : '';
  const dias = form.elements['dias'] ? form.elements['dias'].value : '';
  const tipo = form.elements['tipo_termino'] ? form.elements['tipo_termino'].value : '';
  const ambito = form.elements['ambito'] ? form.elements['ambito'].value : '';
  if (!fi || !dias || !tipo) return;
  const res = await apiGet({ action: 'computeDeadline', fecha_inicio: fi, dias, tipo_termino: tipo, ambito: ambito || 'local' });
  if (res.ok && form.elements['fecha_vencimiento']) {
    form.elements['fecha_vencimiento'].value = res.data.fecha_vencimiento;
  }
}

async function runConflictCheck(nombre) {
  const banner = document.getElementById('alert-banner');
  if (!nombre) { banner.classList.add('hidden'); return; }
  const res = await apiGet({ action: 'checkConflict', nombre });
  if (res.ok && res.data.posibleConflicto) {
    banner.textContent = `⚠ Posible conflicto de interés: "${nombre}" aparece como cliente en otro expediente y como contraparte.`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

document.getElementById('modal-save').addEventListener('click', async () => {
  const cfg = MODULES[currentModule];
  const form = document.getElementById('modal-form');
  const data = {};
  for (const field of cfg.fields) {
    data[field.key] = form.elements[field.key].value;
  }
  const missing = cfg.fields.filter(f => f.required && !data[f.key]);
  if (missing.length) {
    alert('Falta capturar: ' + missing.map(f => f.label).join(', '));
    return;
  }

  const payload = editingId
    ? { action: 'update', sheet: currentModule, id: editingId, data }
    : { action: 'create', sheet: currentModule, data };

  const res = await apiPost(payload);
  if (!res.ok) { alert('Error: ' + res.error); return; }
  closeModal();
  loadModule();
});

document.getElementById('modal-delete').addEventListener('click', async () => {
  if (!editingId) return;
  if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
  const res = await apiPost({ action: 'delete', sheet: currentModule, id: editingId });
  if (!res.ok) { alert('Error: ' + res.error); return; }
  closeModal();
  loadModule();
});

/* ---------- Arranque ---------- */
window.onApiUrlReady = loadModule;
if (getApiUrl()) loadModule();
