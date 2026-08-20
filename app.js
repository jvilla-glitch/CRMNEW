/* ══════════════════════════════════════════════════
   LEX MACHINA — Core App Utilities v2.0
══════════════════════════════════════════════════ */

/* ── API HELPERS (Google Apps Script + Google Sheets) ─────────
   IMPORTANTE: pega aquí la URL de tu Web App de Apps Script
   (Deploy > New deployment > Web app), termina en /exec.       */
const API_URL = 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT/exec';

// Convierte '/api/clientes/123' -> '/clientes/123' (el prefijo /api ya no es necesario,
// pero se deja el mismo formato de llamada en todo el resto del código).
function _apiPath(url) {
  return url.replace(/^\/api/, '');
}

async function apiGet(url) {
  const r = await fetch(`${API_URL}?path=${encodeURIComponent(_apiPath(url))}`);
  const j = await r.json().catch(() => ({}));
  if (j && j.error) throw new Error(j.error);
  return j;
}

async function _apiSend(url, method, data) {
  // Content-Type: text/plain evita el preflight OPTIONS que Apps Script no responde.
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ path: _apiPath(url), method, data: data || {} })
  });
  const j = await r.json().catch(() => ({}));
  if (j && j.error) throw new Error(j.error);
  return j;
}

async function apiPost(url, data)  { return _apiSend(url, 'POST', data); }
async function apiPut(url, data)   { return _apiSend(url, 'PUT', data); }
async function apiDelete(url)      { return _apiSend(url, 'DELETE', {}); }

/* ── NORMALIZE RESPONSE ───────────────────────── */
function normalizeResponse(r) {
  if (Array.isArray(r)) return r;
  if (r && Array.isArray(r.data)) return r.data;
  if (r && r.data) return [r.data];
  return [];
}

/* ── DATE HELPERS ─────────────────────────────── */
function parseLocalDate(str) {
  if (!str) return new Date('');
  return new Date(String(str).substring(0, 10) + 'T00:00:00');
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' });
}

function fmtMoney(n) {
  return new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:0 }).format(Number(n) || 0);
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();
}

/* ── DATE CHIP ────────────────────────────────── */
(function() {
  const el = document.getElementById('current-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
})();

/* ── TOAST SYSTEM ─────────────────────────────── */
function toast(msg, type = 'success') {
  const stack = document.querySelector('.toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
  el.innerHTML = `<span style="font-weight:700;font-size:15px;opacity:.7">${icons[type]||'i'}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(4px)'; el.style.transition = '0.2s'; setTimeout(() => el.remove(), 200); }, 3200);
}

/* ── MODAL HELPERS ────────────────────────────── */
function openModal(id)  { const m = document.getElementById(id); if(m){ m.style.display='flex'; m.classList.add('open'); document.body.style.overflow='hidden'; } }
function closeModal(id) { const m = document.getElementById(id); if(m){ m.style.display='none'; m.classList.remove('open'); document.body.style.overflow=''; } }

/* ── CONFIRM DELETE ───────────────────────────── */
function confirmDelete(msg = '¿Eliminar este registro?') {
  return new Promise(resolve => {
    const id = '__confirm_' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'overlay';
    el.style.display = 'flex';
    el.innerHTML = `
      <div class="modal" style="max-width:380px;">
        <div class="modal-head">
          <div>
            <div class="modal-title" style="color:var(--danger)">Confirmar eliminación</div>
            <div class="modal-subtitle">${msg}</div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" onclick="document.getElementById('${id}').remove();Promise.resolve(false)">Cancelar</button>
          <button class="btn btn-danger" id="${id}_ok">Eliminar</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById(id + '_ok').onclick = () => { el.remove(); resolve(true); };
    el.onclick = e => { if(e.target === el) { el.remove(); resolve(false); } };
  });
}

/* ── BADGE HELPER ─────────────────────────────── */
function badge(estatus) {
  const map = {
    activo:     ['badge-success', 'Activo'],
    nuevo:      ['badge-info',    'Nuevo'],
    convertido: ['badge-gold',    'Convertido'],
    inactivo:   ['badge-neutral', 'Inactivo'],
    pagado:     ['badge-success', 'Pagado'],
    parcial:    ['badge-warning', 'Parcial'],
    pendiente:  ['badge-warning', 'Pendiente'],
    vencido:    ['badge-danger',  'Vencido'],
    cancelado:  ['badge-neutral', 'Cancelado'],
    en_proceso: ['badge-info',    'En proceso'],
    cerrado:    ['badge-neutral', 'Cerrado'],
    resuelto:   ['badge-success', 'Resuelto'],
  };
  const [cls, label] = map[estatus] || ['badge-neutral', estatus || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}

/* ── NAV ACTIVE STATE ─────────────────────────── */
(function() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (path === href || (href !== '/' && path.startsWith(href)))) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
})();
