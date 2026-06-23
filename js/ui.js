'use strict';

// ── About / Settings modals ───────────────────────────────

function openAboutModal()    { openModal('about-modal'); }
function openSettingsModal() { renderSettingsPage(); openModal('settings-modal'); }

// ── Search ───────────────────────────────────────────────

var _searchTimer;
function onSearch(value) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() { S.filters.search = value; renderAll(); }, 200);
}

// ── ECB interactions ──────────────────────────────────────

function openAdvancedEcb(name) {
  S.openDropdown = 'ecb-' + name + '-dropdown';
  var input = document.getElementById('ecb-' + name + '-input');
  renderEcbDropdown(name, input ? input.value : '');
}

function filterAdvancedEcb(name, query) {
  S.openDropdown = 'ecb-' + name + '-dropdown';
  renderEcbDropdown(name, query);
}

function _clearEcbInput(name) {
  var input = document.getElementById('ecb-' + name + '-input');
  if (input) input.value = '';
}

// ── Advanced Search Panel ────────────────────────────────

function toggleAdvancedSearch() {
  if (S.advancedOpen) { tryCloseAdvanced(); } else { S.advancedOpen = true; renderAll(); }
}

function tryCloseAdvanced() {
  if (activeFilterCount() > 0) { openModal('confirm-clear-modal'); } else { closeAdvancedPanel(); }
}

function closeAdvancedPanel() {
  S.advancedOpen = false;
  S.openDropdown = null;
  renderAll();
}

function resetAdvancedFilters() {
  S.filters.versions      = [];
  S.filters.countries     = [];
  S.filters.years         = [];
  S.filters.tags          = [];
  S.filters.blacklistTags = [];
  S.filters.fanLangs      = [];
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
  var blackIdx = S.filters.blacklistTags.indexOf(tag);
  if (blackIdx >= 0) S.filters.blacklistTags.splice(blackIdx, 1);
  toggleInArray(S.filters.tags, tag);
  _clearEcbInput('tags');
  S.advancedOpen = true;
  renderAll();
}

function toggleBlacklistTag(tag) {
  var selIdx = S.filters.tags.indexOf(tag);
  if (selIdx >= 0) S.filters.tags.splice(selIdx, 1);
  toggleInArray(S.filters.blacklistTags, tag);
  _clearEcbInput('blacklist');
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

// ── Columns ───────────────────────────────────────────────

function toggleColumn(key) {
  S.cols[key] = !S.cols[key];

  // When hiding a column clear its associated filters
  if (!S.cols[key]) {
    var clearMap = {
      version: function() { S.filters.versions  = []; },
      country: function() { S.filters.countries = []; },
      year:    function() { S.filters.years     = []; },
      fanLang: function() { S.filters.fanLangs  = []; },
    };
    if (clearMap[key]) clearMap[key]();
  }

  try { localStorage.setItem('rpgmkbr-cols', JSON.stringify(S.cols)); } catch (_) {}
  renderAll();
}

// ── View / Sort ───────────────────────────────────────────

function setView(view) {
  S.view = view;
  try { localStorage.setItem('rpgmkbr-view', view); } catch (_) {}
  renderAll();
}

function toggleColumnsMenu() {
  document.getElementById('columns-menu').classList.toggle('open');
}

function sortBy(col) {
  S.sort.dir = (S.sort.col === col && S.sort.dir === 'asc') ? 'desc' : 'asc';
  S.sort.col = col;
  renderAll();
}

var CARD_SORT_MAP = {
  'title':     { col: 'title',     dir: 'asc'  },
  'title-d':   { col: 'title',     dir: 'desc' },
  'year':      { col: 'year',      dir: 'asc'  },
  'year-d':    { col: 'year',      dir: 'desc' },
  'developer': { col: 'developer', dir: 'asc'  },
};
function onCardSort(value) {
  var entry = CARD_SORT_MAP[value];
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
  var list = document.getElementById('warning-actions-list');
  var btn  = document.getElementById('warning-toggle-btn');
  if (list) list.style.display = S.warningExpanded ? '' : 'none';
  if (btn)  btn.textContent    = S.warningExpanded ? '▾' : '▸';
}

// ── Global spinner ────────────────────────────────────────

function showLoading() { var el = document.getElementById('global-spinner'); if (el) el.classList.remove('hidden'); }
function hideLoading() { var el = document.getElementById('global-spinner'); if (el) el.classList.add('hidden');    }

// ── Modals ───────────────────────────────────────────────

function openModal(id)  { var el = document.getElementById(id); if (el) el.classList.add('open');    }
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); }

// ── Password reset ────────────────────────────────────────

async function triggerPasswordReset() {
  var email = S.session && S.session.user ? S.session.user.email : null;
  if (!email) return;
  await sb.auth.resetPasswordForEmail(email);
  var content = document.getElementById('settings-content');
  if (content) {
    var note = document.createElement('p');
    note.className = 'settings-note';
    note.textContent = i('passwordresetsentto', email);
    content.appendChild(note);
  }
}

// ── Tooltip ──────────────────────────────────────────────

function showTooltip(e, row) {
  if (window.innerWidth < 800) return;
  var ss     = row.dataset.ss    || '';
  var title  = row.dataset.title || '';
  var hasImg = ss !== '';
  document.getElementById('tooltip-image').style.display    = hasImg ? 'block' : 'none';
  document.getElementById('tooltip-fallback').style.display = hasImg ? 'none'  : 'block';
  if (hasImg) document.getElementById('tooltip-image').src  = ss;
  var titleEl = document.getElementById('tooltip-title');
  if (titleEl) titleEl.textContent = title;
  document.getElementById('tooltip').style.display = 'flex';
  _positionTooltip(e);
}

function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }

function _positionTooltip(e) {
  var tt = document.getElementById('tooltip');
  if (tt.style.display !== 'flex') return;
  var W = 224, H = 160;
  var x = e.clientX + 14 + W > window.innerWidth  - 8 ? e.clientX - W - 10 : e.clientX + 14;
  var y = e.clientY + 14 + H > window.innerHeight - 8 ? e.clientY - H - 10 : e.clientY + 14;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

// ── Contact ──────────────────────────────────────────────

function sendContact() {
  var name    = document.getElementById('contact-name').value.trim();
  var email   = document.getElementById('contact-email').value.trim();
  var message = document.getElementById('contact-message').value.trim();
  if (!message) return;
  window.location.href = 'mailto:contact@rpgmkbr.com' +
    '?subject=' + encodeURIComponent('RPGMKBR — Contato') +
    '&body='    + encodeURIComponent('De: ' + name + (email ? ' <' + email + '>' : '') + '\n\n' + message);
  closeModal('contact-modal');
}

// ── Event Listeners ──────────────────────────────────────

document.querySelectorAll('.modal-overlay:not(.no-click-close)').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

document.getElementById('login-password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin();
});

document.addEventListener('click', function(e) {
  var colBtn  = document.getElementById('columns-button');
  var colMenu = document.getElementById('columns-menu');
  if (colBtn && colMenu && !colBtn.contains(e.target) && !colMenu.contains(e.target))
    colMenu.classList.remove('open');

  if (S.openDropdown !== null) {
    var activeWrapper = document.getElementById(S.openDropdown);
    activeWrapper = activeWrapper ? activeWrapper.closest('.ecb-wrapper') : null;
    if (!activeWrapper || !activeWrapper.contains(e.target)) {
      S.openDropdown = null;
      renderAllEcbDropdowns();
    }
  }

  var editMs = document.getElementById('edit-tag-ms');
  var editDd = document.getElementById('edit-tag-dropdown');
  if (editMs && editDd && !editMs.contains(e.target)) editDd.classList.remove('open');
});

document.addEventListener('mousemove', _positionTooltip);
