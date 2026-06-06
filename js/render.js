/* jshint esversion: 6 */
'use strict';

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderAll() {
  syncI18n();
  renderAdvancedSearch();
  renderColumnsMenu();
  updateAdminBar();

  const games = filteredGames();
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

// ── i18n sync ─────────────────────────────────────────────

function syncI18n() {
  setText('logo-sub',        i('sub'));
  setText('view-compact',    i('compact'));
  setText('view-cards',      i('cards'));
  setText('sort-label',      i('sortby'));
  setText('admin-mode-label',    i('adminmode'));
  setText('admin-logout-button', i('logout'));
  setText('admin-add-button',    i('addgame'));
  setText('contact-button-label', i('contact'));

  document.getElementById('columns-button').textContent = `${i('cols')} ▾`;
  document.getElementById('search').placeholder = i('search');
  setText('tooltip-fallback', i('noss'));

  // Advanced search panel static labels
  setText('adv-panel-title',   i('advsearch'));
  setText('adv-ver-label',     i('ver'));
  setText('adv-ctr-label',     i('country'));
  setText('adv-free-label',    i('freeonly'));
  setText('adv-tags-label',    i('tags'));
  setText('adv-clear-btn',     i('clearall'));

  // Confirm-clear modal
  setText('confirm-clear-title', i('confirmclear'));
  setText('confirm-clear-sub',   i('confirmclearsub'));
  setText('confirm-keep-btn',    i('confirmkeep'));
  setText('confirm-clear-btn',   i('confirmclearbtn'));

  // Login modal
  setText('login-title',          i('adminlogin'));
  setText('login-subtitle',       i('adminsub'));
  setText('login-email-label',    i('email'));
  setText('login-password-label', i('pass'));
  setText('login-button',         i('login'));
  setText('login-cancel',         i('cancel'));

  // Edit modal
  setText('edit-label-title',       i('edtitle'));
  setText('edit-label-developer',   i('eddev'));
  setText('edit-label-version',     i('edver'));
  setText('edit-label-year',        i('edyr'));
  setText('edit-label-screenshot',  i('edss'));
  setText('edit-label-download',    i('eddl'));
  setText('edit-label-tags',        i('edtags'));
  setText('edit-label-country',     i('edcountry'));
  setText('download-label-available',   i('avail'));
  setText('download-label-unavailable', i('na'));
  setText('screenshot-url-label',   i('ssurl'));
  setText('screenshot-file-label',  i('ssupload'));
  setText('edit-cancel', i('cancel'));
  setText('edit-save',   i('save'));
  setText('edit-tag-error', i('tagsrequired'));

  const cInput = document.getElementById('edit-game-country');
  if (cInput) cInput.placeholder = i('countryph');
  const tagInput = document.getElementById('edit-tag-input');
  if (tagInput) tagInput.placeholder = i('tagph');
  const editUrl = document.getElementById('edit-download-url');
  if (editUrl) editUrl.placeholder = 'https://…';

  // Contact modal
  setText('contact-title',         i('contacttitle'));
  setText('contact-subtitle',      i('contactsub'));
  setText('contact-name-label',    i('contactname'));
  setText('contact-email-label',   i('contactemail'));
  setText('contact-message-label', i('contactmsg'));
  setText('contact-send',          i('contactsend'));
  setText('contact-cancel',        i('cancel'));

  // Edit modal version select
  document.getElementById('edit-game-version').innerHTML =
    VERSIONS.map(v => `<option value="${v.id}">${v.label}</option>`).join('');

  // Toggle states
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

  // Button label + active indicator
  const filterCount = S.filters.versions.length + S.filters.countries.length +
                      (S.filters.freeOnly ? 1 : 0) + S.filters.tags.length;
  btn.textContent = filterCount > 0 ? `${i('advsearch')} · ${filterCount}` : i('advsearch');
  btn.classList.toggle('on', S.advancedOpen || filterCount > 0);

  if (!S.advancedOpen) return;

  document.getElementById('adv-free-button')?.classList.toggle('on', S.filters.freeOnly);
  document.getElementById('adv-mode-or')?.classList.toggle('on',  S.filters.tagMode === 'or');
  document.getElementById('adv-mode-and')?.classList.toggle('on', S.filters.tagMode === 'and');

  renderAdvancedDropdowns();
  renderAdvancedChips();
}

function renderAdvancedDropdowns() {
  // Version dropdown
  const versionOptions = getVersionsInUse();
  const vddEl = document.getElementById('ms-version-dropdown');
  if (vddEl) {
    vddEl.innerHTML = versionOptions.map(v =>
      `<div class="ms-option ${S.filters.versions.includes(v.id) ? 'selected' : ''}"
            onclick="toggleVersion('${v.id}')">
        <span class="ms-check">${S.filters.versions.includes(v.id) ? '✓' : ''}</span>${v.label}
      </div>`
    ).join('') || `<div class="ms-empty">${i('allver')}</div>`;
    vddEl.classList.toggle('open', _openDropdown === 'version');
  }
  const vLabel = document.getElementById('ms-version-label');
  if (vLabel) {
    vLabel.textContent = S.filters.versions.length === 0
      ? i('allver')
      : S.filters.versions.map(id => getVer(id)?.label || id).join(', ');
  }

  // Country dropdown
  const countryOptions = getCountriesInUse();
  const cddEl = document.getElementById('ms-country-dropdown');
  if (cddEl) {
    cddEl.innerHTML = countryOptions.map(c =>
      `<div class="ms-option ${S.filters.countries.includes(c) ? 'selected' : ''}"
            onclick="toggleCountry('${c}')">
        <span class="ms-check">${S.filters.countries.includes(c) ? '✓' : ''}</span>${c}
      </div>`
    ).join('') || `<div class="ms-empty">${i('allcountries')}</div>`;
    cddEl.classList.toggle('open', _openDropdown === 'country');
  }
  const cLabel = document.getElementById('ms-country-label');
  if (cLabel) {
    cLabel.textContent = S.filters.countries.length === 0
      ? i('allcountries')
      : S.filters.countries.join(', ');
  }

  // Tags dropdown — Free syncs with freeOnly toggle
  const tddEl = document.getElementById('ms-tags-dropdown');
  if (tddEl) {
    tddEl.innerHTML = TAGS.map(t => {
      if (t.name === 'Free') {
        return `<div class="ms-option ${S.filters.freeOnly ? 'selected' : ''}"
                     onclick="toggleFreeOnly()">
          <span class="ms-check">${S.filters.freeOnly ? '✓' : ''}</span>${t.name}
        </div>`;
      }
      return `<div class="ms-option ${S.filters.tags.includes(t.name) ? 'selected' : ''}"
                   onclick="toggleTag('${t.name}')">
        <span class="ms-check">${S.filters.tags.includes(t.name) ? '✓' : ''}</span>${t.name}
      </div>`;
    }).join('') || `<div class="ms-empty">${i('alltags')}</div>`;
    tddEl.classList.toggle('open', _openDropdown === 'tags');
  }
  const tLabel = document.getElementById('ms-tags-label');
  if (tLabel) {
    const active = [...(S.filters.freeOnly ? ['Free'] : []), ...S.filters.tags];
    tLabel.textContent = active.length === 0 ? i('alltags') : active.join(', ');
  }
}

function renderAdvancedChips() {
  const row = document.getElementById('advanced-chips-row');
  if (!row) return;

  const chips = [];

  S.filters.versions.forEach(vId => {
    const v = getVer(vId);
    chips.push(`<span class="adv-chip chip-version">${v?.label || vId}
      <button onclick="toggleVersion('${vId}')" aria-label="Remove">×</button></span>`);
  });

  S.filters.countries.forEach(c => {
    chips.push(`<span class="adv-chip chip-country">${c}
      <button onclick="toggleCountry('${c}')" aria-label="Remove">×</button></span>`);
  });

  if (S.filters.freeOnly) {
    chips.push(`<span class="adv-chip chip-free">Free
      <button onclick="toggleFreeOnly()" aria-label="Remove">×</button></span>`);
  }

  S.filters.tags.forEach(tag => {
    chips.push(`<span class="adv-chip chip-tag">${tag}
      <button onclick="toggleTag('${tag}')" aria-label="Remove">×</button></span>`);
  });

  row.innerHTML = chips.join('');
  row.style.display = chips.length ? 'flex' : 'none';
}

// ── Result count ──────────────────────────────────────────

function updateResultCount(n) {
  const el = document.getElementById('results-count');
  const isFiltering = S.filters.search || S.filters.versions.length > 0 ||
                      S.filters.freeOnly || S.filters.countries.length > 0 ||
                      S.filters.tags.length > 0;
  if (isFiltering) {
    el.textContent = i('found')(n);
    el.classList.add('vis');
  } else {
    el.classList.remove('vis');
  }
}

// ── Columns menu ──────────────────────────────────────────

function renderColumnsMenu() {
  const labels = {
    developer: i('dev'),
    version:   i('ver'),
    year:      i('yr'),
    country:   i('country'),
    tags:      i('tags'),
  };
  document.getElementById('columns-menu').innerHTML =
    Object.keys(labels)
      .map(k => `<label><input type="checkbox" ${S.cols[k] ? 'checked' : ''} onchange="toggleColumn('${k}')"/> ${labels[k]}</label>`)
      .join('');
}

// ── Admin bar ─────────────────────────────────────────────

function updateAdminBar() {
  const bar = document.getElementById('admin-bar');
  bar.style.display = S.isAdmin ? 'flex' : 'none';
  if (S.isAdmin && S.session) {
    setText('admin-email-label', S.session.user.email);
  }
}

// ── Table ─────────────────────────────────────────────────

function renderTableHeaders() {
  const cols = [
    { id: 'title',     label: i('title'),   cls: 'col-title sortable' },
    S.cols.developer ? { id: 'developer', label: i('dev'),     cls: 'sortable'    } : null,
    S.cols.version   ? { id: 'version',   label: i('ver'),     cls: ''            } : null,
    S.cols.year      ? { id: 'year',      label: i('yr'),      cls: 'sortable'    } : null,
    S.cols.country   ? { id: 'country',   label: i('country'), cls: 'sortable'    } : null,
    S.cols.tags      ? { id: 'tags',      label: i('tags'),    cls: 'col-tags'    } : null,
    { id: 'download',   label: i('dl'),    cls: 'col-download'  },
    S.isAdmin        ? { id: 'actions',   label: i('actions'), cls: 'col-actions' } : null,
  ].filter(Boolean);

  document.getElementById('table-header-row').innerHTML = cols.map(c => {
    const sortable   = c.cls.includes('sortable');
    const activeSort = S.sort.col === c.id;
    const sortCls    = activeSort ? (S.sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';
    const arrow      = (activeSort && S.sort.dir === 'asc') ? '↓' : '↑';
    return `<th class="${c.cls} ${sortCls}" ${sortable ? `onclick="sortBy('${c.id}')"` : ''}>
      ${c.label}${sortable ? `<span class="sort-indicator">${arrow}</span>` : ''}
    </th>`;
  }).join('');
}

function renderTable(games) {
  const tbody = document.getElementById('table-body');

  if (games.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">
      <div class="empty-state"><div class="empty-icon">🔍</div><p>${i('filters')} — nenhum resultado</p></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = games.map(g => {
    const adminCols = S.isAdmin
      ? `<td><div class="action-buttons">
          <button class="action-button"              onclick="event.stopPropagation();openEdit('${g.id}')" title="${i('editgame')}">✏️</button>
          <button class="action-button delete-button" onclick="event.stopPropagation();delGame('${g.id}')"  title="Delete">🗑️</button>
        </div></td>`
      : '';

    return `<tr onclick="openGameModal('${g.id}')" onmouseenter="showTooltip(event,'${g.ss || ''}')" onmouseleave="hideTooltip()">
      <td class="col-title">${g.title}</td>
      ${S.cols.developer ? `<td class="col-developer">${g.developer}</td>` : ''}
      ${S.cols.version   ? `<td><div class="badge-wrapper">${versionBadge(g.vId)}</div></td>` : ''}
      ${S.cols.year      ? `<td class="col-year">${g.year}</td>` : ''}
      ${S.cols.country   ? `<td class="col-country">${g.country}</td>` : ''}
      ${S.cols.tags      ? `<td><div class="badge-wrapper">${g.tags.map(t => tagBadge(t)).join('')}</div></td>` : ''}
      <td class="col-download"><div class="badge-wrapper">${downloadBadge(g)}</div></td>
      ${adminCols}
    </tr>`;
  }).join('');
}

// ── Cards ─────────────────────────────────────────────────

function renderCards(games) {
  const grid = document.getElementById('cards-grid');
  let html   = '';

  if (S.isAdmin) {
    html += `<div class="card-add-button" onclick="openEdit(null)" role="button" tabindex="0" aria-label="${i('addgame')}">
      <div class="card-add-content">
        <span class="add-icon">＋</span>
        <span class="add-label">${i('addgame')}</span>
      </div>
    </div>`;
  }

  if (games.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum resultado</p></div>`;
  } else {
    html += games.map((g, idx) => {
      const ssImg = g.ss
        ? `<img class="card-screenshot" src="${g.ss}" alt="${g.title}" loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
      const ssPhStyle = g.ss ? 'display:none' : 'display:flex';
      const adminBtns = S.isAdmin
        ? `<button class="action-button"              onclick="event.stopPropagation();openEdit('${g.id}')" title="${i('editgame')}">✏️</button>
           <button class="action-button delete-button" onclick="event.stopPropagation();delGame('${g.id}')"  title="Delete">🗑️</button>`
        : '';

      return `<div class="card" style="animation-delay:${Math.min(idx * 25, 200)}ms" onclick="openGameModal('${g.id}')">
        ${ssImg}
        <div class="card-screenshot-fallback" style="${ssPhStyle}">${i('noss')}</div>
        <div class="card-body">
          <div class="card-title">${g.title}</div>
          <div class="card-developer"><span class="card-dev-name">${g.developer}</span><span class="card-dev-meta"> · ${g.year} · ${g.country}</span></div>
          <div class="card-tags badge-wrapper">${g.tags.slice(0, 3).map(t => tagBadge(t)).join('')}</div>
        </div>
        <div class="card-footer">
          <div class="badge-wrapper">${versionBadge(g.vId)}</div>
          <div style="display:flex;align-items:center;gap:5px">${adminBtns}${downloadBadge(g)}</div>
        </div>
      </div>`;
    }).join('');
  }

  grid.innerHTML = html;
}

// ── Game Detail Modal ─────────────────────────────────────

function openGameModal(gameId) {
  const g = GAMES.find(x => x.id === gameId);
  if (!g) return;

  const ssImg = document.getElementById('game-detail-screenshot');
  const ssFb  = document.getElementById('game-detail-screenshot-fallback');
  if (g.ss) {
    ssImg.src = g.ss; ssImg.style.display = 'block'; ssFb.style.display = 'none';
  } else {
    ssImg.style.display = 'none'; ssFb.style.display = 'flex'; ssFb.textContent = i('noss');
  }

  document.getElementById('game-detail-title').textContent = g.title;
  document.getElementById('game-detail-id').textContent    = `#${g.id}`;

  document.getElementById('game-detail-meta').innerHTML = `
    <div class="game-detail-meta-row">
      <span class="gd-dev">${g.developer || '—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-year">${g.year || '—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-country">${g.country || 'Unknown'}</span>
    </div>
    <div class="gd-version">${versionBadge(g.vId)}</div>`;

  document.getElementById('game-detail-tags').innerHTML =
    `<div class="badge-wrapper">${g.tags.map(t => tagBadge(t)).join('')}</div>`;

  let footer = `<div>${downloadBadge(g)}</div>`;
  if (S.isAdmin) {
    footer += `<div class="action-buttons">
      <button class="action-button" onclick="closeModal('game-detail-modal');openEdit('${g.id}')" title="${i('editgame')}">✏️</button>
      <button class="action-button delete-button" onclick="closeModal('game-detail-modal');delGame('${g.id}')" title="Delete">🗑️</button>
    </div>`;
  }
  document.getElementById('game-detail-footer').innerHTML = footer;
  openModal('game-detail-modal');
}
