'use strict';

// ── Core ──────────────────────────────────────────────────

function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function renderAll() {
  syncI18n();
  renderAdvancedSearch();
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
}

// ── i18n ──────────────────────────────────────────────────
// Static text: data-i18n attribute on the element, key is the attribute value.
// Placeholders: data-i18n-ph attribute.
// Toggle states and dynamic labels are handled below separately.

function syncI18n() {
  document.querySelectorAll('[data-i18n]')
    .forEach(el => { el.textContent = i(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]')
    .forEach(el => { el.placeholder = i(el.dataset.i18nPh); });

  // Special cases not suited for data attributes
  document.getElementById('columns-button').textContent = `${i('cols')} ▾`;
  document.getElementById('edit-game-version').innerHTML =
    VERSIONS.map(v => `<option value="${v.id}">${v.label}</option>`).join('');

  // Toggle button states
  document.getElementById('lang-en-button').classList.toggle('on', S.lang === 'en');
  document.getElementById('lang-pt-button').classList.toggle('on', S.lang === 'pt');
  document.getElementById('theme-light-button').classList.toggle('on', S.theme === 'light');
  document.getElementById('theme-dark-button').classList.toggle('on',  S.theme === 'dark');
  document.getElementById('view-compact').classList.toggle('on', S.view === 'compact');
  document.getElementById('view-cards').classList.toggle('on',   S.view === 'cards');
  document.getElementById('admin-button').classList.toggle('admin-active', S.isAdmin);
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

  document.getElementById('adv-free-button')?.classList.toggle('on', S.filters.freeOnly);
  document.getElementById('adv-mode-or')?.classList.toggle('on',  S.filters.tagMode === 'or');
  document.getElementById('adv-mode-and')?.classList.toggle('on', S.filters.tagMode === 'and');

  renderAdvancedDropdowns();
  renderAdvancedChips();
}

// Renders a standard multi-select dropdown (versions and countries use this).
// cfg: { ddId, lblId, options [{value, label}], selected [], toggleFn, emptyKey, summaryFn }
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

// Tags dropdown has special logic (Free routes to freeOnly) so gets its own renderer.
function renderTagsDropdown() {
  const dd = document.getElementById('ms-tags-dropdown');
  const lb = document.getElementById('ms-tags-label');
  if (!dd) return;
  dd.innerHTML = TAGS.map(t => {
    const isFree = t.name === 'Free';
    const sel  = isFree ? S.filters.freeOnly : S.filters.tags.includes(t.name);
    const fn   = isFree ? 'toggleFreeOnly()' : `toggleTag('${t.name}')`;
    return `<div class="ms-option ${sel ? 'selected' : ''}" onclick="${fn}">
      <span class="ms-check">${sel ? '✓' : ''}</span>${t.name}
    </div>`;
  }).join('') || `<div class="ms-empty">${i('alltags')}</div>`;
  dd.classList.toggle('open', S.openDropdown === 'ms-tags-dropdown');
  if (lb) {
    const active = [...(S.filters.freeOnly ? ['Free'] : []), ...S.filters.tags];
    lb.textContent = active.length ? active.join(', ') : i('alltags');
  }
}

function renderAdvancedDropdowns() {
  renderFilterDropdown({
    ddId:      'ms-version-dropdown',
    lblId:     'ms-version-label',
    options:   getVersionsInUse().map(v => ({ value: v.id, label: v.label })),
    selected:  S.filters.versions,
    toggleFn:  'toggleVersion',
    emptyKey:  'allver',
    summaryFn: () => S.filters.versions.length
      ? S.filters.versions.map(id => VERSIONS.find(v => v.id === id)?.label || id).join(', ')
      : i('allver'),
  });
  renderFilterDropdown({
    ddId:      'ms-country-dropdown',
    lblId:     'ms-country-label',
    options:   getCountriesInUse().map(c => ({ value: c, label: c })),
    selected:  S.filters.countries,
    toggleFn:  'toggleCountry',
    emptyKey:  'allcountries',
    summaryFn: () => S.filters.countries.length ? S.filters.countries.join(', ') : i('allcountries'),
  });
  renderTagsDropdown();
}

function renderAdvancedChips() {
  const row = document.getElementById('advanced-chips-row');
  if (!row) return;
  const chips = [
    ...S.filters.versions.map(vId =>
      makeChip(VERSIONS.find(v => v.id === vId)?.label || vId, `toggleVersion('${vId}')`, 'chip-version')),
    ...S.filters.countries.map(c =>
      makeChip(c, `toggleCountry('${c}')`, 'chip-country')),
    ...(S.filters.freeOnly ? [makeChip('Free', 'toggleFreeOnly()', 'chip-free')] : []),
    ...S.filters.tags.map(t =>
      makeChip(t, `toggleTag('${t}')`, 'chip-tag')),
  ];
  row.innerHTML = chips.join('');
  row.style.display = chips.length ? 'flex' : 'none';
}

// ── Result count ──────────────────────────────────────────

function updateResultCount(n) {
  const el          = document.getElementById('results-count');
  const isFiltering = S.filters.search || activeFilterCount() > 0;
  el.textContent    = isFiltering ? i('found')(n) : '';
  el.classList.toggle('vis', isFiltering);
}

// ── Columns menu ──────────────────────────────────────────

function renderColumnsMenu() {
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

// ── Table ─────────────────────────────────────────────────

function renderTableHeaders() {
  const cols = [
    { id: 'title',     label: i('title'),   cls: 'col-title sortable'  },
    S.cols.developer ? { id: 'developer', label: i('dev'),     cls: 'sortable'    } : null,
    S.cols.version   ? { id: 'version',   label: i('ver'),     cls: ''            } : null,
    S.cols.year      ? { id: 'year',      label: i('yr'),      cls: 'sortable'    } : null,
    S.cols.country   ? { id: 'country',   label: i('country'), cls: 'sortable'    } : null,
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
  return `<tr onclick="openGameModal('${g.id}')" onmouseenter="showTooltip(event,'${g.ss || ''}')" onmouseleave="hideTooltip()">
    <td class="col-title">${g.title}</td>
    ${S.cols.developer ? `<td class="col-developer">${g.developer}</td>` : ''}
    ${S.cols.version   ? `<td><div class="badge-wrapper">${versionBadge(g.vId)}</div></td>` : ''}
    ${S.cols.year      ? `<td class="col-year">${g.year}</td>` : ''}
    ${S.cols.country   ? `<td class="col-country">${g.country}</td>` : ''}
    ${S.cols.tags      ? `<td><div class="badge-wrapper">${g.tags.map(tagBadge).join('')}</div></td>` : ''}
    <td class="col-download"><div class="badge-wrapper">${downloadBadge(g)}</div></td>
    ${S.isAdmin ? `<td><div class="action-buttons">${adminBtns(g.id, true)}</div></td>` : ''}
  </tr>`;
}

function renderTable(games) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = games.length
    ? games.map(gameRow).join('')
    : `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum resultado</p></div></td></tr>`;
}

// ── Cards ─────────────────────────────────────────────────

function gameCard(g, idx) {
  const ss = g.ss
    ? `<img class="card-screenshot" src="${g.ss}" alt="${g.title}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  return `<div class="card" style="animation-delay:${Math.min(idx * 25, 200)}ms" onclick="openGameModal('${g.id}')">
    ${ss}
    <div class="card-screenshot-fallback" style="${g.ss ? 'display:none' : 'display:flex'}" data-i18n="noss"></div>
    <div class="card-body">
      <div class="card-title">${g.title}</div>
      <div class="card-developer">
        <span class="card-dev-name">${g.developer}</span>
        <span class="card-dev-meta"> · ${g.year} · ${g.country}</span>
      </div>
      <div class="card-tags badge-wrapper">${g.tags.slice(0, 3).map(tagBadge).join('')}</div>
    </div>
    <div class="card-footer">
      <div class="badge-wrapper">${versionBadge(g.vId)}</div>
      <div style="display:flex;align-items:center;gap:5px">
        ${adminBtns(g.id, true)}${downloadBadge(g)}
      </div>
    </div>
  </div>`;
}

function renderCards(games) {
  const addBtn = S.isAdmin
    ? `<div class="card-add-button" onclick="openEdit(null)" role="button" tabindex="0">
        <div class="card-add-content">
          <span class="add-icon">＋</span>
          <span class="add-label" data-i18n="addgame"></span>
        </div>
      </div>`
    : '';
  const empty = games.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum resultado</p></div>`
    : games.map(gameCard).join('');
  document.getElementById('cards-grid').innerHTML = addBtn + empty;
}

// ── Game Detail Modal ─────────────────────────────────────

function openGameModal(gameId) {
  const g = GAMES.find(x => x.id === gameId);
  if (!g) return;

  const ssImg = document.getElementById('game-detail-screenshot');
  const ssFb  = document.getElementById('game-detail-screenshot-fallback');
  if (g.ss) { ssImg.src = g.ss; ssImg.style.display = 'block'; ssFb.style.display = 'none'; }
  else       { ssImg.style.display = 'none'; ssFb.style.display = 'flex'; ssFb.textContent = i('noss'); }

  setText('game-detail-title', g.title);
  setText('game-detail-id',    `#${g.id}`);

  document.getElementById('game-detail-meta').innerHTML = `
    <div class="game-detail-meta-row">
      <span class="gd-dev">${g.developer || '—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-year">${g.year || '—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-country">${g.country || 'Unknown'}</span>
    </div>
    <div>${versionBadge(g.vId)}</div>`;

  document.getElementById('game-detail-tags').innerHTML =
    `<div class="badge-wrapper">${g.tags.map(tagBadge).join('')}</div>`;

  document.getElementById('game-detail-footer').innerHTML =
    `<div>${downloadBadge(g)}</div>
     ${S.isAdmin ? `<div class="action-buttons">
       <button class="action-button" onclick="closeModal('game-detail-modal');openEdit('${g.id}')" title="${i('editgame')}">✏️</button>
       <button class="action-button delete-button" onclick="closeModal('game-detail-modal');delGame('${g.id}')" title="Delete">🗑️</button>
     </div>` : ''}`;

  openModal('game-detail-modal');
}
