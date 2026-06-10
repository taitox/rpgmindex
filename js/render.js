'use strict';

// ── Core ──────────────────────────────────────────────────

function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function renderAll() {
  document.body.classList.toggle('view-cards', S.view === 'cards');
  syncI18n();
  renderWarningDiv();
  renderAdvancedSearch();
  renderDevPanel();
  renderColumnsMenu();
  updateAdminBar();

  const games = sortGames(filterGames());
  updateResultCount(games.length);

  if (S.view === 'compact') {
    document.getElementById('table-view').style.display = '';
    document.getElementById('cards-view').classList.remove('vis');
    renderTableHeaders();
    renderTable(games);
  } else {
    document.getElementById('table-view').style.display = 'none';
    document.getElementById('cards-view').classList.add('vis');
    renderCards(games);
  }

  refreshOpenModal();
}

// ── i18n ──────────────────────────────────────────────────

function syncI18n() {
  document.querySelectorAll('[data-i18n]')
    .forEach(el => { el.textContent = i(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]')
    .forEach(el => { el.placeholder = i(el.dataset.i18nPh); });

  document.getElementById('columns-button').textContent = `${i('cols')} ▾`;
  document.getElementById('edit-game-version').innerHTML =
    VERSIONS.map(v => `<option value="${v.id}">${v.name || v.label}</option>`).join('');

  const langSel = document.getElementById('lang-select');
  if (langSel) langSel.value = S.lang;

  document.getElementById('theme-light-button').classList.toggle('on', S.theme === 'light');
  document.getElementById('theme-dark-button').classList.toggle('on',  S.theme === 'dark');
  document.getElementById('view-compact').classList.toggle('on', S.view === 'compact');
  document.getElementById('view-cards').classList.toggle('on',   S.view === 'cards');
  document.getElementById('admin-button').classList.toggle('admin-active', S.isAdmin);
}

// ── Warning Div ───────────────────────────────────────────

function renderWarningDiv() {
  const div = document.getElementById('warning-div');
  if (!div) return;
  if (!PENDING_ACTIONS.length) { div.style.display = 'none'; return; }

  div.style.display = '';
  const list = document.getElementById('warning-actions-list');
  if (!list) return;

  if (!S.warningExpanded) { list.style.display = 'none'; return; }
  list.style.display = '';

  list.innerHTML = PENDING_ACTIONS.map(a => {
    const msLeft = Math.max(0, new Date(a.execute_at) - Date.now());
    const mins   = Math.floor(msLeft / 60000);
    const secs   = Math.floor((msLeft % 60000) / 1000);
    const countdown = msLeft > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : i('executing') || '…';
    return `<div class="warning-action" id="wa-${a.id}">
      <span class="warning-desc">${a.description}</span>
      <span class="warning-countdown" id="wc-${a.id}">${countdown}</span>
      <button class="warn-btn warn-ok"   onclick="executePendingAction('${a.id}')">[ok]</button>
      <button class="warn-btn warn-undo" onclick="undoPendingAction('${a.id}')">[undo]</button>
    </div>`;
  }).join('');
}

// Called every second to update countdowns without full re-render.
function tickWarningCountdowns() {
  PENDING_ACTIONS.forEach(a => {
    const el = document.getElementById(`wc-${a.id}`);
    if (!el) return;
    const msLeft = Math.max(0, new Date(a.execute_at) - Date.now());
    const mins   = Math.floor(msLeft / 60000);
    const secs   = Math.floor((msLeft % 60000) / 1000);
    el.textContent = msLeft > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : '…';
  });
}

// ── Advanced Search Panel ─────────────────────────────────

function renderAdvancedSearch() {
  const panel = document.getElementById('advanced-panel');
  const btn   = document.getElementById('advanced-search-button');
  if (!panel || !btn) return;

  panel.classList.toggle('open', S.advancedOpen);

  const count = activeFilterCount();
  btn.textContent = count > 0 ? `${i('advsearch')} · ${count}` : i('advsearch');
  btn.classList.toggle('on', S.advancedOpen || count > 0);

  if (!S.advancedOpen) return;

  document.getElementById('adv-mode-or')?.classList.toggle('on',  S.filters.tagMode === 'or');
  document.getElementById('adv-mode-and')?.classList.toggle('on', S.filters.tagMode === 'and');

  renderAdvancedDropdowns();
  renderAdvancedChips();
}

function renderFilterDropdown({ ddId, lblId, options, selected, toggleFn, emptyKey, summaryFn }) {
  const dd = document.getElementById(ddId);
  const lb = document.getElementById(lblId);
  if (!dd) return;
  dd.innerHTML = options.map(({ value, label }) => {
    const sel = selected.includes(value);
    return `<div class="ms-option ${sel ? 'selected' : ''}" onclick="${toggleFn}('${value}')">
      <span class="ms-check">${sel ? '✓' : ''}</span>${label}
    </div>`;
  }).join('') || `<div class="ms-empty">${i(emptyKey)}</div>`;
  dd.classList.toggle('open', S.openDropdown === ddId);
  if (lb) lb.textContent = summaryFn();
}

function renderTagsDropdown() {
  const dd = document.getElementById('ms-tags-dropdown');
  const lb = document.getElementById('ms-tags-label');
  if (!dd) return;
  dd.innerHTML = TAGS.map(t => {
    const sel = S.filters.tags.includes(t.name);
    return `<div class="ms-option ${sel ? 'selected' : ''}" onclick="toggleTag('${t.name}')">
      <span class="ms-check">${sel ? '✓' : ''}</span>${t.name}
    </div>`;
  }).join('') || `<div class="ms-empty">${i('alltags')}</div>`;
  dd.classList.toggle('open', S.openDropdown === 'ms-tags-dropdown');
  if (lb) lb.textContent = i('filtertags');
}

function renderAdvancedDropdowns() {
  renderFilterDropdown({
    ddId: 'ms-version-dropdown', lblId: 'ms-version-label',
    options:   getVersionsInUse().map(v => ({ value: v.id, label: v.label })),
    selected:  S.filters.versions,
    toggleFn:  'toggleVersion',
    emptyKey:  'allver',
    summaryFn: () => i('filterversions'),
  });
  renderFilterDropdown({
    ddId: 'ms-country-dropdown', lblId: 'ms-country-label',
    options:   getCountriesInUse().map(c => ({ value: c, label: countryWithFlag(c) })),
    selected:  S.filters.countries,
    toggleFn:  'toggleCountry',
    emptyKey:  'allcountries',
    summaryFn: () => S.filters.countries.length
      ? S.filters.countries.map(countryWithFlag).join(', ')
      : i('allcountries'),
  });
  renderTagsDropdown();
}

// Chips order: [COUNTRY] [YEAR] [VERSION] [TAGS]
function renderAdvancedChips() {
  const row = document.getElementById('advanced-chips-row');
  if (!row) return;
  const chips = [
    ...S.filters.countries.map(c =>
      makeChip(countryWithFlag(c), `toggleCountry('${c}')`, 'chip-country')),
    ...S.filters.years.map(y =>
      makeChip(String(y), `toggleYear(${y})`, 'chip-year')),
    ...S.filters.versions.map(vId =>
      makeChip(VERSIONS.find(v => v.id === vId)?.label || vId, `toggleVersion('${vId}')`, 'chip-version')),
    ...S.filters.tags.map(t =>
      makeChip(t, `toggleTag('${t}')`, 'chip-tag')),
  ];
  row.innerHTML = chips.join('');
  row.style.display = chips.length ? 'flex' : 'none';
}

// ── Developer Panel ───────────────────────────────────────

function renderDevPanel() {
  const panel = document.getElementById('dev-panel');
  if (!panel) return;

  if (!S.activeDev) { panel.style.display = 'none'; return; }
  panel.style.display = '';

  // Collect all games attributed to this developer (handles multi-dev strings)
  const devGames  = GAMES.filter(g => splitDev(g.developer).includes(S.activeDev));
  const countries = [...new Set(devGames.map(g => g.country).filter(Boolean))];
  const versions  = [...new Set(devGames.map(g => g.vId).filter(Boolean))];
  const tags      = [...new Set(devGames.flatMap(g => g.tags))];

  panel.innerHTML = `
    <div class="dev-panel-header">
      <div class="dev-panel-name">${S.activeDev}</div>
      <button class="advanced-panel-close" onclick="S.activeDev=null;renderAll()" aria-label="Fechar">✕</button>
    </div>
    <div class="dev-panel-country">${countries.map(countryWithFlag).join(' · ') || '—'}</div>
    <div class="dev-panel-badges badge-wrapper">
      ${versions.map(vId => versionBadge(vId)).join('')}
      ${tags.map(tagBadge).join('')}
    </div>`;
}

// ── Result count ──────────────────────────────────────────

function updateResultCount(n) {
  const el = document.getElementById('results-count');
  const isFiltering = S.filters.search || activeFilterCount() > 0;
  el.textContent = isFiltering ? i('found')(n) : '';
  el.classList.toggle('vis', isFiltering);
}

// ── Columns menu (hidden in cards view) ───────────────────

function renderColumnsMenu() {
  const wrapper = document.getElementById('columns-wrapper-el');
  if (wrapper) wrapper.style.display = S.view === 'cards' ? 'none' : '';

  const labels = { developer: i('dev'), version: i('ver'), year: i('yr'), country: i('country'), tags: i('tags') };
  document.getElementById('columns-menu').innerHTML =
    Object.entries(labels)
      .map(([k, label]) => `<label><input type="checkbox" ${S.cols[k] ? 'checked' : ''} onchange="toggleColumn('${k}')"/> ${label}</label>`)
      .join('');
}

// ── Admin bar ─────────────────────────────────────────────

function updateAdminBar() {
  const bar = document.getElementById('admin-bar');
  bar.style.display = S.isAdmin ? 'flex' : 'none';
  if (S.isAdmin && S.session) setText('admin-email-label', S.session.user.email);
}

// ── Table — new column order: TITLE|DEV|COUNTRY|YEAR|VER|TAGS|DL|ACTIONS ──

function renderTableHeaders() {
  const cols = [
    { id: 'title',     label: i('title'),   cls: 'col-title sortable'  },
    S.cols.developer ? { id: 'developer', label: i('dev'),     cls: 'sortable'    } : null,
    S.cols.country   ? { id: 'country',   label: i('country'), cls: 'sortable'    } : null,
    S.cols.year      ? { id: 'year',      label: i('yr'),      cls: 'sortable'    } : null,
    S.cols.version   ? { id: 'version',   label: i('ver'),     cls: ''            } : null,
    S.cols.tags      ? { id: 'tags',      label: i('tags'),    cls: 'col-tags'    } : null,
    { id: 'download',   label: i('dl'),    cls: 'col-download'  },
    S.isAdmin        ? { id: 'actions',   label: i('actions'), cls: 'col-actions' } : null,
  ].filter(Boolean);

  document.getElementById('table-header-row').innerHTML = cols.map(c => {
    const sortable = c.cls.includes('sortable');
    const active   = S.sort.col === c.id;
    const arrow    = active && S.sort.dir === 'asc' ? '↓' : '↑';
    const sortCls  = active ? (S.sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';
    return `<th class="${c.cls} ${sortCls}" ${sortable ? `onclick="sortBy('${c.id}')"` : ''}>
      ${c.label}${sortable ? `<span class="sort-indicator">${arrow}</span>` : ''}
    </th>`;
  }).join('');
}

function gameRow(g) {
  const esc = s => (s || '').replace(/"/g, '&quot;');
  return `<tr
    data-ss="${g.ss || ''}"
    data-title="${esc(g.title)}"
    onclick="openGameModal('${g.id}')"
    onmouseenter="showTooltip(event, this)"
    onmouseleave="hideTooltip()">
    <td class="col-title">${g.title}</td>
    ${S.cols.developer ? `<td class="col-developer">${devLinks(g.developer)}</td>` : ''}
    ${S.cols.country   ? `<td class="col-country col-search-link" data-search="${esc(g.country)}" onclick="event.stopPropagation();toggleCountry(this.dataset.search)">${countryWithFlag(g.country)}</td>` : ''}
    ${S.cols.year      ? `<td class="col-year col-search-link" data-search="${g.year}" onclick="event.stopPropagation();toggleYear(parseInt(this.dataset.search))">${g.year}</td>` : ''}
    ${S.cols.version   ? `<td><div class="badge-wrapper">${versionBadge(g.vId, true)}</div></td>` : ''}
    ${S.cols.tags      ? `<td class="col-tags"><div class="badge-wrapper">${g.tags.map(tagBadge).join('')}</div></td>` : ''}
    <td class="col-download"><div class="badge-wrapper">${downloadBadge(g)}</div></td>
    ${S.isAdmin ? `<td><div class="action-buttons">${adminBtns(g.id, true)}</div></td>` : ''}
  </tr>`;
}

function renderTable(games) {
  document.getElementById('table-body').innerHTML = games.length
    ? games.map(gameRow).join('')
    : `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum resultado</p></div></td></tr>`;
}

// ── Cards ─────────────────────────────────────────────────

function gameCard(g, idx) {
  const ss      = g.ss ? `<img class="card-screenshot" src="${g.ss}" alt="${g.title}" loading="lazy"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
  const visible = g.tags.slice(0, 4);
  const extra   = g.tags.length - 4;
  const tagHtml = visible.map(tagBadge).join('') +
    (extra > 0 ? `<span class="badge badge-tag" onclick="event.stopPropagation();openGameModal('${g.id}')">${extra}+ tags</span>` : '');

  return `<div class="card" style="animation-delay:${Math.min(idx*25,200)}ms" onclick="openGameModal('${g.id}')">
    ${ss}
    <div class="card-screenshot-fallback" style="${g.ss?'display:none':'display:flex'}" data-i18n="noss"></div>
    <div class="card-body">
      <div class="card-title">${g.title}</div>
      <div class="card-developer">${devLinks(g.developer)}<span class="card-dev-meta"> · ${g.year} · ${countryWithFlag(g.country)}</span></div>
      <div class="card-tags badge-wrapper">${tagHtml}</div>
    </div>
    <div class="card-footer">
      <div class="badge-wrapper">${versionBadge(g.vId)}</div>
      <div style="display:flex;align-items:center;gap:5px">${adminBtns(g.id,true)}${downloadBadge(g)}</div>
    </div>
  </div>`;
}

function renderCards(games) {
  const addBtn = S.isAdmin
    ? `<div class="card-add-button" onclick="openEdit(null)" role="button" tabindex="0">
        <div class="card-add-content"><span class="add-icon">＋</span><span class="add-label" data-i18n="addgame"></span></div>
      </div>` : '';
  document.getElementById('cards-grid').innerHTML = addBtn +
    (games.length ? games.map(gameCard).join('') :
      `<div class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum resultado</p></div>`);
}

// ── Game Detail Modal ─────────────────────────────────────

function openGameModal(gameId) {
  const g = GAMES.find(x => x.id === gameId);
  if (!g) return;
  S.activeModalGameId = gameId;

  const ssImg = document.getElementById('game-detail-screenshot');
  const ssFb  = document.getElementById('game-detail-screenshot-fallback');
  if (g.ss) { ssImg.src = g.ss; ssImg.style.display = 'block'; ssFb.style.display = 'none'; }
  else       { ssImg.style.display = 'none'; ssFb.style.display = 'flex'; ssFb.textContent = i('noss'); }

  setText('game-detail-title', g.title);
  setText('game-detail-id',    `#${g.id}`);
  _renderModalMeta(g);
  _renderModalTags(g);

  document.getElementById('game-detail-footer').innerHTML =
    `<div>${downloadBadge(g)}</div>
     ${S.isAdmin ? `<div class="action-buttons">
       <button class="action-button" onclick="closeModal('game-detail-modal');openEdit('${g.id}')">${i('editgame')} ✏️</button>
       <button class="action-button delete-button" onclick="closeModal('game-detail-modal');delGame('${g.id}')">🗑️</button>
     </div>` : ''}`;

  openModal('game-detail-modal');
}

function _renderModalMeta(g) {
  const esc = s => (s||'').replace(/"/g,'&quot;');
  document.getElementById('game-detail-meta').innerHTML = `
    <div class="game-detail-meta-row">
      <span class="gd-dev">${devLinks(g.developer)}</span>
      <span class="gd-sep">·</span>
      <span class="gd-year col-search-link" data-search="${g.year}"
            onclick="toggleYear(parseInt(this.dataset.search))">${g.year||'—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-country col-search-link" data-search="${esc(g.country)}"
            onclick="toggleCountry(this.dataset.search)">${countryWithFlag(g.country)||'Unknown'}</span>
    </div>`;
}

// Version badge appears first in the tags row (same ordering as chips).
function _renderModalTags(g) {
  document.getElementById('game-detail-tags').innerHTML =
    `<div class="badge-wrapper">${versionBadge(g.vId)}${g.tags.map(tagBadge).join('')}</div>`;
}

function refreshOpenModal() {
  if (!S.activeModalGameId) return;
  if (!document.getElementById('game-detail-modal')?.classList.contains('open')) return;
  const g = GAMES.find(x => x.id === S.activeModalGameId);
  if (!g) return;
  _renderModalMeta(g);
  _renderModalTags(g);
}
