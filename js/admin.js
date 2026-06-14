'use strict';

// ── Change this value to adjust the deferred action delay ─
const PENDING_ACTION_DELAY_MS = 60 * 60 * 1000; // 1 hour

const editForm = { tags: [], tagFilter: '' };

// ── Login / logout ────────────────────────────────────────

function adminClick() {
  if (S.isAdmin) return;
  document.getElementById('login-error').style.display = 'none';
  openModal('login-modal');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) { errEl.style.display = 'block'; return; }
  S.session = data.session;
  S.isAdmin = true;
  closeModal('login-modal');
  renderAll();
}

async function doLogout() {
  await sb.auth.signOut();
  S.session = null; S.isAdmin = false;
  renderAll();
}

// ── Edit / Add game ───────────────────────────────────────

function openEdit(gameId) {
  const g = gameId ? GAMES.find(x => x.id === gameId) : null;

  document.getElementById('developer-list').innerHTML =
    getDevList().map(d => `<option value="${d}"/>`).join('');
  document.getElementById('country-datalist').innerHTML =
    COUNTRIES.map(([name]) => `<option value="${name}"/>`).join('');

  editForm.tags      = (g?.tags || []).map(name => ({ name, isNew: false }));
  editForm.tagFilter = '';

  document.getElementById('edit-game-id').value        = gameId || '';
  document.getElementById('edit-game-title').value     = g?.title     || '';
  document.getElementById('edit-game-developer').value = g?.developer || '';
  document.getElementById('edit-game-version').value   = g?.vId       || VERSIONS[0]?.id || '';
  document.getElementById('edit-game-year').value      = g?.year      || '';
  document.getElementById('edit-game-country').value   = g?.country   || 'Unknown';
  document.getElementById('edit-tag-input').value      = '';
  document.getElementById('edit-fan-lang').value       = g?.fanLang   || '';
  document.getElementById('edit-fan-dev').value        = g?.fanDev    || '';

  _initScreenshotField(g?.ss || null);
  _initDownloadFields(g);

  ['edit-tag-error','edit-title-error','edit-year-error',
   'edit-archive-error','edit-source-error','edit-fandev-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  renderEditTagChips();
  renderEditTagDropdown('');
  setText('edit-modal-title', gameId ? i('editgame') : i('addgame'));
  openModal('edit-modal');
}

// ── Download fields ───────────────────────────────────────

function _initDownloadFields(g) {
  const hasUrl     = !!g?.url;
  const hasArchive = !!g?.archiveUrl;
  const isLost     = !hasUrl && !hasArchive;

  document.getElementById('download-available').checked   = !isLost;
  document.getElementById('download-unavailable').checked = isLost;
  document.getElementById('edit-download-url').value      = g?.url        || '';
  document.getElementById('edit-archive-url').value       = g?.archiveUrl || '';
  toggleDownloadField();
}

function toggleDownloadField() {
  const isAvailable = document.getElementById('download-available').checked;
  document.getElementById('download-available-fields').style.display = isAvailable ? '' : 'none';
}

function _validateArchiveUrl(url) {
  if (!url) return true;
  try { return new URL(url).hostname.includes('archive.org'); } catch { return false; }
}

// ── Screenshot ────────────────────────────────────────────

function _initScreenshotField(existingUrl) {
  const input = document.getElementById('edit-screenshot-url');
  const btn   = document.getElementById('screenshot-upload-btn');
  input.value    = existingUrl || '';
  input.disabled = !!existingUrl;
  btn.textContent = existingUrl ? i('deleteimage') : i('uploadimage');
}

function triggerScreenshotUpload() {
  const input = document.getElementById('edit-screenshot-url');
  if (input.disabled) {
    _deleteScreenshotFromStorage(input.value);
    _initScreenshotField(null);
  } else {
    document.getElementById('edit-screenshot-file-input').click();
  }
}

async function handleScreenshotFile(fileInput) {
  if (!fileInput.files.length) return;
  const url = await _uploadScreenshot(fileInput.files[0]);
  if (url) _initScreenshotField(url);
}

async function _uploadScreenshot(file) {
  const path = `screenshots/${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await sb.storage.from('screenshots').upload(path, file);
  if (error) { console.error('Screenshot upload failed:', error.message); return null; }
  return sb.storage.from('screenshots').getPublicUrl(path).data.publicUrl || null;
}

async function _deleteScreenshotFromStorage(url) {
  if (!url) return;
  const match = url.match(/\/screenshots\/([^?]+)/);
  if (match) await sb.storage.from('screenshots').remove([`screenshots/${match[1]}`]);
}

// ── Edit modal tag multi-select ───────────────────────────

function renderEditTagChips() {
  document.getElementById('edit-tag-chips').innerHTML = editForm.tags.map(t =>
    `<span class="edit-tag-chip${t.isNew?' tag-new':''}" ${t.isNew?`title="${i('newtag')}"`:''}>${t.isNew?'✨ ':''}${t.name}
      <button class="filter-token-remove" onclick="removeEditTag('${t.name}')">×</button>
    </span>`
  ).join('');
}

function renderEditTagDropdown(filter) {
  if (filter !== undefined) editForm.tagFilter = filter;
  const dd      = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  const sel     = editForm.tags.map(t => t.name);
  const q       = editForm.tagFilter.toLowerCase();
  const matches = TAGS.filter(t => t.name.toLowerCase().includes(q) && !sel.includes(t.name));
  dd.innerHTML  = matches.map(t =>
    `<div class="ecb-option" onclick="toggleEditTag('${t.name}',false)">${t.name}</div>`
  ).join('') || (q ? `<div class="ecb-empty">↵ Enter to add "<strong>${editForm.tagFilter}</strong>"</div>` : '');
  dd.classList.toggle('open', matches.length > 0 || q.length > 0);
}

function toggleEditTagDropdown() {
  const dd = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  dd.classList.contains('open') ? dd.classList.remove('open') : renderEditTagDropdown(editForm.tagFilter);
}

function onEditTagInput(value)  { renderEditTagDropdown(value); }

function onEditTagKeydown(event) {
  if (event.key === 'Escape') { document.getElementById('edit-tag-dropdown')?.classList.remove('open'); return; }
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const value = editForm.tagFilter.trim();
  if (!value || editForm.tags.find(t => t.name.toLowerCase() === value.toLowerCase())) return;
  const existing = TAGS.find(t => t.name.toLowerCase() === value.toLowerCase());
  editForm.tags.push({ name: existing ? existing.name : value, isNew: !existing });
  document.getElementById('edit-tag-input').value = '';
  editForm.tagFilter = '';
  document.getElementById('edit-tag-error').style.display = 'none';
  renderEditTagChips();
  renderEditTagDropdown('');
}

function toggleEditTag(name, isNew) {
  const idx = editForm.tags.findIndex(t => t.name === name);
  idx >= 0 ? editForm.tags.splice(idx,1) : editForm.tags.push({ name, isNew: !!isNew });
  document.getElementById('edit-tag-input').value = '';
  editForm.tagFilter = '';
  renderEditTagChips();
  renderEditTagDropdown('');
}

function removeEditTag(name) {
  editForm.tags = editForm.tags.filter(t => t.name !== name);
  renderEditTagChips();
  renderEditTagDropdown(editForm.tagFilter);
}

// ── Save game ─────────────────────────────────────────────

async function saveGame() {
  let valid = true;

  const title    = document.getElementById('edit-game-title').value.trim();
  const titleErr = document.getElementById('edit-title-error');
  if (!title) { titleErr.textContent = i('notitle'); titleErr.style.display = 'block'; valid = false; }
  else titleErr.style.display = 'none';

  const yearVal = document.getElementById('edit-game-year').value.trim();
  const yearErr = document.getElementById('edit-year-error');
  if (!/^(19|20)\d{2}$/.test(yearVal)) {
    yearErr.textContent = i('invalidyear'); yearErr.style.display = 'block';
    document.getElementById('edit-game-year').classList.add('field-error');
    valid = false;
  } else {
    yearErr.style.display = 'none';
    document.getElementById('edit-game-year').classList.remove('field-error');
  }

  const tagErr = document.getElementById('edit-tag-error');
  if (!editForm.tags.length) { tagErr.style.display = 'block'; valid = false; }
  else tagErr.style.display = 'none';

  const isAvailable  = document.getElementById('download-available').checked;
  const sourceUrl    = document.getElementById('edit-download-url').value.trim();
  const archiveUrl   = document.getElementById('edit-archive-url').value.trim();
  const archiveErr   = document.getElementById('edit-archive-error');
  const sourceErr    = document.getElementById('edit-source-error');

  if (isAvailable) {
    if (!sourceUrl && !archiveUrl) {
      sourceErr.textContent = i('sourceOrArchive');
      sourceErr.style.display = 'block'; valid = false;
    } else {
      sourceErr.style.display = 'none';
    }
    if (archiveUrl && !_validateArchiveUrl(archiveUrl)) {
      archiveErr.textContent = i('invalidarchive');
      archiveErr.style.display = 'block'; valid = false;
    } else {
      archiveErr.style.display = 'none';
    }
  }

  const fanLang    = document.getElementById('edit-fan-lang').value.trim();
  const fanDev     = document.getElementById('edit-fan-dev').value.trim();
  const fanDevErr  = document.getElementById('edit-fandev-error');
  if (fanLang && !fanDev) {
    fanDevErr.textContent = i('fanDevRequired');
    fanDevErr.style.display = 'block'; valid = false;
  } else {
    fanDevErr.style.display = 'none';
  }

  if (!valid) return;

  showLoading();

  const newTags = editForm.tags.filter(t => t.isNew);
  if (newTags.length) {
    await sb.from('tags').upsert(newTags.map(t => ({ name: t.name })), { onConflict: 'name' });
  }

  const ss     = document.getElementById('edit-screenshot-url').value.trim() || null;
  const gameId = document.getElementById('edit-game-id').value;

  const game = {
    title,
    developer:   document.getElementById('edit-game-developer').value.trim() || '',
    v_id:        document.getElementById('edit-game-version').value           || VERSIONS[0]?.id || '',
    year:        parseInt(yearVal),
    country:     document.getElementById('edit-game-country').value.trim()    || 'Unknown',
    tags:        editForm.tags.map(t => t.name),
    ss,
    url:         isAvailable ? (sourceUrl  || null) : null,
    archive_url: isAvailable ? (archiveUrl || null) : null,
    fan_lang:    fanLang || null,
    fan_dev:     fanDev  || null,
  };
  if (gameId) game.id = gameId;

  const { error } = await sb.from('games').upsert(game);
  hideLoading();
  if (error) { console.error('Save failed:', error.message); return; }

  await cleanupUnusedTags();
  await loadData();
  closeModal('edit-modal');
  renderAll();
}

// ── Delete game — deferred ────────────────────────────────

async function delGame(gameId) {
  const g = GAMES.find(x => x.id === gameId);
  if (!confirm(`${i('confirmdel')}\n"${g?.title}"`)) return;
  await addPendingAction('game_delete', { gameId, gameTitle: g?.title }, i('gamedelwarn', g?.title || gameId));
  closeModal('game-detail-modal');
  S.activeModalGameId = null;
}

// ── Unused tag cleanup ────────────────────────────────────

async function cleanupUnusedTags() {
  const { data: allGames } = await sb.from('games').select('tags');
  const used   = new Set((allGames || []).flatMap(g => g.tags || []));
  const { data: allTags } = await sb.from('tags').select('name');
  const unused = (allTags || []).filter(t => !used.has(t.name)).map(t => t.name);
  if (unused.length) await sb.from('tags').delete().in('name', unused);
}

// ── Pending actions ───────────────────────────────────────

async function addPendingAction(type, payload, description) {
  const execute_at = new Date(Date.now() + PENDING_ACTION_DELAY_MS).toISOString();
  const created_by = S.session?.user?.email || 'admin';
  const { error } = await sb.from('pending_actions').insert({ type, payload, description, execute_at, created_by });
  if (error) { console.error('Failed to add pending action:', error.message); return; }
  await loadData();
  renderAll();
}

async function executePendingAction(id) {
  const action = PENDING_ACTIONS.find(a => a.id === id);
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
  switch (action.type) {
    case 'game_delete':
      await sb.from('games').delete().eq('id', action.payload.gameId);
      break;
    case 'tag_delete': {
      const { tagName } = action.payload;
      const { data: games } = await sb.from('games').select('id,tags');
      for (const g of games || []) {
        if (g.tags?.includes(tagName))
          await sb.from('games').update({ tags: g.tags.filter(t => t !== tagName) }).eq('id', g.id);
      }
      await sb.from('tags').delete().eq('name', tagName);
      break;
    }
    case 'tag_rename': {
      const { oldName, newName } = action.payload;
      const { data: games } = await sb.from('games').select('id,tags');
      for (const g of games || []) {
        if (g.tags?.includes(oldName))
          await sb.from('games').update({ tags: g.tags.map(t => t === oldName ? newName : t) }).eq('id', g.id);
      }
      await sb.from('tags').upsert({ name: newName }, { onConflict: 'name' });
      await sb.from('tags').delete().eq('name', oldName);
      break;
    }
  }
}

async function checkAndExecutePendingActions() {
  if (!S.isAdmin || !PENDING_ACTIONS.length) return;
  const expired = PENDING_ACTIONS.filter(a => new Date(a.execute_at) <= new Date());
  if (!expired.length) return;
  for (const action of expired) {
    await _performAction(action);
    await sb.from('pending_actions').delete().eq('id', action.id);
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
  const list = document.getElementById('versions-list');
  if (!list) return;
  list.innerHTML = VERSIONS.map(v => {
    const inUse   = GAMES.some(g => g.vId === v.id);
    const iconBtn = v.iconUrl
      ? `<button class="icon-button" onclick="deleteVersionIcon('${v.id}','${v.iconUrl}')" title="${i('deleteicon')}">🗑️</button>
         <img src="${v.iconUrl}" class="version-icon-preview" alt=""/>`
      : `<button class="icon-button" onclick="document.getElementById('vicon-input-${v.id}').click()" title="${i('uploadicon')}">📤</button>`;

    return `<div class="manage-row" id="vrow-${v.id}">
      <div class="ver-view" id="vview-${v.id}">
        ${iconBtn}
        <input type="file" id="vicon-input-${v.id}" accept="image/*" style="display:none"
               onchange="uploadVersionIcon('${v.id}',this)"/>
        <span class="manage-ver-name">${v.name}</span>
        <span class="manage-ver-label badge badge-version">${v.label}</span>
        <span class="manage-spacer"></span>
        <button class="icon-button" onclick="startEditVersion('${v.id}')" title="Edit">✏️</button>
      </div>
      <div class="ver-edit" id="vedit-${v.id}" style="display:none">
        <button class="icon-button" onclick="document.getElementById('vicon-input-edit-${v.id}').click()" title="${i('uploadicon')}">📤</button>
        <input type="file" id="vicon-input-edit-${v.id}" accept="image/*" style="display:none"
               onchange="uploadVersionIcon('${v.id}',this)"/>
        <input class="manage-input" id="vname-${v.id}" value="${(v.name||'').replace(/"/g,'&quot;')}" style="flex:2"/>
        <button class="icon-button manage-delete-btn" id="vdel-${v.id}"
                onclick="handleVersionDeleteClick('${v.id}','${inUse}')" title="Delete">🗑️</button>
        <span class="manage-warn" id="vwarn-${v.id}" style="display:none">${i('deleteconfirm')}</span>
        <button class="icon-button" onclick="saveVersion('${v.id}')" title="Confirm">✔️</button>
        <button class="icon-button" onclick="cancelEditVersion('${v.id}')" title="Cancel">✕</button>
      </div>
    </div>`;
  }).join('');
}

function startEditVersion(vId) {
  document.getElementById(`vview-${vId}`).style.display = 'none';
  document.getElementById(`vedit-${vId}`).style.display = '';
  document.getElementById(`vname-${vId}`)?.focus();
}

function cancelEditVersion(vId) {
  document.getElementById(`vedit-${vId}`).style.display = 'none';
  document.getElementById(`vview-${vId}`).style.display = '';
}

// Delete button requires two clicks when in use.
const _verDeleteClickState = {};
function handleVersionDeleteClick(vId, inUse) {
  if (inUse === 'true') {
    const warn = document.getElementById(`vwarn-${vId}`);
    if (warn) { warn.textContent = i('cannotdelete'); warn.style.display = ''; setTimeout(() => warn.style.display = 'none', 3000); }
    return;
  }
  if (!_verDeleteClickState[vId]) {
    _verDeleteClickState[vId] = true;
    const warn = document.getElementById(`vwarn-${vId}`);
    if (warn) { warn.textContent = i('deleteconfirm'); warn.style.display = ''; }
    setTimeout(() => { _verDeleteClickState[vId] = false; const w = document.getElementById(`vwarn-${vId}`); if(w) w.style.display='none'; }, 3000);
  } else {
    _verDeleteClickState[vId] = false;
    deleteVersion(vId);
  }
}

async function saveVersion(vId) {
  const name = document.getElementById(`vname-${vId}`)?.value.trim();
  if (!name) return;
  showLoading();
  const { error } = await sb.from('versions').update({ name }).eq('id', vId);
  hideLoading();
  if (error) { console.error('Version save failed:', error.message); return; }
  await loadData();
  renderVersionsList();
  renderAll();
}

async function deleteVersion(vId) {
  showLoading();
  await sb.from('versions').delete().eq('id', vId);
  hideLoading();
  await loadData();
  renderVersionsList();
  renderAll();
}

async function uploadVersionIcon(vId, fileInput) {
  if (!fileInput.files.length) return;
  const file = fileInput.files[0];
  const path = `version-icons/${vId}.${file.name.split('.').pop()}`;
  showLoading();
  const { error: upErr } = await sb.storage.from('screenshots').upload(path, file, { upsert: true });
  if (upErr) { hideLoading(); console.error('Icon upload failed:', upErr.message); return; }
  const iconUrl = sb.storage.from('screenshots').getPublicUrl(path).data.publicUrl;
  await sb.from('versions').update({ icon_url: iconUrl }).eq('id', vId);
  hideLoading();
  await loadData();
  renderVersionsList();
}

async function deleteVersionIcon(vId, iconUrl) {
  const match = iconUrl.match(/\/screenshots\/([^?]+)/);
  if (match) await sb.storage.from('screenshots').remove([`screenshots/${match[1]}`]);
  await sb.from('versions').update({ icon_url: null }).eq('id', vId);
  await loadData();
  renderVersionsList();
}

async function addVersion() {
  const name = document.getElementById('new-ver-name')?.value.trim();
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
  showLoading();
  const { error } = await sb.from('versions').insert({ id, name, label: id });
  hideLoading();
  if (error) { console.error('Add version failed:', error.message); return; }
  document.getElementById('new-ver-name').value = '';
  await loadData();
  renderVersionsList();
  renderAll();
}

// ── Manage Tags ───────────────────────────────────────────

let _tagFilter = '';

function openManageTags() { _tagFilter = ''; renderTagsList(); openModal('manage-tags-modal'); }

function filterTagsList(q) {
  _tagFilter = q.toLowerCase();
  renderTagsList();
}

function renderTagsList() {
  const list     = document.getElementById('tags-list');
  if (!list) return;
  const filtered = TAGS.filter(t => t.name.toLowerCase().includes(_tagFilter));
  list.innerHTML = filtered.map(t => `
    <div class="manage-row" id="trow-${t.name}">
      <span class="manage-tag-view" id="tview-${t.name}">
        <span class="manage-tag-name">${t.name}</span>
        <span class="manage-spacer"></span>
        <button class="icon-button" onclick="startRenameTag('${t.name}')" title="Edit">✏️</button>
        <button class="icon-button manage-delete-btn" onclick="queueDeleteTag('${t.name}')" title="Delete">🗑️</button>
      </span>
      <span class="manage-tag-edit" id="tedit-${t.name}" style="display:none">
        <input class="manage-input" id="trename-${t.name}" value="${t.name.replace(/"/g,'&quot;')}"/>
        <span class="merge-warning" id="tmwarn-${t.name}" style="display:none">${i('mergewarning')}</span>
        <button class="icon-button" onclick="saveRenameTag('${t.name}')" title="Confirm">✔️</button>
        <button class="icon-button" onclick="cancelRenameTag('${t.name}')" title="Cancel">✕</button>
      </span>
    </div>`
  ).join('');
}

function startRenameTag(name) {
  document.getElementById(`tview-${name}`).style.display = 'none';
  const edit = document.getElementById(`tedit-${name}`);
  edit.style.display = '';
  const input = document.getElementById(`trename-${name}`);
  input?.focus();
  input?.addEventListener('input', () => {
    const newName = input.value.trim();
    const exists  = TAGS.some(t => t.name.toLowerCase() === newName.toLowerCase() && t.name !== name);
    const warn    = document.getElementById(`tmwarn-${name}`);
    if (warn) warn.style.display = exists ? '' : 'none';
  });
}

function cancelRenameTag(name) {
  document.getElementById(`tview-${name}`).style.display = '';
  document.getElementById(`tedit-${name}`).style.display = 'none';
}

async function saveRenameTag(oldName) {
  const input   = document.getElementById(`trename-${oldName}`);
  const newName = input?.value.trim();
  if (!newName || newName === oldName) { cancelRenameTag(oldName); return; }
  const isMerge = TAGS.some(t => t.name.toLowerCase() === newName.toLowerCase() && t.name !== oldName);
  const desc    = isMerge ? i('tagmergewarn', oldName, newName) : i('tagrenamewarn', oldName, newName);
  showLoading();
  await addPendingAction('tag_rename', { oldName, newName }, desc);
  hideLoading();
  renderTagsList();
}

async function queueDeleteTag(tagName) {
  showLoading();
  await addPendingAction('tag_delete', { tagName }, i('tagdelwarn', tagName));
  hideLoading();
  renderTagsList();
}
