'use strict';

// ── Search ───────────────────────────────────────────────

let _searchTimer;
function onSearch(value) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => { S.filters.search = value; renderAll(); }, 200);
}

// ── Advanced Search Panel ────────────────────────────────

function toggleAdvancedSearch() {
  S.advancedOpen ? tryCloseAdvanced() : (S.advancedOpen = true, renderAll());
}

function tryCloseAdvanced() {
  activeFilterCount() > 0 ? openModal('confirm-clear-modal') : closeAdvancedPanel();
}

function closeAdvancedPanel() {
  S.advancedOpen  = false;
  S.openDropdown  = null;
  renderAll();
}

// Pure state mutation — no render. Callers decide when to render.
function resetAdvancedFilters() {
  S.filters.versions  = [];
  S.filters.countries = [];
  S.filters.freeOnly  = false;
  S.filters.tags      = [];
}

// Public action: reset + render. Called by the Clear All button in the panel.
function clearAdvancedFilters() {
  resetAdvancedFilters();
  renderAll();
}

// Called by the confirm-clear modal "Clear" button.
function confirmClearClose() {
  resetAdvancedFilters();
  S.advancedOpen = false;
  S.openDropdown = null;
  closeModal('confirm-clear-modal');
  renderAll();
}

// Called by the confirm-clear modal "Keep" button.
function keepAndClose() {
  S.advancedOpen = false;
  S.openDropdown = null;
  closeModal('confirm-clear-modal');
  renderAll();
}

// Toggle a multi-select dropdown open/closed. ddId is the full element ID.
function toggleDropdown(ddId) {
  S.openDropdown = S.openDropdown === ddId ? null : ddId;
  renderAdvancedDropdowns();
}

// ── Filter toggles ───────────────────────────────────────

function toggleFreeOnly() { S.filters.freeOnly = !S.filters.freeOnly; renderAll(); }

function toggleVersion(vId)    { toggleInArray(S.filters.versions,  vId);     renderAll(); }
function toggleCountry(country){ toggleInArray(S.filters.countries, country); renderAll(); }

function toggleTag(tag) {
  // 'Free' always routes to freeOnly for consistent filter behaviour
  if (tag === 'Free') { toggleFreeOnly(); return; }
  toggleInArray(S.filters.tags, tag);
  renderAll();
}

function setTagMode(mode) { S.filters.tagMode = mode; renderAll(); }

// Clears everything including the search input.
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

function showTooltip(e, ss) {
  if (window.innerWidth < 800) return;
  const hasImg = ss && ss !== 'null' && ss !== '';
  document.getElementById('tooltip-image').style.display    = hasImg ? 'block' : 'none';
  document.getElementById('tooltip-fallback').style.display = hasImg ? 'none'  : 'block';
  if (hasImg) document.getElementById('tooltip-image').src  = ss;
  document.getElementById('tooltip').style.display = 'flex';
  _positionTooltip(e);
}

function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }

function _positionTooltip(e) {
  const tt = document.getElementById('tooltip');
  if (tt.style.display !== 'flex') return;
  const W = 224, H = 140;
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

// Standard modals close on overlay click. confirm-clear has .no-click-close so it's excluded.
document.querySelectorAll('.modal-overlay:not(.no-click-close)').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

document.getElementById('login-password')
  .addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

document.addEventListener('click', e => {
  // Close columns menu
  const colBtn  = document.getElementById('columns-button');
  const colMenu = document.getElementById('columns-menu');
  if (colBtn && colMenu && !colBtn.contains(e.target) && !colMenu.contains(e.target)) {
    colMenu.classList.remove('open');
  }

  // Close advanced search dropdowns
  if (S.openDropdown !== null) {
    const panel = document.getElementById('advanced-panel');
    if (panel && !panel.contains(e.target)) {
      S.openDropdown = null;
      renderAdvancedDropdowns();
    }
  }

  // Close edit tag dropdown
  const editMs = document.getElementById('edit-tag-ms');
  const editDd = document.getElementById('edit-tag-dropdown');
  if (editMs && editDd && !editMs.contains(e.target)) editDd.classList.remove('open');
});

document.addEventListener('mousemove', _positionTooltip);
