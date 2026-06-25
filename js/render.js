'use strict';

// ── ECB Config ────────────────────────────────────────────
// Each ECB tracks an ordered "selection order" array separately from the
// underlying filter array, so the input can display "first clicked + N more"
// in click order rather than the filter array's storage order.

const ECB_SELECTION_ORDER = {
  version: [], country: [], tags: [], blacklist: [], fanLang: [],
};

function recordEcbSelection(name, value, isSelected) {
  var order = ECB_SELECTION_ORDER[name];
  var idx   = order.indexOf(value);
  if (isSelected) {
    if (idx === -1) order.push(value);
  } else if (idx !== -1) {
    order.splice(idx, 1);
  }
}

const ECB_CONFIG = {
  version: {
    options:  function() { return getVersionsInUse().map(function(v) { return { value: v.id, label: v.name }; }); },
    selected: function() { return S.filters.versions; },
    toggleFn: 'toggleVersion',
    phKey:    'filterversions',
  },
  country: {
    options:  function() { return getCountriesInUse().map(function(c) { return { value: c, label: countryWithFlag(c) }; }); },
    selected: function() { return S.filters.countries; },
    toggleFn: 'toggleCountry',
    phKey:    'filtercountries',
  },
  tags: {
    options:  function() {
      return TAGS.filter(function(t) { return S.filters.blacklistTags.indexOf(t.name) === -1; })
                 .map(function(t) { return { value: t.name, label: t.name }; });
    },
    selected: function() { return S.filters.tags; },
    toggleFn: 'toggleTag',
    phKey:    'filtertags',
  },
  blacklist: {
    options:  function() {
      return TAGS.filter(function(t) { return S.filters.tags.indexOf(t.name) === -1; })
                 .map(function(t) { return { value: t.name, label: t.name }; });
    },
    selected: function() { return S.filters.blacklistTags; },
    toggleFn: 'toggleBlacklistTag',
    phKey:    'blacklistph',
  },
  fanLang: {
    options:  function() { return getFanLangsInUse().map(function(l) { return { value: l, label: l }; }); },
    selected: function() { return S.filters.fanLangs; },
    toggleFn: 'toggleFanLang',
    phKey:    'filterfanlangs',
  },
};

function renderEcbDropdown(name, query) {
  var dd  = document.getElementById('ecb-' + name + '-dropdown');
  var cfg = ECB_CONFIG[name];
  if (!dd || !cfg) return;
  var q        = (query || '').toLowerCase().trim();
  var selected = cfg.selected();
  var options  = cfg.options().filter(function(o) {
    return selected.indexOf(o.value) === -1 &&
           (q === '' || o.label.toLowerCase().indexOf(q) !== -1);
  });
  dd.innerHTML = options.map(function(o) {
    return '<div class="ecb-option" onclick="' + cfg.toggleFn + '(\'' + o.value.replace(/'/g, "\\'") + '\')">' + o.label + '</div>';
  }).join('') || '<div class="ecb-empty">—</div>';
  dd.classList.toggle('open', S.openDropdown === 'ecb-' + name + '-dropdown');
}

// Renders the ECB input's display state: shows the first-clicked selection
// as inline text plus a separate "N+" pill for additional selections,
// rather than leaving the input visually empty while a filter is active.
function renderEcbInputDisplay(name) {
  var cfg = ECB_CONFIG[name];
  if (!cfg) return;
  var wrapper = document.getElementById('ecb-' + name + '-wrapper');
  if (!wrapper) return;
  var input    = document.getElementById('ecb-' + name + '-input');
  var moreEl   = wrapper.querySelector('.ecb-more-pill');
  var order    = ECB_SELECTION_ORDER[name];
  var selected = cfg.selected();

  // Selection order may contain stale entries (e.g. cleared via "Clear group") — keep only current selection.
  var validOrder = order.filter(function(v) { return selected.indexOf(v) !== -1; });

  if (!validOrder.length) {
    if (input) input.value = '';
    if (moreEl) moreEl.remove();
    return;
  }

  var firstValue = validOrder[0];
  var match      = cfg.options().find(function(o) { return o.value === firstValue; });
  if (input) input.value = match ? match.label : firstValue;

  var extraCount = validOrder.length - 1;
  if (extraCount > 0) {
    if (!moreEl) {
      moreEl = document.createElement('span');
      moreEl.className = 'ecb-more-pill';
      wrapper.appendChild(moreEl);
    }
    moreEl.textContent = '+' + extraCount;
  } else if (moreEl) {
    moreEl.remove();
  }
}

function renderAllEcbDropdowns() {
  Object.keys(ECB_CONFIG).forEach(function(name) {
    var input = document.getElementById('ecb-' + name + '-input');
    renderEcbDropdown(name, input ? '' : '');
    renderEcbInputDisplay(name);
  });
}

// ── Column → ECB coupling ─────────────────────────────────
// Cards view always shows all ECBs regardless of column visibility.

const COLUMN_TO_ECB = { version: 'version', country: 'country', fanLang: 'fanLang' };

// ── Core render ───────────────────────────────────────────

function renderAll() {
  if (window.innerWidth < 800 && S.view !== 'cards') S.view = 'cards';
  document.body.classList.toggle('view-cards', S.view === 'cards');

  syncI18n();
  renderWarningDiv();
  updateAdminBar();
  renderAdvancedSearch();
  renderDevPanel();
  renderColumnsMenu();

  var games = sortGames(filterGames());
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

  var settingsModal = document.getElementById('settings-modal');
  if (settingsModal && settingsModal.classList.contains('open')) renderSettingsPage();

  // Lucide re-scans the DOM for any <i data-lucide="..."> tags introduced by the render above.
  if (window.lucide) window.lucide.createIcons();
}

// ── i18n ──────────────────────────────────────────────────

function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

function syncI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = i(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
    el.placeholder = i(el.dataset.i18nPh);
  });

  var colBtn = document.getElementById('columns-button');
  if (colBtn) {
    var colBtnLabel = colBtn.querySelector('.button-label');
    if (colBtnLabel) colBtnLabel.textContent = i('cols');
  }

  var verSel = document.getElementById('edit-game-version');
  if (verSel) verSel.innerHTML = VERSIONS.map(function(v) {
    return '<option value="' + v.id + '">' + v.name + '</option>';
  }).join('');

  Object.keys(ECB_CONFIG).forEach(function(name) {
    var input = document.getElementById('ecb-' + name + '-input');
    if (input) input.placeholder = i(ECB_CONFIG[name].phKey);
  });

  var langSel = document.getElementById('lang-select');
  if (langSel) langSel.value = S.lang;

  var themeBtn = document.getElementById('theme-toggle-button');
  if (themeBtn) themeBtn.innerHTML = '<i data-lucide="' + (S.theme === 'light' ? 'sun' : 'moon') + '"></i>';

  document.getElementById('view-compact').classList.toggle('on', S.view === 'compact');
  document.getElementById('view-cards').classList.toggle('on',   S.view === 'cards');

  var adminBtn = document.getElementById('admin-button');
  if (adminBtn) adminBtn.classList.toggle('admin-active', S.isAdmin);
}

// ── Settings Page ─────────────────────────────────────────

function renderSettingsPage() {
  var content = document.getElementById('settings-content');
  if (!content) return;

  if (!S.isAdmin || !S.profile) {
    content.innerHTML =
      '<div class="settings-guest">' +
        '<div class="settings-lang-row">' +
          '<label class="settings-lang-label">' + i('language') + '</label>' +
          '<select id="lang-select" class="lang-select" onchange="setLang(this.value)">' +
            '<option value="en"' + (S.lang === 'en' ? ' selected' : '') + '>EN-US</option>' +
            '<option value="pt"' + (S.lang === 'pt' ? ' selected' : '') + '>PT-BR</option>' +
          '</select>' +
        '</div>' +
        '<hr class="field-divider"/>' +
        '<p class="settings-intro">' + i('settingsunderconstruction') + '</p>' +
        '<button class="button-base button-base-md button-primary" onclick="openModal(\'login-modal\')">' + i('adminlogin') + '</button>' +
      '</div>';
    return;
  }

  var roleLbl       = roleLabel(S.profile.role);
  var archiverTools = isArchiver()
    ? '<hr class="field-divider"/>' +
      '<div class="settings-tools">' +
        '<button class="button-base button-base-md" onclick="openManageVersions()">' + i('managever')  + '</button>' +
        '<button class="button-base button-base-md" onclick="openManageTags()">'     + i('managetags') + '</button>' +
        '<button class="button-base button-base-md" onclick="openManageUsers()">'    + i('manageusers') + '</button>' +
        '<button class="button-base button-base-md" onclick="migrateOrphanGames()">' + i('migrateorphans') + '</button>' +
      '</div>' +
      '<p class="settings-note" id="migrate-orphans-result"></p>'
    : '';

  content.innerHTML =
    '<div class="settings-profile">' +
      '<span class="settings-username">' + S.profile.username + '</span>' +
      '<span class="badge badge-role badge-role-' + S.profile.role + '">' + roleLbl + '</span>' +
    '</div>' +
    '<div class="settings-lang-row">' +
      '<label class="settings-lang-label">' + i('language') + '</label>' +
      '<select id="lang-select" class="lang-select" onchange="setLang(this.value)">' +
        '<option value="en"' + (S.lang === 'en' ? ' selected' : '') + '>EN-US</option>' +
        '<option value="pt"' + (S.lang === 'pt' ? ' selected' : '') + '>PT-BR</option>' +
      '</select>' +
    '</div>' +
    '<div class="settings-actions">' +
      '<button class="button-base button-base-md" onclick="triggerPasswordReset()">' + i('changepassword') + '</button>' +
      '<button class="button-base button-base-md" onclick="doLogout()">' + i('logout') + '</button>' +
    '</div>' +
    archiverTools;
}

// ── Warning Div ───────────────────────────────────────────

function renderWarningDiv() {
  var div = document.getElementById('warning-div');
  if (!div) return;
  if (!PENDING_ACTIONS.length) { div.style.display = 'none'; return; }
  div.style.display = '';
  var list = document.getElementById('warning-actions-list');
  if (!list) return;
  list.style.display = S.warningExpanded ? '' : 'none';
  if (!S.warningExpanded) return;
  list.innerHTML = PENDING_ACTIONS.map(function(a) {
    var msLeft    = Math.max(0, new Date(a.execute_at) - Date.now());
    var mins      = Math.floor(msLeft / 60000);
    var secs      = Math.floor((msLeft % 60000) / 1000);
    var countdown = msLeft > 0
      ? mins + ':' + String(secs).padStart(2, '0')
      : i('executing');
    return '<div class="warning-action" id="wa-' + a.id + '">' +
             '<span class="warning-desc">' + a.description + '</span>' +
             '<span class="warning-countdown" id="wc-' + a.id + '">' + countdown + '</span>' +
             '<button class="warn-btn warn-ok"   onclick="executePendingAction(\'' + a.id + '\')">[ok]</button>' +
             '<button class="warn-btn warn-undo" onclick="undoPendingAction(\'' + a.id + '\')">[undo]</button>' +
           '</div>';
  }).join('');
}

function tickWarningCountdowns() {
  PENDING_ACTIONS.forEach(function(a) {
    var el = document.getElementById('wc-' + a.id);
    if (!el) return;
    var msLeft = Math.max(0, new Date(a.execute_at) - Date.now());
    var mins   = Math.floor(msLeft / 60000);
    var secs   = Math.floor((msLeft % 60000) / 1000);
    el.textContent = msLeft > 0 ? mins + ':' + String(secs).padStart(2, '0') : i('executing');
  });
}

// ── Advanced Search Panel ─────────────────────────────────

function renderAdvancedSearch() {
  var panel = document.getElementById('advanced-panel');
  var btn   = document.getElementById('advanced-search-button');
  if (!panel || !btn) return;

  panel.classList.toggle('open', S.advancedOpen);

  var count     = activeFilterCount();
  var btnLabel  = btn.querySelector('.button-label');
  if (btnLabel) btnLabel.textContent = count > 0 ? i('advsearch') + ' · ' + count : i('advsearch');
  btn.classList.toggle('on', S.advancedOpen || count > 0);

  if (!S.advancedOpen) return;

  var inCards = S.view === 'cards';
  Object.keys(COLUMN_TO_ECB).forEach(function(colKey) {
    var ecbName = COLUMN_TO_ECB[colKey];
    var wrapper = document.getElementById('ecb-' + ecbName);
    if (wrapper) wrapper.style.display = (inCards || S.cols[colKey]) ? '' : 'none';
  });

  renderAllEcbDropdowns();
  renderAdvancedChips();
}

// Chips render in two groups (Selected / Blacklisted). Each group gets a
// "Clear group" pill appended at the end, shown only on hover via CSS,
// and only when the group has 2+ entries.
function renderChipGroup(chips, clearOnclick) {
  if (!chips.length) return '';
  var clearPill = chips.length >= 2 ? makeClearGroupChip(clearOnclick) : '';
  return chips.join('') + clearPill;
}

function renderAdvancedChips() {
  var row = document.getElementById('advanced-chips-row');
  if (!row) return;
  var inCards      = S.view === 'cards';
  var show         = function(key) { return inCards || S.cols[key]; };
  var hasBlacklist = S.filters.blacklistTags.length > 0;

  var selectedChips = [].concat(
    show('country') ? S.filters.countries.map(function(c) { return makeChip(countryWithFlag(c), 'toggleCountry(\'' + c.replace(/'/g, "\\'") + '\')', 'chip-country'); }) : [],
    show('year')    ? S.filters.years.map(function(y)    { return makeChip(String(y), 'toggleYear(' + y + ')', 'chip-year'); })    : [],
    show('version') ? S.filters.versions.map(function(vId) {
      var v = VERSIONS.find(function(v) { return v.id === vId; });
      return makeChip(v ? v.name : vId, 'toggleVersion(\'' + vId + '\')', 'chip-version');
    }) : [],
    S.filters.tags.map(function(t)    { return makeChip(t, 'toggleTag(\'' + t.replace(/'/g, "\\'") + '\')', 'chip-tag'); }),
    show('fanLang') ? S.filters.fanLangs.map(function(l) { return makeChip(l, 'toggleFanLang(\'' + l.replace(/'/g, "\\'") + '\')', 'chip-fanlang'); }) : []
  );

  var blacklistChips = S.filters.blacklistTags.map(function(t) {
    return makeChip(t, 'toggleBlacklistTag(\'' + t.replace(/'/g, "\\'") + '\')', 'chip-blacklist');
  });

  if (!selectedChips.length && !blacklistChips.length) {
    row.innerHTML = ''; row.style.display = 'none'; return;
  }

  var selLabel = hasBlacklist ? '<span class="chips-section-label">' + i('selectedtags') + '</span>' : '';
  var blkLabel = hasBlacklist ? '<span class="chips-section-label chips-section-label-blacklist">' + i('blacklistedtags') + '</span>' : '';

  var mustAllRow = S.filters.tags.length > 0
    ? '<label class="adv-checkbox-row">' +
        '<input type="checkbox" id="adv-must-have-all" ' + (S.filters.tagModeAll ? 'checked' : '') + ' onchange="setTagModeAll(this.checked)"/>' +
        '<span>' + i('musthavealltags') + '</span>' +
      '</label>'
    : '';

  row.innerHTML =
    (selectedChips.length  ? '<div class="chip-group">' + selLabel + renderChipGroup(selectedChips, 'clearSelectedTagsGroup()') + mustAllRow + '</div>'  : '') +
    (blacklistChips.length ? '<div class="chip-group">' + blkLabel + renderChipGroup(blacklistChips, 'clearBlacklistGroup()') + '</div>' : '');
  row.style.display = 'flex';
}

// ── Developer Panel ───────────────────────────────────────

function renderDevPanel() {
  var panel = document.getElementById('dev-panel');
  if (!panel) return;
  if (!S.activeDev) { panel.style.display = 'none'; return; }
  panel.style.display = '';

  var devGames  = GAMES.filter(function(g) { return splitDev(g.developer).indexOf(S.activeDev) !== -1; });
  var countries = Array.from(new Set(devGames.map(function(g) { return g.country; }).filter(Boolean)));
  var versions  = Array.from(new Set(devGames.map(function(g) { return g.vId; }).filter(Boolean)));
  var tags      = Array.from(new Set(devGames.reduce(function(acc, g) { return acc.concat(g.tags); }, [])));

  panel.innerHTML =
    '<div class="dev-panel-header">' +
      '<div class="dev-panel-name">' + S.activeDev + '</div>' +
      '<button class="icon-button-ghost" onclick="S.activeDev=null;renderAll()"><i data-lucide="x"></i></button>' +
    '</div>' +
    '<div class="dev-panel-country">' + (countries.map(countryWithFlag).join(' · ') || '—') + '</div>' +
    '<div class="dev-panel-badges badge-wrapper">' +
      versions.map(function(vId) { return versionBadge(vId); }).join('') +
      tags.map(tagBadge).join('') +
    '</div>';
}

// ── Result count ──────────────────────────────────────────

function updateResultCount(n) {
  var el          = document.getElementById('results-count');
  var isFiltering = S.filters.search || activeFilterCount() > 0;
  el.textContent  = isFiltering ? i('found', n) : '';
  el.classList.toggle('vis', !!isFiltering);
}

// ── Columns menu (hidden in cards view) ───────────────────

function renderColumnsMenu() {
  var wrapper = document.getElementById('columns-wrapper-el');
  if (wrapper) wrapper.style.display = S.view === 'cards' ? 'none' : '';

  var fanDevGrayed = !S.cols.fanLang;
  var labels = {
    developer: i('dev'),    version: i('ver'),   year:   i('yr'),
    country:   i('country'), tags:   i('tags'),
    fanLang:   i('fanTranslation'), fanDev: i('fanDeveloper'),
  };

  document.getElementById('columns-menu').innerHTML = Object.entries(labels).map(function(entry) {
    var k     = entry[0];
    var label = entry[1];
    var checked  = S.cols[k];
    var disabled = k === 'fanDev' && fanDevGrayed;
    return '<label class="' + (disabled ? 'col-check-disabled' : '') + '">' +
      '<input type="checkbox" ' + (checked ? 'checked' : '') +
      (disabled ? ' disabled' : ' onchange="toggleColumn(\'' + k + '\')"') + '/> ' + label +
      '</label>';
  }).join('');
}

// ── Admin bar ─────────────────────────────────────────────

function updateAdminBar() {
  var bar = document.getElementById('admin-bar');
  bar.style.display = S.isAdmin ? 'flex' : 'none';
  if (S.isAdmin && S.profile) {
    setText('admin-username-label', S.profile.username);
    setText('admin-role-label',     roleLabel(S.profile.role));
  }
}

// ── Table headers ─────────────────────────────────────────

function renderTableHeaders() {
  var fanDevVisible = S.cols.fanDev && S.cols.fanLang;
  var cols = [
    { id: 'title',   label: i('title'),          cls: 'col-title sortable'  },
    S.cols.developer ? { id: 'developer', label: i('dev'),           cls: 'sortable'    } : null,
    S.cols.country   ? { id: 'country',   label: i('country'),       cls: 'sortable'    } : null,
    S.cols.year      ? { id: 'year',      label: i('yr'),            cls: 'sortable'    } : null,
    S.cols.version   ? { id: 'version',   label: i('ver'),           cls: ''            } : null,
    S.cols.tags      ? { id: 'tags',      label: i('tags'),          cls: 'col-tags'    } : null,
    S.cols.fanLang   ? { id: 'fanLang',   label: i('fanTranslation'),cls: 'sortable'    } : null,
    fanDevVisible    ? { id: 'fanDev',    label: i('fanDeveloper'),  cls: ''            } : null,
    { id: 'download',  label: i('dl'),            cls: 'col-download'  },
    S.isAdmin        ? { id: 'actions',   label: i('actions'),       cls: 'col-actions' } : null,
  ].filter(Boolean);

  document.getElementById('table-header-row').innerHTML = cols.map(function(c) {
    var sortable = c.cls.indexOf('sortable') !== -1;
    var active   = S.sort.col === c.id;
    var sortCls  = active ? (S.sort.dir === 'asc' ? 'sort-asc' : 'sort-desc') : '';
    var arrowIcon = (active && S.sort.dir === 'asc') ? 'arrow-down' : 'arrow-up';
    return '<th class="' + c.cls + ' ' + sortCls + '" ' +
           (sortable ? 'onclick="sortBy(\'' + c.id + '\')"' : '') + '>' +
           c.label + (sortable ? '<i class="sort-indicator" data-lucide="' + arrowIcon + '"></i>' : '') +
           '</th>';
  }).join('');
}

function gameRow(g) {
  var fanDevVisible = S.cols.fanDev && S.cols.fanLang;
  var verName       = (function() { var v = VERSIONS.find(function(v) { return v.id === g.vId; }); return v ? v.name : ''; })();
  var esc           = function(s) { return (s || '').replace(/"/g, '&quot;'); };
  var titleIcon     = g.fanLang ? '<i data-lucide="languages" class="title-fan-icon"></i> ' : '';
  return '<tr' +
    ' data-ss="' + (g.ss || '') + '"' +
    ' data-title="' + esc(g.title) + '"' +
    ' onclick="openGameModal(\'' + g.id + '\')"' +
    ' onmouseenter="showTooltip(event,this)"' +
    ' onmouseleave="hideTooltip()">' +
    '<td class="col-title">' + titleIcon + g.title + '</td>' +
    (S.cols.developer ? '<td class="col-developer">' + devLinks(g.developer) + '</td>' : '') +
    (S.cols.country   ? '<td class="col-country"><span class="col-search-link" data-search="' + esc(g.country) + '" onclick="event.stopPropagation();toggleCountry(this.dataset.search)">' + countryWithFlag(g.country) + '</span></td>' : '') +
    (S.cols.year      ? '<td class="col-year"><span class="col-search-link" data-search="' + g.year + '" onclick="event.stopPropagation();toggleYear(parseInt(this.dataset.search,10))">' + g.year + '</span></td>' : '') +
    (S.cols.version   ? '<td class="col-version"><span class="col-search-link" data-search="' + g.vId + '" onclick="event.stopPropagation();toggleVersion(this.dataset.search)">' + verName + '</span></td>' : '') +
    (S.cols.tags      ? '<td class="col-tags"><div class="badge-wrapper">' + g.tags.map(tagBadge).join('') + '</div></td>' : '') +
    (S.cols.fanLang   ? '<td class="col-fan-lang">' + fanLangLink(g) + '</td>' : '') +
    (fanDevVisible    ? '<td class="col-fan-dev">'  + fanDevLink(g)  + '</td>' : '') +
    '<td class="col-download"><div class="badge-wrapper">' + downloadBadge(g, 'button-base-sm') + '</div></td>' +
    (S.isAdmin ? '<td><div class="action-buttons">' + adminBtns(g, true) + '</div></td>' : '') +
    '</tr>';
}

function renderTable(games) {
  document.getElementById('table-body').innerHTML = games.length
    ? games.map(gameRow).join('')
    : '<tr><td colspan="12"><div class="empty-state"><i data-lucide="search-x"></i><p>Nenhum resultado</p></div></td></tr>';
}

// ── Cards ─────────────────────────────────────────────────

function gameCard(g, idx) {
  var ss      = g.ss ? '<img class="card-screenshot" src="' + g.ss + '" alt="' + g.title + '" loading="lazy"' +
                       ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' : '';
  var visible = g.tags.slice(0, 4);
  var extra   = g.tags.length - 4;
  var extraBtn = extra > 0
    ? '<span class="badge badge-tag" onclick="event.stopPropagation();openGameModal(\'' + g.id + '\')">' + extra + '+ tags</span>'
    : '';
  var translationRow = g.fanLang
    ? '<div class="card-translation"><i data-lucide="languages"></i> ' + g.fanLang + ' translation by ' + (g.fanDev || '—') + '</div>'
    : '';
  var titleIcon = g.fanLang ? '<i data-lucide="languages" class="title-fan-icon"></i> ' : '';

  return '<div class="card" style="animation-delay:' + Math.min(idx * 25, 200) + 'ms" onclick="openGameModal(\'' + g.id + '\')">' +
    ss +
    '<div class="card-screenshot-fallback" style="' + (g.ss ? 'display:none' : 'display:flex') + '" data-i18n="noss"></div>' +
    '<div class="card-body">' +
      '<div class="card-title">' + titleIcon + g.title + '</div>' +
      '<div class="card-developer">' +
        '<div class="card-dev-name">' + devLinks(g.developer) + '</div>' +
        '<span class="card-dev-meta"> · ' + g.year + ' · ' + countryWithFlag(g.country) + '</span>' +
      '</div>' +
      translationRow +
      '<div class="card-badges badge-wrapper">' + versionBadge(g.vId) + visible.map(tagBadge).join('') + extraBtn + '</div>' +
    '</div>' +
    '<div class="card-footer">' +
      '<div></div>' +
      '<div class="card-footer-right">' + adminBtns(g, true) + downloadBadge(g, 'button-base-md') + '</div>' +
    '</div>' +
  '</div>';
}

function renderCards(games) {
  var addBtn = S.isAdmin
    ? '<div class="card-add-button" onclick="openEdit(null)" role="button" tabindex="0">' +
        '<div class="card-add-content"><i data-lucide="plus"></i>' +
        '<span class="add-label" data-i18n="addgame"></span></div></div>'
    : '';
  document.getElementById('cards-grid').innerHTML = addBtn +
    (games.length ? games.map(gameCard).join('') :
      '<div class="empty-state"><i data-lucide="search-x"></i><p>Nenhum resultado</p></div>');
}

// ── Game Detail Modal ─────────────────────────────────────

function openGameModal(gameId) {
  var g = GAMES.find(function(x) { return x.id === gameId; });
  if (!g) return;
  S.activeModalGameId = gameId;

  var ssImg = document.getElementById('game-detail-screenshot');
  var ssFb  = document.getElementById('game-detail-screenshot-fallback');
  if (g.ss) { ssImg.src = g.ss; ssImg.style.display = 'block'; ssFb.style.display = 'none'; }
  else       { ssImg.style.display = 'none'; ssFb.style.display = 'flex'; ssFb.textContent = i('noss'); }

  var titlePill = document.getElementById('game-detail-title');
  if (titlePill) {
    var titleIcon = g.fanLang ? '<i data-lucide="languages"></i> ' : '';
    titlePill.innerHTML = titleIcon + g.title;
  }

  var idEl = document.getElementById('game-detail-id');
  if (idEl) idEl.textContent = S.isAdmin ? '#' + g.id : '';

  _renderModalMeta(g);
  _renderModalTags(g);

  var responsibleHtml = g.signedBy
    ? '<span class="game-detail-responsible">' + i('responsible') + ' <strong>' + g.signedBy + '</strong></span>'
    : '<span></span>';

  document.getElementById('game-detail-footer').innerHTML =
    responsibleHtml +
    '<div class="game-detail-footer-right">' +
      (S.isAdmin && canEditGame(g)
        ? '<button class="icon-button-ghost" onclick="closeModal(\'game-detail-modal\');openEdit(\'' + g.id + '\')"><i data-lucide="pencil"></i></button>' +
          '<button class="icon-button-ghost icon-button-ghost-danger" onclick="closeModal(\'game-detail-modal\');delGame(\'' + g.id + '\')"><i data-lucide="trash-2"></i></button>'
        : '') +
      downloadBadge(g, 'button-base-md') +
    '</div>';

  openModal('game-detail-modal');
  if (window.lucide) window.lucide.createIcons();
}

function _renderModalMeta(g) {
  var esc = function(s) { return (s || '').replace(/"/g, '&quot;'); };
  document.getElementById('game-detail-meta').innerHTML =
    '<div class="game-detail-meta-row">' +
      '<span class="gd-dev">' + devLinks(g.developer) + '</span>' +
      '<span class="gd-sep">·</span>' +
      '<span class="gd-year col-search-link" data-search="' + g.year + '"' +
            ' onclick="toggleYear(parseInt(this.dataset.search,10))">' + (g.year || '—') + '</span>' +
      '<span class="gd-sep">·</span>' +
      '<span class="gd-country col-search-link" data-search="' + esc(g.country) + '"' +
            ' onclick="toggleCountry(this.dataset.search)">' + (countryWithFlag(g.country) || 'Unknown') + '</span>' +
    '</div>';
}

function _renderModalTags(g) {
  var translationLine = g.fanLang
    ? '<div class="card-translation"><i data-lucide="languages"></i> ' + g.fanLang + ' translation by ' + (g.fanDev || '—') + '</div>'
    : '';
  document.getElementById('game-detail-tags').innerHTML =
    translationLine +
    '<div class="badge-wrapper">' + versionBadge(g.vId) + g.tags.map(tagBadge).join('') + '</div>';
  if (window.lucide) window.lucide.createIcons();
}

function refreshOpenModal() {
  if (!S.activeModalGameId) return;
  var modal = document.getElementById('game-detail-modal');
  if (!modal || !modal.classList.contains('open')) return;
  var g = GAMES.find(function(x) { return x.id === S.activeModalGameId; });
  if (!g) return;
  _renderModalMeta(g);
  _renderModalTags(g);
}
