'use strict';

// ── Utility ───────────────────────────────────────────────

// Toggle an item in an array in-place. Returns nothing — mutates arr.
function toggleInArray(arr, item) {
  const idx = arr.indexOf(item);
  idx >= 0 ? arr.splice(idx, 1) : arr.push(item);
}

// Count all active advanced search filters.
function activeFilterCount() {
  return S.filters.versions.length + S.filters.countries.length +
         (S.filters.freeOnly ? 1 : 0) + S.filters.tags.length;
}

// ── Badge / chip builders ─────────────────────────────────

// A single removable chip for the advanced search chip row.
function makeChip(label, onclickExpr, cssClass) {
  return `<span class="adv-chip ${cssClass}">${label}
    <button onclick="${onclickExpr}" aria-label="Remove">×</button>
  </span>`;
}

// Edit/delete button pair for admin; returns '' for non-admin.
function adminBtns(gameId, stopProp) {
  if (!S.isAdmin) return '';
  const stop = stopProp ? 'event.stopPropagation();' : '';
  return `<button class="action-button" onclick="${stop}openEdit('${gameId}')" title="${i('editgame')}">✏️</button>
          <button class="action-button delete-button" onclick="${stop}delGame('${gameId}')" title="Delete">🗑️</button>`;
}

function downloadBadge(g) {
  if (!g.url) return `<span class="badge badge-download badge-unavailable">❌ ${i('na')}</span>`;
  return `<a href="${g.url}" target="_blank" rel="noopener" class="badge badge-download badge-free"
     onclick="event.stopPropagation()">⬇ ${i('dl')}</a>`;
}

function versionBadge(vId) {
  const v = VERSIONS.find(v => v.id === vId);
  if (!v) return '';
  const active = S.filters.versions.includes(vId);
  return `<span class="badge badge-version ${active ? 'active-filter' : ''}"
    onclick="event.stopPropagation();toggleVersion('${vId}')"
    role="button" tabindex="0">${v.label}</span>`;
}

function tagBadge(tagName) {
  const isFree   = tagName === 'Free';
  const isActive = isFree ? S.filters.freeOnly : S.filters.tags.includes(tagName);
  const def      = TAGS.find(t => t.name === tagName);
  const cls      = `badge badge-tag ${isFree ? 'badge-tag-free' : ''} ${isActive ? 'active-filter' : ''}`.trimEnd();
  const style    = (!isFree && def?.bg) ? `style="background:${def.bg};color:${def.tx};border-color:${def.bd}"` : '';
  // toggleTag('Free') internally redirects to toggleFreeOnly — no need to special-case here
  return `<span class="${cls}" ${style} onclick="event.stopPropagation();toggleTag('${tagName}')" role="button" tabindex="0">${tagName}</span>`;
}

// ── Filter pipeline ───────────────────────────────────────

function filterGames() {
  const f = S.filters;
  return GAMES.filter(g => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!g.title.toLowerCase().includes(q)     &&
          !g.developer.toLowerCase().includes(q) &&
          !String(g.year).includes(q)            &&
          !g.country.toLowerCase().includes(q)   &&
          !(VERSIONS.find(v => v.id === g.vId)?.label.toLowerCase().includes(q)) &&
          !g.tags.some(t => t.toLowerCase().includes(q))) return false;
    }
    if (f.versions.length  && !f.versions.includes(g.vId))      return false;
    if (f.freeOnly         && !g.tags.includes('Free'))           return false;
    if (f.countries.length && !f.countries.includes(g.country))  return false;
    if (f.tags.length) {
      const ok = f.tagMode === 'or'
        ? f.tags.some(t  => g.tags.includes(t))
        : f.tags.every(t => g.tags.includes(t));
      if (!ok) return false;
    }
    return true;
  });
}

// ── Sort pipeline ─────────────────────────────────────────

function sortGames(games) {
  const { col, dir } = S.sort;
  const sign = dir === 'asc' ? 1 : -1;

  return [...games].sort((a, b) => {
    let av, bv;
    if      (col === 'developer') { av = a.developer.toLowerCase(); bv = b.developer.toLowerCase(); }
    else if (col === 'year')      { av = a.year;                    bv = b.year;                    }
    else if (col === 'country')   { av = a.country.toLowerCase();   bv = b.country.toLowerCase();   }
    else                          { av = a.title.toLowerCase();     bv = b.title.toLowerCase();     }

    if (av !== bv) return av < bv ? -sign : sign;

    // Tiebreakers (always ascending): title → developer → year → date added
    const ta = a.title.toLowerCase(), tb = b.title.toLowerCase();
    if (ta !== tb) return ta < tb ? -1 : 1;
    const da = a.developer.toLowerCase(), db = b.developer.toLowerCase();
    if (da !== db) return da < db ? -1 : 1;
    if (a.year !== b.year) return a.year - b.year;
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
}
