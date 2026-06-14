'use strict';

// ── Search ───────────────────────────────────────────────

let _searchTimer;
function onSearch(value) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => { S.filters.search = value; renderAll(); }, 200);
}

// ── ECB interactions (Advanced Search combo boxes) ────────

function openAdvancedEcb(name) {
  S.openDropdown = `ecb-${name}-dropdown`;
  const q = document.getElementById(`ecb-${name}-input`)?.value || '';
  renderEcbDropdown(name, q);
}

function filterAdvancedEcb(name, query) {
  S.openDropdown = `ecb-${name}-dropdown`;
  renderEcbDropdown(name, query);
}

function toggleAdvancedEcb(name) {
  const ddId = `ecb-${name}-dropdown`;
  if (S.openDropdown === ddId) {
    S.openDropdown = null;
    document.getElementById(ddId)?.classList.remove('open');
  } else {
    openAdvancedEcb(name);
  }
}

function _clearEcbInput(name) {
  const input = document.getElementById(`ecb-${name}-input`);
  if (input) input.value = '';
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

function resetAdvancedFilters() {
  S.filters.versions  = [];
  S.filters.countries = [];
  S.filters.years     = [];
  S.filters.tags      = [];
  S.filters.fanLangs  = [];
}

function clearAdvancedFilters() { resetAdvancedFilters(); renderAll(); }
function keepAndClose()         { closeModal('confirm-clear-modal'); }

function confirmClearClose() {
  resetAdvancedFilters();
  S.advancedOpen = false;
  S.openDropdown = null;
  closeModal('confirm-clear-modal');
  renderAll();
}

// ── Filter toggles ───────────────────────────────────────

function toggleVersion(vId) {
  toggleInArray(S.filters.versions, vId);
  _clearEcbInput('version');
  S.advancedOpen = true;
  renderAll();
}

function toggleCountry(country) {
  toggleInArray(S.filters.countries, country);
  _clearEcbInput('country');
  S.advancedOpen = true;
  renderAll();
}

function toggleYear(year) {
  toggleInArray(S.filters.years, year);
  S.advancedOpen = true;
  renderAll();
}

function toggleTag(tag) {
  toggleInArray(S.filters.tags, tag);
  _clearEcbInput('tags');
  S.advancedOpen = true;
  renderAll();
}

function toggleFanLang(lang) {
  toggleInArray(S.filters.fanLangs, lang);
  _clearEcbInput('fanLang');
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

// ── Columns ───────────────────────────────────────────────

function toggleColumn(key) {
  S.cols[key] = !S.cols[key];

  // Clear filters for columns being hidden (avoids invisible active filters)
  if (!S.cols[key]) {
    const clearMap = {
      version: () => S.filters.versions  = [],
      country: () => S.filters.countries = [],
      year:    () => S.filters.years     = [],
      fanLang: () => S.filters.fanLangs  = [],
    };
    clearMap[key]?.();
  }

  try { localStorage.setItem('rpgmkbr-cols', JSON.stringify(S.cols)); } catch (_) {}
  renderAll();
}

// ── Developer Panel ───────────────────────────────────────

function toggleDev(devName) {
  if (S.activeDev === devName) {
    S.activeDev = null;
  } else {
    if (S.activeModalGameId) {
      S.activeModalGameId = null;
      closeModal('game-detail-modal');
    }
    S.activeDev = devName;
  }
  renderAll();
}

// ── View ─────────────────────────────────────────────────

function setView(view) {
  S.view = view;
  try { localStorage.setItem('rpgmkbr-view', view); } catch (_) {}
  renderAll();
}

function toggleColumnsMenu() {
  document.getElementById('columns-menu').classList.toggle('open');
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

// ── Theme / Lang ─────────────────────────────────────────

function toggleTheme() { setTheme(S.theme === 'light' ? 'dark' : 'light'); }

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

// ── Warning div ──────────────────────────────────────────

function toggleWarningExpand() {
  S.warningExpanded = !S.warningExpanded;
  const list = document.getElementById('warning-actions-list');
  const btn  = document.getElementById('warning-toggle-btn');
  if (list) list.style.display = S.warningExpanded ? '' : 'none';
  if (btn)  btn.textContent    = S.warningExpanded ? '▾' : '▸';
}

// ── Global loading spinner ────────────────────────────────

function showLoading() { document.getElementById('global-spinner')?.classList.remove('hidden'); }
function hideLoading() { document.getElementById('global-spinner')?.classList.add('hidden');    }

// ── Modals ───────────────────────────────────────────────

function openModal(id)  { document.getElementById(id)?.classList.add('open');    }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ── Tooltip ──────────────────────────────────────────────

function showTooltip(e, row) {
  if (window.innerWidth < 800) return;
  const ss    = row.dataset.ss    || '';
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
  window.location.href = `mailto:contact@rpgmkbr.com?subject=${encodeURIComponent('RPGMKBR — Contato')}&body=${encodeURIComponent(`De: ${name}${email ? ` <${email}>` : ''}\n\n${message}`)}`;
  closeModal('contact-modal');
}

// ── Event Listeners ──────────────────────────────────────

document.querySelectorAll('.modal-overlay:not(.no-click-close)').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

document.getElementById('login-password')
  .addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

document.addEventListener('click', e => {
  // Close columns menu
  const colBtn  = document.getElementById('columns-button');
  const colMenu = document.getElementById('columns-menu');
  if (colBtn && colMenu && !colBtn.contains(e.target) && !colMenu.contains(e.target))
    colMenu.classList.remove('open');

  // Close Advanced Search ECB dropdowns on outside click
  if (S.openDropdown !== null) {
    const panel = document.getElementById('advanced-panel');
    if (panel && !panel.contains(e.target)) {
      S.openDropdown = null;
      renderAllEcbDropdowns();
    }
  }

  // Close edit tag dropdown
  const editMs = document.getElementById('edit-tag-ms');
  const editDd = document.getElementById('edit-tag-dropdown');
  if (editMs && editDd && !editMs.contains(e.target)) editDd.classList.remove('open');
});

document.addEventListener('mousemove', _positionTooltip);
