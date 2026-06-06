/* jshint esversion: 6 */
'use strict';

// ── Version lookup ────────────────────────────────────────

function getVer(id) {
  return VERSIONS.find(v => v.id === id);
}

// ── Badge HTML builders ───────────────────────────────────

function downloadBadge(g) {
  if (!g.url) {
    return `<span class="badge badge-download badge-unavailable">${i('unavail')}</span>`;
  }
  return `<a href="${g.url}" target="_blank" rel="noopener" class="badge badge-download badge-free" onclick="event.stopPropagation()">⬇ ${i('dl')}</a>`;
}

function versionBadge(vId) {
  const v = getVer(vId);
  if (!v) return '';
  return `<span class="badge" style="background:${v.bg};color:${v.tx};border-color:${v.bd}">${v.label}</span>`;
}

function tagBadge(tagName) {
  const active = S.filters.tags.includes(tagName) ? 'active-filter' : '';

  // "Free" — reserved dark green, always hardcoded via CSS class
  if (tagName === 'Free') {
    return `<span class="badge badge-tag badge-tag-free ${active}" onclick="event.stopPropagation();toggleTag('${tagName}')" role="button" tabindex="0">${tagName}</span>`;
  }

  // Other tags — use custom DB colors if defined, otherwise CSS defaults
  const def    = TAGS.find(t => t.name === tagName);
  const hasCls = def && def.bg && def.tx && def.bd;
  const style  = hasCls ? `style="background:${def.bg};color:${def.tx};border-color:${def.bd}"` : '';

  return `<span class="badge badge-tag ${active}" ${style} onclick="event.stopPropagation();toggleTag('${tagName}')" role="button" tabindex="0">${tagName}</span>`;
}

// ── Filter + sort pipeline ────────────────────────────────

function filteredGames() {
  const f = S.filters;

  const gs = GAMES.filter(g => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hit =
        g.title.toLowerCase().includes(q)     ||
        g.developer.toLowerCase().includes(q) ||
        String(g.year).includes(q)            ||
        g.country.toLowerCase().includes(q)   ||
        (getVer(g.vId)?.label.toLowerCase().includes(q)) ||
        g.tags.some(t => t.toLowerCase().includes(q));
      if (!hit) return false;
    }

    if (f.version  && g.vId !== f.version)          return false;
    if (f.freeOnly && !g.tags.includes('Free'))      return false;

    if (f.tags.length > 0) {
      const matches = f.tagMode === 'or'
        ? f.tags.some(t  => g.tags.includes(t))
        : f.tags.every(t => g.tags.includes(t));
      if (!matches) return false;
    }

    return true;
  });

  const { col, dir } = S.sort;
  const sign = dir === 'asc' ? 1 : -1;

  gs.sort((a, b) => {
    // Primary sort — the column the user selected
    let av, bv;
    switch (col) {
      case 'developer': av = a.developer.toLowerCase(); bv = b.developer.toLowerCase(); break;
      case 'year':      av = a.year;                    bv = b.year;                    break;
      case 'country':   av = a.country.toLowerCase();   bv = b.country.toLowerCase();   break;
      default:          av = a.title.toLowerCase();     bv = b.title.toLowerCase();
    }
    if (av !== bv) return av < bv ? -sign : sign;

    // Tiebreakers — always ascending: title → developer → year → date added
    const ta = a.title.toLowerCase(), tb = b.title.toLowerCase();
    if (ta !== tb) return ta < tb ? -1 : 1;

    const da = a.developer.toLowerCase(), db = b.developer.toLowerCase();
    if (da !== db) return da < db ? -1 : 1;

    if (a.year !== b.year) return a.year - b.year;

    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });

  return gs;
}
