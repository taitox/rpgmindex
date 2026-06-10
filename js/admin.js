'use strict';

// ── Countdown timer — change this value to adjust the delay ──
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

  editForm.tags = (g?.tags || []).map(name => ({ name, isNew: false }));
  editForm.tagFilter = '';

  document.getElementById('edit-game-id').value        = gameId || '';
  document.getElementById('edit-game-title').value     = g?.title     || '';
  document.getElementById('edit-game-developer').value = g?.developer || '';
  document.getElementById('edit-game-version').value   = g?.vId       || VERSIONS[0]?.id || '';
  document.getElementById('edit-game-year').value      = g?.year      || '';
  document.getElementById('edit-game-country').value   = g?.country   || 'Unknown';
  document.getElementById('edit-tag-input').value      = '';

  // Screenshot — reworked: single URL field + upload/delete button
  _initScreenshotField(g?.ss || null);

  document.getElementById(g?.url ? 'download-available' : 'download-unavailable').checked = true;
  document.getElementById('edit-download-url').value = g?.url || '';
  toggleDownloadField();

  ['edit-tag-error','edit-title-error','edit-year-error'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  renderEditTagChips();
  renderEditTagDropdown('');
  setText('edit-modal-title', gameId ? i('editgame') : i('addgame'));
  openModal('edit-modal');
}

function toggleDownloadField() {
  const type = document.querySelector('input[name="download-type"]:checked')?.value;
  document.getElementById('edit-download-url').style.display = type === 'available' ? 'block' : 'none';
}

// ── Screenshot — reworked ─────────────────────────────────

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
  if (match) {
    const { error } = await sb.storage.from('screenshots').remove([`screenshots/${match[1]}`]);
    if (error) console.error('Screenshot delete failed:', error.message);
  }
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
  const dd = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  const sel = editForm.tags.map(t => t.name);
  const q   = editForm.tagFilter.toLowerCase();
  const matches = TAGS.filter(t => t.name.toLowerCase().includes(q) && !sel.includes(t.name));
  dd.innerHTML = matches.map(t =>
    `<div class="ms-option" onclick="toggleEditTag('${t.name}',false)">${t.name}</div>`
  ).join('') || (q ? `<div class="ms-empty">↵ Enter to add "<strong>${editForm.tagFilter}</strong>"</div>` : '');
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

  const title   = document.getElementById('edit-game-title').value.trim();
  const titleErr = document.getElementById('edit-title-error');
  if (!title) { titleErr.textContent = i('notitle'); titleErr.style.display = 'block'; valid = false; }
  else           titleErr.style.display = 'none';

  const yearVal  = document.getElementById('edit-game-year').value.trim();
  const yearErr  = document.getElementById('edit-year-error');
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
  else                         tagErr.style.display = 'none';

  if (!valid) return;

  const newTags = editForm.tags.filter(t => t.isNew);
  if (newTags.length) {
    const { error } = await sb.from('tags').upsert(newTags.map(t => ({ name: t.name })), { onConflict: 'name' });
    if (error) console.error('Tag insert failed:', error.message);
  }

  const ss     = document.getElementById('edit-screenshot-url').value.trim() || null;
  const dlType = document.querySelector('input[name="download-type"]:checked')?.value;
  const gameId = document.getElementById('edit-game-id').value;

  const game = {
    title,
    developer: document.getElementById('edit-game-developer').value.trim() || '',
    v_id:      document.getElementById('edit-game-version').value || VERSIONS[0]?.id || '',
    year:      parseInt(yearVal),
    country:   document.getElementById('edit-game-country').value.trim() || 'Unknown',
    tags:      editForm.tags.map(t => t.name),
    ss,
    url: dlType === 'available' ? (document.getElementById('edit-download-url').value.trim() || null) : null,
  };
  if (gameId) game.id = gameId;

  const { error } = await sb.from('games').upsert(game);
  if (error) { console.error('Save failed:', error.message); return; }

  await cleanupUnusedTags();
  await loadData();
  closeModal('edit-modal');
  renderAll();
}

// ── Delete game — deferred via pending_actions ────────────

async function delGame(gameId) {
  const g = GAMES.find(x => x.id === gameId);
  if (!confirm(`${i('confirmdel')}\n"${g?.title}"`)) return;
  await addPendingAction('game_delete', { gameId, gameTitle: g?.title },
    i('gamedelwarn', g?.title || gameId));
  closeModal('game-detail-modal');
  S.activeModalGameId = null;
  // Note: game stays visible until countdown expires
}

// ── Unused tag cleanup ────────────────────────────────────

async function cleanupUnusedTags() {
  const { data: allGames } = await sb.from('games').select('tags');
  const used = new Set((allGames || []).flatMap(g => g.tags || []));
  const { data: allTags } = await sb.from('tags').select('name');
  const unused = (allTags || []).filter(t => !used.has(t.name)).map(t => t.name);
  if (unused.length) await sb.from('tags').delete().in('name', unused);
}

// ── Pending Actions (Warning Div) ─────────────────────────

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
  await _performAction(action);
  await sb.from('pending_actions').delete().eq('id', id);
  await cleanupUnusedTags();
  await loadData();
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

// Runs every 30 seconds to execute expired pending actions.
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

function openManageVersions() {
  renderVersionsList();
  openModal('manage-versions-modal');
}

function renderVersionsList() {
  const list = document.getElementById('versions-list');
  if (!list) return;
  list.innerHTML = VERSIONS.map(v => {
    const inUse = GAMES.some(g => g.vId === v.id);
    return `<div class="manage-row" id="vrow-${v.id}">
      <input class="manage-input" id="vname-${v.id}"  value="${(v.name||'').replace(/"/g,'&quot;')}"  placeholder="${i('vername')}"/>
      <input class="manage-input" id="vlabel-${v.id}" value="${(v.label||'').replace(/"/g,'&quot;')}" placeholder="${i('verabbr')}" style="width:90px"/>
      <div class="version-icon-cell">
        ${v.iconUrl ? `<img src="${v.iconUrl}" class="version-icon-preview" alt=""/>` : ''}
        <button class="button-base" onclick="handleVersionIconBtn('${v.id}','${v.iconUrl||''}')">
          ${v.iconUrl ? i('deleteicon') : i('uploadicon')}
        </button>
        <input type="file" id="vicon-input-${v.id}" accept="image/*" style="display:none"
               onchange="uploadVersionIcon('${v.id}',this)"/>
      </div>
      <button class="button-base" onclick="saveVersion('${v.id}')">✔</button>
      <span class="manage-warn" id="vwarn-${v.id}" style="display:none;color:#c0392b">${i('cannotdelete')}</span>
      <button class="action-button delete-button" onclick="deleteVersion('${v.id}')" ${inUse?'disabled title="'+i('cannotdelete')+'"':''}>🗑️</button>
    </div>`;
  }).join('');
}

async function saveVersion(vId) {
  const name  = document.getElementById(`vname-${vId}`)?.value.trim();
  const label = document.getElementById(`vlabel-${vId}`)?.value.trim();
  if (!name || !label) return;
  const { error } = await sb.from('versions').update({ name, label }).eq('id', vId);
  if (error) { console.error('Version save failed:', error.message); return; }
  await loadData();
  renderVersionsList();
  renderAll();
}

async function handleVersionIconBtn(vId, existingUrl) {
  if (existingUrl) {
    await deleteVersionIcon(vId, existingUrl);
  } else {
    document.getElementById(`vicon-input-${vId}`)?.click();
  }
}

async function uploadVersionIcon(vId, fileInput) {
  if (!fileInput.files.length) return;
  const file = fileInput.files[0];
  const path = `version-icons/${vId}.${file.name.split('.').pop()}`;
  const { error: upErr } = await sb.storage.from('screenshots').upload(path, file, { upsert: true });
  if (upErr) { console.error('Icon upload failed:', upErr.message); return; }
  const iconUrl = sb.storage.from('screenshots').getPublicUrl(path).data.publicUrl;
  const { error } = await sb.from('versions').update({ icon_url: iconUrl }).eq('id', vId);
  if (error) { console.error('Icon URL save failed:', error.message); return; }
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

async function deleteVersion(vId) {
  const inUse = GAMES.some(g => g.vId === vId);
  if (inUse) {
    const warn = document.getElementById(`vwarn-${vId}`);
    if (warn) { warn.style.display = ''; setTimeout(() => warn.style.display = 'none', 3000); }
    return;
  }
  await sb.from('versions').delete().eq('id', vId);
  await loadData();
  renderVersionsList();
  renderAll();
}

async function addVersion() {
  const name  = document.getElementById('new-ver-name')?.value.trim();
  const label = document.getElementById('new-ver-abbr')?.value.trim();
  if (!name || !label) return;
  const id = label.toLowerCase().replace(/\s+/g,'');
  const { error } = await sb.from('versions').insert({ id, name, label });
  if (error) { console.error('Add version failed:', error.message); return; }
  document.getElementById('new-ver-name').value = '';
  document.getElementById('new-ver-abbr').value = '';
  await loadData();
  renderVersionsList();
  renderAll();
}

// ── Manage Tags ───────────────────────────────────────────

function openManageTags() {
  renderTagsList();
  openModal('manage-tags-modal');
}

function renderTagsList() {
  const list = document.getElementById('tags-list');
  if (!list) return;
  list.innerHTML = TAGS.map(t => `
    <div class="manage-row" id="trow-${t.name}">
      <span class="manage-tag-name">${t.name}</span>
      <input class="manage-input" id="trename-${t.name}" value="${t.name.replace(/"/g,'&quot;')}"
             style="display:none" placeholder="${i('renametag')}…"/>
      <span class="merge-warning" id="tmwarn-${t.name}" style="display:none;color:#e67e22;font-size:11px">${i('mergewarning')}</span>
      <button class="button-base" id="tren-btn-${t.name}" onclick="startRenameTag('${t.name}')">${i('renametag')}</button>
      <button class="button-base" id="tren-save-${t.name}" style="display:none" onclick="saveRenameTag('${t.name}')">${i('save')}</button>
      <button class="action-button delete-button" onclick="queueDeleteTag('${t.name}')">🗑️</button>
    </div>`
  ).join('');
}

function startRenameTag(name) {
  const input = document.getElementById(`trename-${name}`);
  const btn   = document.getElementById(`tren-btn-${name}`);
  const save  = document.getElementById(`tren-save-${name}`);
  if (!input) return;
  document.getElementById(`trow-${name}`)?.querySelector('.manage-tag-name')?.style.setProperty('display','none');
  input.style.display = '';
  btn.style.display   = 'none';
  save.style.display  = '';
  input.focus();
  input.addEventListener('input', () => {
    const newName = input.value.trim();
    const exists  = TAGS.some(t => t.name.toLowerCase() === newName.toLowerCase() && t.name !== name);
    const warn    = document.getElementById(`tmwarn-${name}`);
    if (warn) warn.style.display = exists ? '' : 'none';
  });
}

async function saveRenameTag(oldName) {
  const input   = document.getElementById(`trename-${oldName}`);
  const newName = input?.value.trim();
  if (!newName || newName === oldName) { renderTagsList(); return; }
  const isMerge = TAGS.some(t => t.name.toLowerCase() === newName.toLowerCase() && t.name !== oldName);
  const type = isMerge ? 'tag_merge' : 'tag_rename'; // Both use same performAction logic
  const desc = isMerge
    ? i('tagmergewarn', oldName, newName)
    : i('tagrenamewarn', oldName, newName);
  await addPendingAction('tag_rename', { oldName, newName }, desc);
  renderTagsList();
}

async function queueDeleteTag(tagName) {
  await addPendingAction('tag_delete', { tagName }, i('tagdelwarn', tagName));
  renderTagsList();
}

async function addTag() {
  const input = document.getElementById('new-tag-name');
  const name  = input?.value.trim();
  if (!name) return;
  const { error } = await sb.from('tags').insert({ name });
  if (error) { console.error('Add tag failed:', error.message); return; }
  input.value = '';
  await loadData();
  renderTagsList();
}
