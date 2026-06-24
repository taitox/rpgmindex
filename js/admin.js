'use strict';

// ── Change this value to adjust the deferred action delay ─
const PENDING_ACTION_DELAY_MS = 60 * 60 * 1000; // 1 hour

var editForm = { tags: [], tagFilter: '' };

// ── Login / logout ────────────────────────────────────────

function adminClick() {
  if (S.isAdmin) return;
  document.getElementById('login-error').style.display = 'none';
  openModal('login-modal');
}

async function doLogin() {
  var email  = document.getElementById('login-email').value.trim();
  var pass   = document.getElementById('login-password').value;
  var errEl  = document.getElementById('login-error');
  errEl.style.display = 'none';
  var result = await sb.auth.signInWithPassword({ email: email, password: pass });
  if (result.error) { errEl.style.display = 'block'; return; }
  S.session = result.data.session;
  S.isAdmin = true;
  await loadProfile();
  closeModal('login-modal');
  renderAll();
}

async function doLogout() {
  await sb.auth.signOut();
  S.session = null;
  S.isAdmin = false;
  S.profile = null;
  closeModal('settings-modal');
  renderAll();
}

// ── Edit / Add game ───────────────────────────────────────

function openEdit(gameId) {
  var g = gameId ? GAMES.find(function(x) { return x.id === gameId; }) : null;

  document.getElementById('developer-list').innerHTML =
    getDevList().map(function(d) { return '<option value="' + d + '"/>'; }).join('');
  document.getElementById('country-datalist').innerHTML =
    COUNTRIES.map(function(pair) { return '<option value="' + pair[0] + '"/>'; }).join('');
  document.getElementById('fanlang-datalist').innerHTML =
    FAN_LANGUAGES.map(function(l) { return '<option value="' + l + '"/>'; }).join('');

  editForm.tags      = (g ? g.tags : []).map(function(name) { return { name: name, isNew: false }; });
  editForm.tagFilter = '';

  document.getElementById('edit-game-id').value        = gameId || '';
  document.getElementById('edit-game-title').value     = g ? g.title     : '';
  document.getElementById('edit-game-developer').value = g ? g.developer : '';
  document.getElementById('edit-game-version').value   = g ? g.vId       : (VERSIONS.length ? VERSIONS[0].id : '');
  document.getElementById('edit-game-year').value      = g ? g.year      : '';
  document.getElementById('edit-game-country').value   = g ? g.country   : 'Unknown';
  document.getElementById('edit-tag-input').value      = '';
  document.getElementById('edit-fan-lang').value       = (g && g.fanLang) ? g.fanLang : '';
  document.getElementById('edit-fan-dev').value        = (g && g.fanDev)  ? g.fanDev  : '';

  _initScreenshotField((g && g.ss) ? g.ss : null);
  _initDownloadFields(g);

  ['edit-tag-error','edit-title-error','edit-year-error',
   'edit-archive-error','edit-source-error','edit-fandev-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  renderEditTagChips();
  renderEditTagDropdown('');
  setText('edit-modal-title', gameId ? i('editgame') : i('addgame'));
  openModal('edit-modal');
}

// ── Download fields ───────────────────────────────────────

function _initDownloadFields(g) {
  var isLost = !!(g && g.isLostMedia);
  document.getElementById('lost-media-switch').checked = isLost;
  document.getElementById('edit-download-url').value     = (g && !isLost && g.url)        ? g.url        : '';
  document.getElementById('edit-archive-url').value      = (g && !isLost && g.archiveUrl) ? g.archiveUrl : '';
  document.getElementById('edit-proof-url').value        = (g && isLost  && g.url)        ? g.url        : '';
  document.getElementById('edit-lost-archive-url').value = (g && isLost  && g.archiveUrl) ? g.archiveUrl : '';
  toggleDownloadField();
  updateLostMediaLabelStyle();
}

function toggleDownloadField() {
  var isLostMedia = document.getElementById('lost-media-switch').checked;
  document.getElementById('download-available-fields').style.display = isLostMedia ? 'none' : '';
  document.getElementById('download-lost-fields').style.display      = isLostMedia ? '' : 'none';
}

// Lost Media label turns green (like a download badge) when a Proof URL is present.
function updateLostMediaLabelStyle() {
  var proofUrl = document.getElementById('edit-proof-url').value.trim();
  var label    = document.getElementById('lost-media-label');
  if (label) label.classList.toggle('lost-media-has-proof', !!proofUrl);
}

function _validateArchiveUrl(url) {
  if (!url) return true;
  try { return new URL(url).hostname.indexOf('archive.org') !== -1; } catch (_) { return false; }
}

// ── Screenshot ────────────────────────────────────────────

function _initScreenshotField(existingUrl) {
  var input = document.getElementById('edit-screenshot-url');
  var btn   = document.getElementById('screenshot-upload-btn');
  input.value    = existingUrl || '';
  input.disabled = !!existingUrl;
  btn.textContent = existingUrl ? i('deleteimage') : i('uploadimage');
}

function triggerScreenshotUpload() {
  var input = document.getElementById('edit-screenshot-url');
  if (input.disabled) {
    _deleteScreenshotFromStorage(input.value);
    _initScreenshotField(null);
  } else {
    document.getElementById('edit-screenshot-file-input').click();
  }
}

async function handleScreenshotFile(fileInput) {
  if (!fileInput.files.length) return;
  var url = await _uploadScreenshot(fileInput.files[0]);
  if (url) _initScreenshotField(url);
}

async function _uploadScreenshot(file) {
  var path = 'screenshots/' + Date.now() + '.' + file.name.split('.').pop();
  var upResult = await sb.storage.from('screenshots').upload(path, file);
  if (upResult.error) { console.error('Screenshot upload failed:', upResult.error.message); return null; }
  return sb.storage.from('screenshots').getPublicUrl(path).data.publicUrl || null;
}

async function _deleteScreenshotFromStorage(url) {
  if (!url) return;
  var match = url.match(/\/screenshots\/([^?]+)/);
  if (match) await sb.storage.from('screenshots').remove(['screenshots/' + match[1]]);
}

// ── Edit modal tag multi-select ───────────────────────────

function renderEditTagChips() {
  document.getElementById('edit-tag-chips').innerHTML = editForm.tags
    .filter(function(t) { return !isProtectedTag(t.name); })
    .map(function(t) {
      return '<span class="edit-tag-chip' + (t.isNew ? ' tag-new' : '') + '"' +
             (t.isNew ? ' title="' + i('newtag') + '"' : '') + '>' +
             (t.isNew ? '✨ ' : '') + t.name +
             '<button class="filter-token-remove" onclick="removeEditTag(\'' + t.name.replace(/'/g, "\\'") + '\')">\xd7</button>' +
             '</span>';
    }).join('');
}

function renderEditTagDropdown(filter) {
  if (filter !== undefined) editForm.tagFilter = filter;
  var dd      = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  var sel     = editForm.tags.map(function(t) { return t.name; });
  var q       = editForm.tagFilter.toLowerCase();
  var matches = TAGS.filter(function(t) {
    return !isProtectedTag(t.name) &&
           t.name.toLowerCase().indexOf(q) !== -1 &&
           sel.indexOf(t.name) === -1;
  });
  dd.innerHTML = matches.map(function(t) {
    return '<div class="ecb-option" onclick="toggleEditTag(\'' + t.name.replace(/'/g, "\\'") + '\',false)">' + t.name + '</div>';
  }).join('') || (q ? '<div class="ecb-empty">\u21b5 Enter to add "<strong>' + editForm.tagFilter + '</strong>"</div>' : '');
  dd.classList.toggle('open', matches.length > 0 || q.length > 0);
}

function toggleEditTagDropdown() {
  var dd = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  if (dd.classList.contains('open')) { dd.classList.remove('open'); } else { renderEditTagDropdown(editForm.tagFilter); }
}

function onEditTagInput(value) { renderEditTagDropdown(value); }

function onEditTagKeydown(event) {
  if (event.key === 'Escape') {
    var _dd = document.getElementById('edit-tag-dropdown');
    if (_dd) _dd.classList.remove('open');
    return;
  }
  if (event.key !== 'Enter') return;
  event.preventDefault();
  var value = editForm.tagFilter.trim();
  if (!value) return;
  if (editForm.tags.find(function(t) { return t.name.toLowerCase() === value.toLowerCase(); })) return;
  if (isProtectedTag(value)) {
    var tagErr = document.getElementById('edit-tag-error');
    if (tagErr) { tagErr.textContent = i('protectedtag'); tagErr.style.display = 'block'; }
    return;
  }
  var existing = TAGS.find(function(t) { return t.name.toLowerCase() === value.toLowerCase(); });
  editForm.tags.push({ name: existing ? existing.name : value, isNew: !existing });
  document.getElementById('edit-tag-input').value = '';
  editForm.tagFilter = '';
  var tagErrEl = document.getElementById('edit-tag-error');
  if (tagErrEl) tagErrEl.style.display = 'none';
  renderEditTagChips();
  renderEditTagDropdown('');
}

function toggleEditTag(name, isNew) {
  var idx = editForm.tags.findIndex(function(t) { return t.name === name; });
  if (idx >= 0) { editForm.tags.splice(idx, 1); } else { editForm.tags.push({ name: name, isNew: !!isNew }); }
  document.getElementById('edit-tag-input').value = '';
  editForm.tagFilter = '';
  renderEditTagChips();
  renderEditTagDropdown('');
}

function removeEditTag(name) {
  editForm.tags = editForm.tags.filter(function(t) { return t.name !== name; });
  renderEditTagChips();
  renderEditTagDropdown(editForm.tagFilter);
}

// ── Save game ─────────────────────────────────────────────

async function saveGame() {
  var valid = true;

  var title    = document.getElementById('edit-game-title').value.trim();
  var titleErr = document.getElementById('edit-title-error');
  if (!title) { titleErr.textContent = i('notitle'); titleErr.style.display = 'block'; valid = false; }
  else titleErr.style.display = 'none';

  var yearVal = document.getElementById('edit-game-year').value.trim();
  var yearErr = document.getElementById('edit-year-error');
  if (!/^(19|20)\d{2}$/.test(yearVal)) {
    yearErr.textContent = i('invalidyear'); yearErr.style.display = 'block';
    document.getElementById('edit-game-year').classList.add('field-error');
    valid = false;
  } else {
    yearErr.style.display = 'none';
    document.getElementById('edit-game-year').classList.remove('field-error');
  }

  var isLostMedia    = document.getElementById('lost-media-switch').checked;
  var isAvailable    = !isLostMedia;
  var sourceUrl      = document.getElementById('edit-download-url').value.trim();
  var availArchive   = document.getElementById('edit-archive-url').value.trim();
  var proofUrl       = document.getElementById('edit-proof-url').value.trim();
  var lostArchiveUrl = document.getElementById('edit-lost-archive-url').value.trim();
  var archiveErr     = document.getElementById('edit-archive-error');
  var sourceErr      = document.getElementById('edit-source-error');

  if (isAvailable) {
    if (!sourceUrl && !availArchive) {
      sourceErr.textContent = i('sourceOrArchive'); sourceErr.style.display = 'block'; valid = false;
    } else { sourceErr.style.display = 'none'; }
    if (availArchive && !_validateArchiveUrl(availArchive)) {
      archiveErr.textContent = i('invalidarchive'); archiveErr.style.display = 'block'; valid = false;
    } else { archiveErr.style.display = 'none'; }
  } else {
    sourceErr.style.display = 'none';
    if (lostArchiveUrl && !_validateArchiveUrl(lostArchiveUrl)) {
      archiveErr.textContent = i('invalidarchive'); archiveErr.style.display = 'block'; valid = false;
    } else { archiveErr.style.display = 'none'; }
  }

  var fanLang   = document.getElementById('edit-fan-lang').value.trim();
  var fanDev    = document.getElementById('edit-fan-dev').value.trim();
  var fanDevErr = document.getElementById('edit-fandev-error');
  if (fanLang && !fanDev) { fanDevErr.textContent = i('fanDevRequired'); fanDevErr.style.display = 'block'; valid = false; }
  else fanDevErr.style.display = 'none';

  var tagErr = document.getElementById('edit-tag-error');

  if (!valid) return;

  // Auto-manage protected tags for Lost Media mode
  if (isLostMedia) {
    editForm.tags = editForm.tags.filter(function(t) {
      return t.name !== 'Lost Media' && t.name !== 'Found Media';
    });
    editForm.tags.push({ name: lostArchiveUrl ? 'Found Media' : 'Lost Media', isNew: false });
  }

  if (!editForm.tags.length) { tagErr.style.display = 'block'; return; }
  tagErr.style.display = 'none';

  showLoading();

  var newTags = editForm.tags.filter(function(t) { return t.isNew; });
  if (newTags.length) {
    await sb.from('tags').upsert(
      newTags.map(function(t) { return { name: t.name }; }),
      { onConflict: 'name' }
    );
  }

  var ss     = document.getElementById('edit-screenshot-url').value.trim() || null;
  var gameId = document.getElementById('edit-game-id').value;

  // Signing: preserve existing signed_by when editing; set current username when adding
  var existingGame = gameId ? GAMES.find(function(x) { return x.id === gameId; }) : null;
  var signedBy = existingGame
    ? (existingGame.signedBy || (S.profile ? S.profile.username : null))
    : (S.profile ? S.profile.username : null);

  var game = {
    title:         title,
    developer:     document.getElementById('edit-game-developer').value.trim() || '',
    v_id:          document.getElementById('edit-game-version').value || (VERSIONS.length ? VERSIONS[0].id : ''),
    year:          parseInt(yearVal, 10),
    country:       document.getElementById('edit-game-country').value.trim() || 'Unknown',
    tags:          editForm.tags.map(function(t) { return t.name; }),
    ss:            ss,
    is_lost_media: isLostMedia,
    url:           isAvailable ? (sourceUrl      || null) : (proofUrl       || null),
    archive_url:   isAvailable ? (availArchive   || null) : (lostArchiveUrl || null),
    fan_lang:      fanLang || null,
    fan_dev:       fanDev  || null,
    signed_by:     signedBy,
  };
  if (gameId) game.id = gameId;

  var upsertResult = await sb.from('games').upsert(game);
  hideLoading();
  if (upsertResult.error) { console.error('Save failed:', upsertResult.error.message); return; }

  await cleanupUnusedTags();
  await loadData();
  closeModal('edit-modal');
  renderAll();
}

// ── Delete game (deferred) ────────────────────────────────

async function delGame(gameId) {
  var g      = GAMES.find(function(x) { return x.id === gameId; });
  var gTitle = g ? g.title : '';
  if (!confirm(i('confirmdel') + '\n"' + gTitle + '"')) return;
  await addPendingAction('game_delete', { gameId: gameId, gameTitle: gTitle }, i('gamedelwarn', gTitle || gameId));
  closeModal('game-detail-modal');
  S.activeModalGameId = null;
}

// ── Unused tag cleanup ────────────────────────────────────

async function cleanupUnusedTags() {
  var gRes = await sb.from('games').select('tags');
  var used = new Set((gRes.data || []).reduce(function(acc, g) { return acc.concat(g.tags || []); }, []));
  var tRes = await sb.from('tags').select('name');
  var unused = (tRes.data || []).filter(function(t) {
    return !used.has(t.name) && !isProtectedTag(t.name);
  }).map(function(t) { return t.name; });
  if (unused.length) await sb.from('tags').delete().in('name', unused);
}

// ── Pending actions ───────────────────────────────────────

async function addPendingAction(type, payload, description) {
  var execute_at = new Date(Date.now() + PENDING_ACTION_DELAY_MS).toISOString();
  var created_by = (S.session && S.session.user && S.session.user.email) || 'admin';
  var insResult  = await sb.from('pending_actions').insert({
    type: type, payload: payload, description: description,
    execute_at: execute_at, created_by: created_by,
  });
  if (insResult.error) { console.error('Failed to add pending action:', insResult.error.message); return; }
  await loadData();
  renderAll();
}

async function executePendingAction(id) {
  var action = PENDING_ACTIONS.find(function(a) { return a.id === id; });
  if (!action) return;
  showLoading();
  await _performAction(action);
  await sb.from('pending_actions').delete().eq('id', id);
  await cleanupUnusedTags();
  await loadData();
  hideLoading();
  renderAll();
}

async function undoPendingAction(id) {
  await sb.from('pending_actions').delete().eq('id', id);
  await loadData();
  renderAll();
}

async function _performAction(action) {
  if (action.type === 'game_delete') {
    await sb.from('games').delete().eq('id', action.payload.gameId);
  } else if (action.type === 'tag_delete') {
    var tagName  = action.payload.tagName;
    var gRes     = await sb.from('games').select('id,tags');
    var gList    = gRes.data || [];
    for (var gi = 0; gi < gList.length; gi++) {
      var g = gList[gi];
      if (g.tags && g.tags.indexOf(tagName) !== -1) {
        await sb.from('games').update({ tags: g.tags.filter(function(t) { return t !== tagName; }) }).eq('id', g.id);
      }
    }
    await sb.from('tags').delete().eq('name', tagName);
  } else if (action.type === 'tag_rename') {
    var oldName  = action.payload.oldName;
    var newName  = action.payload.newName;
    var gRes2    = await sb.from('games').select('id,tags');
    var gList2   = gRes2.data || [];
    for (var gj = 0; gj < gList2.length; gj++) {
      var g2 = gList2[gj];
      if (g2.tags && g2.tags.indexOf(oldName) !== -1) {
        await sb.from('games').update({ tags: g2.tags.map(function(t) { return t === oldName ? newName : t; }) }).eq('id', g2.id);
      }
    }
    await sb.from('tags').upsert({ name: newName }, { onConflict: 'name' });
    await sb.from('tags').delete().eq('name', oldName);
  }
}

async function checkAndExecutePendingActions() {
  if (!S.isAdmin || !PENDING_ACTIONS.length) return;
  var now     = new Date();
  var expired = PENDING_ACTIONS.filter(function(a) { return new Date(a.execute_at) <= now; });
  if (!expired.length) return;
  for (var i = 0; i < expired.length; i++) {
    await _performAction(expired[i]);
    await sb.from('pending_actions').delete().eq('id', expired[i].id);
  }
  await cleanupUnusedTags();
  await loadData();
  renderAll();
}

setInterval(checkAndExecutePendingActions, 30 * 1000);
setInterval(tickWarningCountdowns, 1000);

// ── Manage Versions ───────────────────────────────────────

function openManageVersions() { renderVersionsList(); openModal('manage-versions-modal'); }

function renderVersionsList() {
  var list = document.getElementById('versions-list');
  if (!list) return;
  list.innerHTML = VERSIONS.map(function(v) {
    var inUse  = GAMES.some(function(g) { return g.vId === v.id; });
    var iconBtn = v.iconUrl
      ? '<button class="icon-button-ghost" onclick="deleteVersionIcon(\'' + v.id + '\',\'' + v.iconUrl + '\')" title="' + i('deleteicon') + '"><i data-lucide="trash-2"></i></button>' +
        '<img src="' + v.iconUrl + '" class="version-icon-preview" alt=""/>'
      : '<button class="icon-button-ghost" onclick="document.getElementById(\'vicon-input-' + v.id + '\').click()" title="' + i('uploadicon') + '"><i data-lucide="upload"></i></button>';
    return '<div class="manage-row" id="vrow-' + v.id + '">' +
      '<div class="ver-view" id="vview-' + v.id + '">' +
        iconBtn +
        '<input type="file" id="vicon-input-' + v.id + '" accept="image/*" style="display:none"' +
               ' onchange="uploadVersionIcon(\'' + v.id + '\',this)"/>' +
        '<span class="manage-ver-name">' + v.name + '</span>' +
        '<span class="manage-spacer"></span>' +
        '<button class="icon-button-ghost" onclick="startEditVersion(\'' + v.id + '\')" title="Edit"><i data-lucide="pencil"></i></button>' +
      '</div>' +
      '<div class="ver-edit" id="vedit-' + v.id + '" style="display:none">' +
        '<button class="icon-button-ghost" onclick="document.getElementById(\'vicon-input-edit-' + v.id + '\').click()" title="' + i('uploadicon') + '"><i data-lucide="upload"></i></button>' +
        '<input type="file" id="vicon-input-edit-' + v.id + '" accept="image/*" style="display:none"' +
               ' onchange="uploadVersionIcon(\'' + v.id + '\',this)"/>' +
        '<input class="manage-input" id="vname-' + v.id + '" value="' + (v.name || '').replace(/"/g,'&quot;') + '" style="flex:2"/>' +
        '<button class="icon-button-ghost icon-button-ghost-danger" id="vdel-' + v.id + '"' +
                ' onclick="handleVersionDeleteClick(\'' + v.id + '\',' + inUse + ')" title="Delete"><i data-lucide="trash-2"></i></button>' +
        '<span class="manage-warn" id="vwarn-' + v.id + '" style="display:none">' + i('deleteconfirm') + '</span>' +
        '<button class="icon-button-ghost" onclick="saveVersion(\'' + v.id + '\')" title="Confirm"><i data-lucide="check"></i></button>' +
        '<button class="icon-button-ghost" onclick="cancelEditVersion(\'' + v.id + '\')" title="Cancel"><i data-lucide="x"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

function startEditVersion(vId) {
  document.getElementById('vview-' + vId).style.display = 'none';
  document.getElementById('vedit-' + vId).style.display = '';
  var inp = document.getElementById('vname-' + vId);
  if (inp) inp.focus();
}

function cancelEditVersion(vId) {
  document.getElementById('vedit-' + vId).style.display = 'none';
  document.getElementById('vview-' + vId).style.display = '';
}

var _verDeleteClickState = {};
function handleVersionDeleteClick(vId, inUse) {
  var warn = document.getElementById('vwarn-' + vId);
  if (inUse) {
    if (warn) { warn.textContent = i('cannotdelete'); warn.style.display = ''; setTimeout(function() { warn.style.display = 'none'; }, 3000); }
    return;
  }
  if (!_verDeleteClickState[vId]) {
    _verDeleteClickState[vId] = true;
    if (warn) { warn.textContent = i('deleteconfirm'); warn.style.display = ''; }
    setTimeout(function() { _verDeleteClickState[vId] = false; var w = document.getElementById('vwarn-' + vId); if (w) w.style.display = 'none'; }, 3000);
  } else {
    _verDeleteClickState[vId] = false;
    deleteVersion(vId);
  }
}

async function saveVersion(vId) {
  var inp  = document.getElementById('vname-' + vId);
  var name = inp ? inp.value.trim() : '';
  if (!name) return;
  showLoading();
  await sb.from('versions').update({ name: name }).eq('id', vId);
  hideLoading();
  await loadData(); renderVersionsList(); renderAll();
}

async function deleteVersion(vId) {
  showLoading();
  await sb.from('versions').delete().eq('id', vId);
  hideLoading();
  await loadData(); renderVersionsList(); renderAll();
}

async function uploadVersionIcon(vId, fileInput) {
  if (!fileInput.files.length) return;
  var file = fileInput.files[0];
  var path = 'version-icons/' + vId + '.' + file.name.split('.').pop();
  showLoading();
  var upRes = await sb.storage.from('screenshots').upload(path, file, { upsert: true });
  if (upRes.error) { hideLoading(); console.error('Icon upload failed:', upRes.error.message); return; }
  var iconUrl = sb.storage.from('screenshots').getPublicUrl(path).data.publicUrl;
  await sb.from('versions').update({ icon_url: iconUrl }).eq('id', vId);
  hideLoading();
  await loadData(); renderVersionsList();
}

async function deleteVersionIcon(vId, iconUrl) {
  var match = iconUrl.match(/\/screenshots\/([^?]+)/);
  if (match) await sb.storage.from('screenshots').remove(['screenshots/' + match[1]]);
  await sb.from('versions').update({ icon_url: null }).eq('id', vId);
  await loadData(); renderVersionsList();
}

async function addVersion() {
  var inp  = document.getElementById('new-ver-name');
  var name = inp ? inp.value.trim() : '';
  if (!name) return;
  var id = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  showLoading();
  var res = await sb.from('versions').insert({ id: id, name: name, label: id });
  hideLoading();
  if (res.error) { console.error('Add version failed:', res.error.message); return; }
  if (inp) inp.value = '';
  await loadData(); renderVersionsList(); renderAll();
}

// ── Manage Tags ───────────────────────────────────────────

var _tagFilter = '';

function openManageTags() { _tagFilter = ''; renderTagsList(); openModal('manage-tags-modal'); }

function filterTagsList(q) { _tagFilter = q.toLowerCase(); renderTagsList(); }

function renderTagsList() {
  var list     = document.getElementById('tags-list');
  if (!list) return;
  var filtered = TAGS.filter(function(t) { return t.name.toLowerCase().indexOf(_tagFilter) !== -1; });
  list.innerHTML = filtered.map(function(t) {
    var isProtected = isProtectedTag(t.name);
    return '<div class="manage-row" id="trow-' + t.name + '">' +
      '<span class="manage-tag-view" id="tview-' + t.name + '">' +
        '<span class="manage-tag-name">' + t.name + '</span>' +
        (isProtected ? '<span class="badge badge-role" style="font-size:10px;margin-left:4px">protected</span>' : '') +
        '<span class="manage-spacer"></span>' +
        (!isProtected ? '<button class="icon-button-ghost" onclick="startRenameTag(\'' + t.name.replace(/'/g,"\\'") + '\')" title="Edit"><i data-lucide="pencil"></i></button>' : '') +
        (!isProtected ? '<button class="icon-button-ghost icon-button-ghost-danger" onclick="queueDeleteTag(\'' + t.name.replace(/'/g,"\\'") + '\')" title="Delete"><i data-lucide="trash-2"></i></button>' : '') +
      '</span>' +
      '<span class="manage-tag-edit" id="tedit-' + t.name + '" style="display:none">' +
        '<input class="manage-input" id="trename-' + t.name + '" value="' + t.name.replace(/"/g,'&quot;') + '"/>' +
        '<span class="merge-warning" id="tmwarn-' + t.name + '" style="display:none">' + i('mergewarning') + '</span>' +
        '<button class="icon-button-ghost" onclick="saveRenameTag(\'' + t.name.replace(/'/g,"\\'") + '\')" title="Confirm"><i data-lucide="check"></i></button>' +
        '<button class="icon-button-ghost" onclick="cancelRenameTag(\'' + t.name.replace(/'/g,"\\'") + '\')" title="Cancel"><i data-lucide="x"></i></button>' +
      '</span>' +
    '</div>';
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

function startRenameTag(name) {
  document.getElementById('tview-' + name).style.display = 'none';
  var edit  = document.getElementById('tedit-' + name);
  edit.style.display = '';
  var input = document.getElementById('trename-' + name);
  if (input) input.focus();
  if (input) input.addEventListener('input', function() {
    var newName = input.value.trim();
    var exists  = TAGS.some(function(t) { return t.name.toLowerCase() === newName.toLowerCase() && t.name !== name; });
    var warn    = document.getElementById('tmwarn-' + name);
    if (warn) warn.style.display = exists ? '' : 'none';
  });
}

function cancelRenameTag(name) {
  document.getElementById('tview-' + name).style.display = '';
  document.getElementById('tedit-' + name).style.display = 'none';
}

async function saveRenameTag(oldName) {
  var input   = document.getElementById('trename-' + oldName);
  var newName = input ? input.value.trim() : '';
  if (!newName || newName === oldName) { cancelRenameTag(oldName); return; }
  if (isProtectedTag(oldName) || isProtectedTag(newName)) {
    var warn = document.getElementById('tmwarn-' + oldName);
    if (warn) { warn.textContent = i('protectedtag'); warn.style.display = ''; }
    return;
  }
  var isMerge = TAGS.some(function(t) { return t.name.toLowerCase() === newName.toLowerCase() && t.name !== oldName; });
  var desc    = isMerge ? i('tagmergewarn', oldName, newName) : i('tagrenamewarn', oldName, newName);
  showLoading();
  await addPendingAction('tag_rename', { oldName: oldName, newName: newName }, desc);
  hideLoading();
  renderTagsList();
}

async function queueDeleteTag(tagName) {
  if (isProtectedTag(tagName)) {
    var row  = document.getElementById('trow-' + tagName);
    var warn = row ? row.querySelector('.merge-warning') : null;
    if (warn) { warn.textContent = i('protectedtag'); warn.style.display = ''; }
    return;
  }
  showLoading();
  await addPendingAction('tag_delete', { tagName: tagName }, i('tagdelwarn', tagName));
  hideLoading();
  renderTagsList();
}

// ── Manage Users (Archiver only) ──────────────────────────

var _userFilter          = '';
var _userEditingId       = null;
var _userUsernameWarning = {};

function openManageUsers() {
  if (!isArchiver()) return;
  _userFilter = '';
  renderUsersList();
  openModal('manage-users-modal');
}

function filterUsersList(q) { _userFilter = q.toLowerCase(); renderUsersList(); }

function renderUsersList() {
  var list     = document.getElementById('users-list');
  if (!list) return;
  var filtered = PROFILES.filter(function(p) {
    return p.username.toLowerCase().indexOf(_userFilter) !== -1;
  });
  list.innerHTML = filtered.map(function(p) {
    var isSelf   = S.profile && p.id === S.profile.id;
    var roleLbl  = roleLabel(p.role);
    return '<div class="manage-row" id="urow-' + p.id + '">' +
      '<span class="manage-user-view" id="uview-' + p.id + '">' +
        '<span class="manage-tag-name">' + p.username + '</span>' +
        '<span class="badge badge-role badge-role-' + p.role + '" style="margin-left:6px">' + roleLbl + '</span>' +
        (isSelf ? '<span style="font-size:10px;color:var(--text-subtle);margin-left:4px">(you)</span>' : '') +
        '<span class="manage-spacer"></span>' +
        '<button class="icon-button-ghost" onclick="startEditUser(\'' + p.id + '\')" title="Edit"><i data-lucide="pencil"></i></button>' +
        (!isSelf ? '<button class="icon-button-ghost icon-button-ghost-danger" onclick="deleteUser(\'' + p.id + '\')" title="Remove"><i data-lucide="trash-2"></i></button>' : '') +
      '</span>' +
      '<span class="manage-user-edit" id="uedit-' + p.id + '" style="display:none">' +
        '<input class="manage-input" id="uname-' + p.id + '" value="' + p.username.replace(/"/g,'&quot;') + '" style="flex:2"/>' +
        '<select class="manage-input" id="urole-' + p.id + '" style="width:110px">' +
          '<option value="mod"'      + (p.role === 'mod'      ? ' selected' : '') + '>' + i('roleMod')      + '</option>' +
          '<option value="archiver"' + (p.role === 'archiver' ? ' selected' : '') + '>' + i('roleArchiver') + '</option>' +
        '</select>' +
        '<span class="manage-warn" id="uwarn-' + p.id + '" style="display:none;color:#c0392b"></span>' +
        '<button class="icon-button-ghost" onclick="saveEditUser(\'' + p.id + '\')" title="Confirm"><i data-lucide="check"></i></button>' +
        '<button class="icon-button-ghost" onclick="cancelEditUser(\'' + p.id + '\')" title="Cancel"><i data-lucide="x"></i></button>' +
      '</span>' +
    '</div>';
  }).join('');
  if (window.lucide) window.lucide.createIcons();
}

function startEditUser(userId) {
  document.getElementById('uview-' + userId).style.display = 'none';
  document.getElementById('uedit-' + userId).style.display = '';
  var inp = document.getElementById('uname-' + userId);
  if (inp) inp.focus();
}

function cancelEditUser(userId) {
  document.getElementById('uedit-' + userId).style.display = 'none';
  document.getElementById('uview-' + userId).style.display = '';
}

async function saveEditUser(userId) {
  var inp      = document.getElementById('uname-' + userId);
  var roleSel  = document.getElementById('urole-' + userId);
  var warn     = document.getElementById('uwarn-' + userId);
  var username = inp ? inp.value.trim() : '';
  var role     = roleSel ? roleSel.value : 'mod';
  if (!username) return;

  // Check for username uniqueness among other profiles
  var duplicate = PROFILES.some(function(p) {
    return p.username.toLowerCase() === username.toLowerCase() && p.id !== userId;
  });
  if (duplicate) {
    if (warn) { warn.textContent = i('usernameunique'); warn.style.display = ''; }
    return;
  }
  if (warn) warn.style.display = 'none';

  showLoading();
  var result = await sb.from('profiles').update({ username: username, role: role }).eq('id', userId);
  hideLoading();
  if (result.error) { console.error('User save failed:', result.error.message); return; }

  // If editing self, refresh local profile
  if (S.profile && userId === S.profile.id) await loadProfile();

  await loadProfiles();
  renderUsersList();
  renderAll();
}

async function deleteUser(userId) {
  if (!confirm(i('confirmdeluser'))) return;
  showLoading();
  // Deleting the profile revokes admin access; auth.users entry persists (requires Supabase dashboard)
  var result = await sb.from('profiles').delete().eq('id', userId);
  hideLoading();
  if (result.error) { console.error('User delete failed:', result.error.message); return; }
  await loadProfiles();
  renderUsersList();
}

// ── Orphan game migration (Archiver only) ─────────────────
// Resolves taito@disroot.org's current username server-side and assigns
// every game with a null signed_by to them. One-off manual action.

async function migrateOrphanGames() {
  if (!isArchiver()) return;
  var resultEl = document.getElementById('migrate-orphans-result');
  showLoading();
  var rpcResult = await sb.rpc('assign_orphan_games', { target_email: 'taito@disroot.org' });
  hideLoading();
  if (rpcResult.error) {
    console.error('Orphan migration failed:', rpcResult.error.message);
    if (resultEl) resultEl.textContent = i('migrateorphanserror');
    return;
  }
  var count = rpcResult.data;
  if (resultEl) resultEl.textContent = count > 0 ? i('migrateorphansresult', count) : i('migrateorphansnone');
  await loadData();
  renderAll();
}
