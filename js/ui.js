'use strict';

// ── Search ───────────────────────────────────────────────

let _searchTimer;
function onSearch(value) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => { S.filters.search = value; renderAll(); }, 200);
}

// Sets the search input and triggers a render immediately.
// Used by clicking developer names, years, and country cells.
function searchBy(term) {
  S.filters.search = String(term);
  document.getElementById('search').value = String(term);
  renderAll();
}

// ── Advanced Search Panel ────────────────────────────────

function toggleAdvancedSearch() {
  S.advancedOpen ? tryCloseAdvanced() : (S.advancedOpen = true, renderAll());
}

function tryCloseAdvanced() {
  activeFilterCount() > 0 ? openModal('confirm-clear-modal') : closeAdvancedPanel();
}

function closeAdvancedPanel() {
  S.advancedOpen = false;
  S.openDropdown = null;
  renderAll();
}

// Pure state mutation — no render. Callers decide when to render.
function resetAdvancedFilters() {
  S.filters.versions  = [];
  S.filters.countries = [];
  S.filters.tags      = [];
}

// Public: reset + render. Called by the Clear All button.
function clearAdvancedFilters() { resetAdvancedFilters(); renderAll(); }

// Confirm modal "Return" — dismisses the modal only; panel stays open.
function keepAndClose() { closeModal('confirm-clear-modal'); }

// Confirm modal "Abandon" — clears everything and closes the panel.
function confirmClearClose() {
  resetAdvancedFilters();
  S.advancedOpen = false;
  S.openDropdown = null;
  closeModal('confirm-clear-modal');
  renderAll();
}

// Toggle a multi-select dropdown. ddId is the full element ID.
function toggleDropdown(ddId) {
  S.openDropdown = S.openDropdown === ddId ? null : ddId;
  renderAdvancedDropdowns();
}

// ── Filter toggles ───────────────────────────────────────

function toggleVersion(vId) {
  toggleInArray(S.filters.versions, vId);
  S.advancedOpen = true;
  renderAll();
}

function toggleCountry(country) {
  toggleInArray(S.filters.countries, country);
  renderAll();
}

// All tags are uniform — no special Free routing.
function toggleTag(tag) {
  toggleInArray(S.filters.tags, tag);
  S.advancedOpen = true;
  renderAll();
}

function setTagMode(mode) { S.filters.tagMode = mode; renderAll(); }

function clearFilters() {
  S.filters.search = '';
  document.getElementById('search').value = '';
  resetAdvancedFilters();
  renderAll();
}

// ── Sort ─────────────────────────────────────────────────

function sortBy(col) {
  S.sort.dir = S.sort.col === col && S.sort.dir === 'asc' ? 'desc' : 'asc';
  S.sort.col = col;
  renderAll();
}

const CARD_SORT_MAP = {
  'title':     { col: 'title',     dir: 'asc'  },
  'title-d':   { col: 'title',     dir: 'desc' },
  'year':      { col: 'year',      dir: 'asc'  },
  'year-d':    { col: 'year',      dir: 'desc' },
  'developer': { col: 'developer', dir: 'asc'  },
};
function onCardSort(value) {
  const entry = CARD_SORT_MAP[value];
  if (entry) { S.sort.col = entry.col; S.sort.dir = entry.dir; renderAll(); }
}

// ── View / Columns ───────────────────────────────────────

function setView(view) {
  S.view = view;
  try { localStorage.setItem('rpgmkbr-view', view); } catch (_) {}
  renderAll();
}

function toggleColumn(key) {
  S.cols[key] = !S.cols[key];
  try { localStorage.setItem('rpgmkbr-cols', JSON.stringify(S.cols)); } catch (_) {}
  renderAll();
}

function toggleColumnsMenu() {
  document.getElementById('columns-menu').classList.toggle('open');
}

// ── Theme / Lang ─────────────────────────────────────────

function setTheme(theme) {
  S.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('rpgmkbr-theme', theme); } catch (_) {}
  syncI18n();
}

function setLang(lang) {
  S.lang = lang;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  try { localStorage.setItem('rpgmkbr-lang', lang); } catch (_) {}
  renderAll();
}

// ── Modals ───────────────────────────────────────────────

function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Tooltip ──────────────────────────────────────────────

function showTooltip(e, row) {
  if (window.innerWidth < 800) return;
  const ss    = row.dataset.ss || '';
  const title = row.dataset.title || '';
  const hasImg = ss !== '';

  document.getElementById('tooltip-image').style.display    = hasImg ? 'block' : 'none';
  document.getElementById('tooltip-fallback').style.display = hasImg ? 'none'  : 'block';
  if (hasImg) document.getElementById('tooltip-image').src  = ss;

  const titleEl = document.getElementById('tooltip-title');
  if (titleEl) titleEl.textContent = title;

  document.getElementById('tooltip').style.display = 'flex';
  _positionTooltip(e);
}

function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }

function _positionTooltip(e) {
  const tt = document.getElementById('tooltip');
  if (tt.style.display !== 'flex') return;
  const W = 224, H = 160;
  const x = e.clientX + 14 + W > window.innerWidth  - 8 ? e.clientX - W - 10 : e.clientX + 14;
  const y = e.clientY + 14 + H > window.innerHeight - 8 ? e.clientY - H - 10 : e.clientY + 14;
  tt.style.left = `${x}px`;
  tt.style.top  = `${y}px`;
}

// ── Contact ──────────────────────────────────────────────

function sendContact() {
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!message) return;
  const subject = encodeURIComponent('RPGMKBR — Contato');
  const body    = encodeURIComponent(`De: ${name}${email ? ` <${email}>` : ''}\n\n${message}`);
  window.location.href = `mailto:contact@rpgmkbr.com?subject=${subject}&body=${body}`;
  closeModal('contact-modal');
}

// ── Event Listeners ──────────────────────────────────────

document.querySelectorAll('.modal-overlay:not(.no-click-close)').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

document.getElementById('login-password')
  .addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

document.addEventListener('click', e => {
  const colBtn  = document.getElementById('columns-button');
  const colMenu = document.getElementById('columns-menu');
  if (colBtn && colMenu && !colBtn.contains(e.target) && !colMenu.contains(e.target)) {
    colMenu.classList.remove('open');
  }
  if (S.openDropdown !== null) {
    const panel = document.getElementById('advanced-panel');
    if (panel && !panel.contains(e.target)) {
      S.openDropdown = null;
      renderAdvancedDropdowns();
    }
  }
  const editMs = document.getElementById('edit-tag-ms');
  const editDd = document.getElementById('edit-tag-dropdown');
  if (editMs && editDd && !editMs.contains(e.target)) editDd.classList.remove('open');
});

document.addEventListener('mousemove', _positionTooltip);
