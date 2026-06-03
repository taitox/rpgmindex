/* jshint esversion: 6 */
'use strict';

let _searchTimer;
function onSearch(value) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => { S.filters.search = value; renderAll(); }, 200);
}

function onVersionChange(value) {
  S.filters.version = value;
  renderAll();
}

function toggleFreeOnly() {
  S.filters.freeOnly = !S.filters.freeOnly;
  renderAll();
}

function toggleTag(tag) {
  const idx = S.filters.tags.indexOf(tag);
  if (idx >= 0) S.filters.tags.splice(idx, 1);
  else          S.filters.tags.push(tag);
  renderAll();
}

function removeTag(tag) {
  toggleTag(tag);
}

function setTagMode(mode) {
  S.filters.tagMode = mode;
  renderAll();
}

function clearFilters() {
  S.filters.search   = '';
  S.filters.version  = '';
  S.filters.freeOnly = false;
  S.filters.tags     = [];
  document.getElementById('search').value  = '';
  document.getElementById('version-select').value = '';
  renderAll();
}

function sortBy(col) {
  S.sort.dir = (S.sort.col === col && S.sort.dir === 'asc') ? 'desc' : 'asc';
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
  if (entry) { S.sort.col = entry.col; S.sort.dir = entry.dir; }
  renderAll();
}

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

document.addEventListener('click', e => {
  const btn  = document.getElementById('columns-button');
  const menu = document.getElementById('columns-menu');
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('open');
  }
});

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

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function sendContact() {
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  if (!message) return;

  const subject  = encodeURIComponent('RPGMKBR — Contato');
  const body     = encodeURIComponent(
    `De: ${name}${email ? ` <${email}>` : ''}\n\n${message}`
  );
  window.location.href = `mailto:contact@rpgmkbr.com?subject=${subject}&body=${body}`;

  closeModal('contact-modal');
}

function showTooltip(e, ss) {
  if (window.innerWidth < 800) return;

  const img = document.getElementById('tooltip-image');
  const fb  = document.getElementById('tooltip-fallback');
  const tt  = document.getElementById('tooltip');

  const hasImage = ss && ss !== 'null' && ss !== '';
  img.style.display = hasImage ? 'block' : 'none';
  fb.style.display  = hasImage ? 'none'  : 'block';
  if (hasImage) img.src = ss;

  tt.style.display = 'flex';
  _positionTooltip(e);
}

function hideTooltip() {
  document.getElementById('tooltip').style.display = 'none';
}

function _positionTooltip(e) {
  const tt = document.getElementById('tooltip');
  if (tt.style.display !== 'flex') return;

  const W = 224, H = 140;
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + W > window.innerWidth  - 8) x = e.clientX - W - 10;
  if (y + H > window.innerHeight - 8) y = e.clientY - H - 10;

  tt.style.left = `${x}px`;
  tt.style.top  = `${y}px`;
}

document.addEventListener('mousemove', _positionTooltip);