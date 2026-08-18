// Guarda la URL del Apps Script Web App en el navegador del usuario.
// No es una base de datos compartida: cada persona que use el sistema
// en su propio navegador debe pegar la misma URL una vez.

const STORAGE_KEY = 'despacho_api_url';

function getApiUrl() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function setApiUrl(url) {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

function clearApiUrl() {
  localStorage.removeItem(STORAGE_KEY);
}

(function initGate() {
  const gate = document.getElementById('config-gate');
  const app = document.getElementById('app');
  const input = document.getElementById('api-url-input');
  const saveBtn = document.getElementById('api-url-save');
  const errorEl = document.getElementById('api-url-error');

  function show() {
    const url = getApiUrl();
    if (url) {
      gate.classList.add('hidden');
      app.classList.remove('hidden');
    } else {
      gate.classList.remove('hidden');
      app.classList.add('hidden');
    }
  }

  saveBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val.startsWith('https://script.google.com/')) {
      errorEl.textContent = 'La URL debe empezar con https://script.google.com/ y terminar en /exec';
      return;
    }
    setApiUrl(val);
    errorEl.textContent = '';
    show();
    if (window.onApiUrlReady) window.onApiUrlReady();
  });

  document.getElementById('reset-config').addEventListener('click', () => {
    clearApiUrl();
    show();
  });

  show();
})();
