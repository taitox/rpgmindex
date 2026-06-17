'use strict';

// ── Utility ───────────────────────────────────────────────

function toggleInArray(arr, item) {
  var idx = arr.indexOf(item);
  if (idx >= 0) { arr.splice(idx, 1); } else { arr.push(item); }
}

const PROTECTED_TAGS = ['Lost Media', 'Found Media'];
function isProtectedTag(name) {
  return PROTECTED_TAGS.some(function(t) {
    return t.toLowerCase() === (name || '').toLowerCase();
  });
}

function activeFilterCount() {
  return S.filters.versions.length      + S.filters.countries.length +
         S.filters.years.length         + S.filters.tags.length      +
         S.filters.blacklistTags.length + S.filters.fanLangs.length;
}

// ── Role helpers ──────────────────────────────────────────

function isArchiver() {
  return !!(S.profile && S.profile.role === 'archiver');
}

function isMod() {
  return !!(S.profile && S.profile.role === 'mod');
}

// An admin can edit a game if they are an archiver (any game)
// or a mod who originally signed the game.
function canEditGame(g) {
  if (!S.isAdmin || !S.profile) return false;
  if (isArchiver()) return true;
  return !!(g && g.signedBy && g.signedBy === S.profile.username);
}

function roleLabel(role) {
  return role === 'archiver' ? i('roleArchiver') : i('roleMod');
}

// ── Developer string helpers ──────────────────────────────

function splitDev(dev) {
  return (dev || '').split(';').map(function(s) { return s.trim(); }).filter(Boolean);
}

function devLinks(dev) {
  var parts = splitDev(dev);
  if (!parts.length) return '—';
  return parts.map(function(p) {
    return '<span class="dev-link" data-dev="' + p.replace(/"/g, '&quot;') + '"' +
           ' onclick="event.stopPropagation();toggleDev(this.dataset.dev)">' + p + '</span>';
  }).join(' · ');
}

// ── Badge / chip builders ─────────────────────────────────

function makeChip(label, onclickExpr, cssClass) {
  return '<span class="adv-chip ' + cssClass + '">' + label +
         '<button onclick="' + onclickExpr + '" aria-label="Remove">\xd7</button></span>';
}

// g is the full game object — needed for canEditGame() role check.
function adminBtns(g, stopProp) {
  if (!S.isAdmin || !canEditGame(g)) return '';
  var stop = stopProp ? 'event.stopPropagation();' : '';
  var id   = g.id;
  return '<button class="action-button" onclick="' + stop + 'openEdit(\'' + id + '\')" title="' + i('editgame') + '">✏️</button>' +
         '<button class="action-button delete-button" onclick="' + stop + 'delGame(\'' + id + '\')" title="Delete">🗑️</button>';
}

function downloadBadge(g) {
  if (g.isLostMedia) {
    var archiveBtn = g.archiveUrl
      ? '<a href="' + g.archiveUrl + '" target="_blank" rel="noopener"' +
        ' class="badge badge-download badge-archive" onclick="event.stopPropagation()">📦 Archive</a>'
      : '';
    var proofBtn = g.url
      ? '<a href="' + g.url + '" target="_blank" rel="noopener"' +
        ' class="badge badge-download badge-unavailable" onclick="event.stopPropagation()">🔍 ' + i('na') + '</a>'
      : '<span class="badge badge-download badge-unavailable">❌ ' + i('na') + '</span>';
    return proofBtn + archiveBtn;
  }

  var hasSource  = !!g.url;
  var hasArchive = !!g.archiveUrl;
  if (!hasSource && !hasArchive) {
    return '<span class="badge badge-download badge-unavailable">❌ ' + i('na') + '</span>';
  }
  var html = '';
  if (hasSource) {
    var isSteam = g.url.indexOf('store.steampowered.com') !== -1;
    var isItch  = g.url.indexOf('itch.io') !== -1;
    var label   = isSteam ? 'Steam' : isItch ? 'itch.io' : '⬇ ' + i('dl');
    var cls     = isSteam ? 'badge-steam' : isItch ? 'badge-itchio' : 'badge-free';
    html += '<a href="' + g.url + '" target="_blank" rel="noopener"' +
            ' class="badge badge-download ' + cls + '" onclick="event.stopPropagation()">' + label + '</a>';
  }
  if (hasArchive) {
    var aLabel = hasSource ? '📦' : '📦 Archive';
    var aCls   = hasSource ? 'badge-archive-icon' : 'badge-archive';
    html += '<a href="' + g.archiveUrl + '" target="_blank" rel="noopener"' +
            ' class="badge badge-download ' + aCls + '" onclick="event.stopPropagation()">' + aLabel + '</a>';
  }
  return html;
}

function versionBadge(vId, showIcon) {
  var v = VERSIONS.find(function(v) { return v.id === vId; });
  if (!v) return '';
  var active   = S.filters.versions.indexOf(vId) !== -1;
  var iconHtml = (showIcon && v.iconUrl)
    ? '<img src="' + v.iconUrl + '" class="version-icon" alt=""/> ' : '';
  return '<span class="badge badge-version' + (active ? ' active-filter' : '') + '"' +
         ' onclick="event.stopPropagation();toggleVersion(\'' + vId + '\')"' +
         ' role="button" tabindex="0">' + iconHtml + v.name + '</span>';
}

function tagBadge(tagName) {
  var isActive = S.filters.tags.indexOf(tagName) !== -1;
  var def      = TAGS.find(function(t) { return t.name === tagName; });
  var style    = (def && def.bg)
    ? 'style="background:' + def.bg + ';color:' + def.tx + ';border-color:' + def.bd + '"' : '';
  return '<span class="badge badge-tag' + (isActive ? ' active-filter' : '') + '" ' + style +
         ' onclick="event.stopPropagation();toggleTag(\'' + tagName.replace(/'/g, "\\'") + '\')"' +
         ' role="button" tabindex="0">' + tagName + '</span>';
}

// ── Filter pipeline ───────────────────────────────────────

function filterGames() {
  var f = S.filters;
  return GAMES.filter(function(g) {
    if (f.search) {
      var q = f.search.toLowerCase();
      var ver = VERSIONS.find(function(v) { return v.id === g.vId; });
      if (g.title.toLowerCase().indexOf(q)      === -1 &&
          g.developer.toLowerCase().indexOf(q)  === -1 &&
          String(g.year).indexOf(q)             === -1 &&
          g.country.toLowerCase().indexOf(q)    === -1 &&
          !(g.fanLang && g.fanLang.toLowerCase().indexOf(q) !== -1) &&
          !(g.fanDev  && g.fanDev.toLowerCase().indexOf(q)  !== -1) &&
          !(ver && ver.name.toLowerCase().indexOf(q) !== -1) &&
          !g.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1; })) {
        return false;
      }
    }
    if (f.versions.length  && f.versions.indexOf(g.vId)      === -1) return false;
    if (f.countries.length && f.countries.indexOf(g.country)  === -1) return false;
    if (f.years.length     && f.years.indexOf(g.year)         === -1) return false;
    if (f.fanLangs.length  && f.fanLangs.indexOf(g.fanLang)   === -1) return false;
    if (f.blacklistTags.length &&
        f.blacklistTags.some(function(t) { return g.tags.indexOf(t) !== -1; })) return false;
    if (f.tags.length) {
      var ok = f.tagMode === 'or'
        ? f.tags.some(function(t)  { return g.tags.indexOf(t) !== -1; })
        : f.tags.every(function(t) { return g.tags.indexOf(t) !== -1; });
      if (!ok) return false;
    }
    return true;
  });
}

// ── Sort pipeline ─────────────────────────────────────────

function sortGames(games) {
  var col  = S.sort.col;
  var dir  = S.sort.dir;
  var sign = dir === 'asc' ? 1 : -1;
  return games.slice().sort(function(a, b) {
    var av, bv;
    if      (col === 'developer') { av = a.developer.toLowerCase(); bv = b.developer.toLowerCase(); }
    else if (col === 'year')      { av = a.year;                    bv = b.year;                    }
    else if (col === 'country')   { av = a.country.toLowerCase();   bv = b.country.toLowerCase();   }
    else if (col === 'fanLang')   { av = (a.fanLang || '').toLowerCase(); bv = (b.fanLang || '').toLowerCase(); }
    else                          { av = a.title.toLowerCase();     bv = b.title.toLowerCase();     }
    if (av !== bv) return av < bv ? -sign : sign;
    var ta = a.title.toLowerCase(), tb = b.title.toLowerCase();
    if (ta !== tb) return ta < tb ? -1 : 1;
    var da = a.developer.toLowerCase(), db = b.developer.toLowerCase();
    if (da !== db) return da < db ? -1 : 1;
    if (a.year !== b.year) return a.year - b.year;
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
}
