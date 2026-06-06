/* jshint esversion: 6 */
'use strict';

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderAll() {
  syncI18n();
  renderVersionSelect();
  renderFilterBar();
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

function syncI18n() {
  setText('logo-sub',        i('sub'));
  setText('free-button',     i('freeonly'));
  setText('view-compact',    i('compact'));
  setText('view-cards',      i('cards'));
  setText('filter-label-text', i('filters'));
  setText('clear-button',    i('clearall'));
  setText('sort-label',      i('sortby'));
  setText('admin-mode-label', i('adminmode'));
  setText('admin-logout-button', i('logout'));
  setText('admin-add-button', i('addgame'));
  setText('contact-button-label', i('contact'));

  document.getElementById('columns-button').textContent = `${i('cols')} ▾`;
  document.getElementById('search').placeholder = i('search');
  setText('tooltip-fallback', i('noss'));

  setText('login-title',          i('adminlogin'));
  setText('login-subtitle',       i('adminsub'));
  setText('login-email-label',    i('email'));
  setText('login-password-label', i('pass'));
  setText('login-button',         i('login'));
  setText('login-cancel',         i('cancel'));

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

  const editUrl = document.getElementById('edit-download-url');
  if (editUrl) editUrl.placeholder = 'https://…';

  setText('contact-title',         i('contacttitle'));
  setText('contact-subtitle',      i('contactsub'));
  setText('contact-name-label',    i('contactname'));
  setText('contact-email-label',   i('contactemail'));
  setText('contact-message-label', i('contactmsg'));
  setText('contact-send',          i('contactsend'));
  setText('contact-cancel',        i('cancel'));

  const tagNames = TAGS.map(t => t.name);
  document.getElementById('edit-tags-checkboxes').innerHTML =
    tagNames.map(t => `<label><input type="checkbox" id="tag-checkbox-${t}"/> ${t}</label>`).join('');

  document.getElementById('edit-game-version').innerHTML =
    VERSIONS.map(v => `<option value="${v.id}">${v.label}</option>`).join('');

  document.getElementById('free-button').classList.toggle('on',   S.filters.freeOnly);
  document.getElementById('lang-en-button').classList.toggle('on', S.lang === 'en');
  document.getElementById('lang-pt-button').classList.toggle('on', S.lang === 'pt');
  document.getElementById('theme-light-button').classList.toggle('on', S.theme === 'light');
  document.getElementById('theme-dark-button').classList.toggle('on',  S.theme === 'dark');
  document.getElementById('view-compact').classList.toggle('on', S.view === 'compact');
  document.getElementById('view-cards').classList.toggle('on',   S.view === 'cards');
  document.getElementById('mode-or').classList.toggle('on',    S.filters.tagMode === 'or');
  document.getElementById('mode-and').classList.toggle('on',   S.filters.tagMode === 'and');
  document.getElementById('admin-button').classList.toggle('admin-active', S.isAdmin);
}

function renderVersionSelect() {
  const sel = document.getElementById('version-select');
  sel.innerHTML =
    `<option value="">${i('allver')}</option>` +
    VERSIONS.map(v => `<option value="${v.id}">${v.label}</option>`).join('');
  sel.value = S.filters.version;
}

function renderFilterBar() {
  const bar    = document.getElementById('filter-bar');
  const tokens = document.getElementById('filter-tokens');
  const mtog   = document.getElementById('mode-toggle');

  if (S.filters.tags.length === 0) {
    bar.classList.remove('vis');
    return;
  }

  bar.classList.add('vis');
  tokens.innerHTML = S.filters.tags
    .map(tag =>
      `<span class="filter-token">${tag}
        <button class="filter-token-remove" onclick="removeTag('${tag}')" aria-label="Remove ${tag}">×</button>
      </span>`)
    .join('');

  mtog.style.display = S.filters.tags.length >= 2 ? 'flex' : 'none';
}

function updateResultCount(n) {
  const el = document.getElementById('results-count');
  const isFiltering =
    S.filters.search || S.filters.version || S.filters.freeOnly || S.filters.tags.length > 0;

  if (isFiltering) {
    el.textContent = i('found')(n);
    el.classList.add('vis');
  } else {
    el.classList.remove('vis');
  }
}

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
      .map(k =>
        `<label>
          <input type="checkbox" ${S.cols[k] ? 'checked' : ''} onchange="toggleColumn('${k}')"/>
          ${labels[k]}
        </label>`)
      .join('');
}

function updateAdminBar() {
  const bar = document.getElementById('admin-bar');
  bar.style.display = S.isAdmin ? 'flex' : 'none';
  if (S.isAdmin && S.session) {
    setText('admin-email-label', S.session.user.email);
  }
}

function renderTableHeaders() {
  const cols = [
    { id: 'title',     label: i('title'),   cls: 'col-title sortable' },
    S.cols.developer ? { id: 'developer', label: i('dev'),     cls: 'sortable'     } : null,
    S.cols.version   ? { id: 'version',   label: i('ver'),     cls: ''             } : null,
    S.cols.year      ? { id: 'year',      label: i('yr'),      cls: 'sortable'     } : null,
    S.cols.country   ? { id: 'country',   label: i('country'), cls: 'sortable'     } : null,
    S.cols.tags      ? { id: 'tags',      label: i('tags'),    cls: ''             } : null,
    { id: 'download',   label: i('dl'),    cls: 'col-download'  },
    S.isAdmin        ? { id: 'actions',   label: i('actions'), cls: ''             } : null,
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
          <div class="card-developer">${g.developer} · ${g.year} · ${g.country}</div>
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

  // Screenshot
  const ssImg = document.getElementById('game-detail-screenshot');
  const ssFb  = document.getElementById('game-detail-screenshot-fallback');
  if (g.ss) {
    ssImg.src           = g.ss;
    ssImg.style.display = 'block';
    ssFb.style.display  = 'none';
  } else {
    ssImg.style.display = 'none';
    ssFb.style.display  = 'flex';
    ssFb.textContent    = i('noss');
  }

  // Title + discreet ID
  document.getElementById('game-detail-title').textContent = g.title;
  document.getElementById('game-detail-id').textContent    = `#${g.id}`;

  // Meta row + version badge
  document.getElementById('game-detail-meta').innerHTML = `
    <div class="game-detail-meta-row">
      <span class="gd-dev">${g.developer || '—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-year">${g.year || '—'}</span>
      <span class="gd-sep">·</span>
      <span class="gd-country">${g.country || 'Unknown'}</span>
    </div>
    <div class="gd-version">${versionBadge(g.vId)}</div>
  `;

  // All tags
  document.getElementById('game-detail-tags').innerHTML =
    `<div class="badge-wrapper">${g.tags.map(t => tagBadge(t)).join('')}</div>`;

  // Footer: download + optional admin actions
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
