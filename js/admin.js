/* jshint esversion: 6 */
'use strict';

// ── Edit-modal tag state ──────────────────────────────────
let editTags     = [];  // [{ name, isNew }]
let _editTagFilter = '';

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
  S.session = null;
  S.isAdmin = false;
  renderAll();
}

// ── Edit / Add ────────────────────────────────────────────

function openEdit(gameId) {
  const g = gameId ? GAMES.find(x => x.id === gameId) : null;

  // Developer autocomplete
  const devList = document.getElementById('developer-list');
  if (devList) devList.innerHTML = getDevList().map(d => `<option value="${d}"/>`).join('');

  // Country datalist
  const ctryList = document.getElementById('country-datalist');
  if (ctryList) ctryList.innerHTML = COUNTRIES.map(c => `<option value="${c}"/>`).join('');

  // Init tag state
  editTags       = (g?.tags || []).map(name => ({ name, isNew: false }));
  _editTagFilter = '';

  document.getElementById('edit-game-id').value        = gameId || '';
  document.getElementById('edit-game-title').value     = g?.title     || '';
  document.getElementById('edit-game-developer').value = g?.developer || '';
  document.getElementById('edit-game-version').value   = g?.vId       || VERSIONS[0]?.id || '';
  document.getElementById('edit-game-year').value      = g?.year      || '';
  document.getElementById('edit-game-country').value   = g?.country   || 'Unknown';

  setScreenshotMode('url');
  document.getElementById('edit-screenshot-url').value = g?.ss || '';

  const dlType = g?.url ? 'available' : 'na';
  document.getElementById(dlType === 'available' ? 'download-available' : 'download-unavailable').checked = true;
  document.getElementById('edit-download-url').value = g?.url || '';
  toggleDownloadField();

  document.getElementById('edit-tag-error').style.display = 'none';
  const tagInput = document.getElementById('edit-tag-input');
  if (tagInput) tagInput.value = '';

  renderEditTagChips();
  renderEditTagDropdown('');

  setText('edit-modal-title', gameId ? i('editgame') : i('addgame'));
  openModal('edit-modal');
}

function toggleDownloadField() {
  const type  = document.querySelector('input[name="download-type"]:checked')?.value;
  const urlEl = document.getElementById('edit-download-url');
  if (urlEl) urlEl.style.display = type === 'available' ? 'block' : 'none';
}

// ── Screenshot mode ───────────────────────────────────────

function setScreenshotMode(mode) {
  const urlInput  = document.getElementById('edit-screenshot-url');
  const fileInput = document.getElementById('edit-screenshot-file');
  const urlBtn    = document.getElementById('screenshot-url-button');
  const fileBtn   = document.getElementById('screenshot-file-button');
  if (mode === 'url') {
    urlInput.style.display = 'block'; fileInput.style.display = 'none';
    urlBtn.classList.add('on'); fileBtn.classList.remove('on');
  } else {
    urlInput.style.display = 'none'; fileInput.style.display = 'block';
    urlBtn.classList.remove('on'); fileBtn.classList.add('on');
  }
}

async function _uploadScreenshot(file) {
  const ext  = file.name.split('.').pop();
  const path = `screenshots/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('screenshots').upload(path, file);
  if (upErr) { console.error('Screenshot upload failed:', upErr.message); return null; }
  const { data } = sb.storage.from('screenshots').getPublicUrl(path);
  return data.publicUrl || null;
}

// ── Edit modal tag multi-select ───────────────────────────

function renderEditTagChips() {
  const el = document.getElementById('edit-tag-chips');
  if (!el) return;
  el.innerHTML = editTags.map(t =>
    `<span class="edit-tag-chip${t.isNew ? ' tag-new' : ''}"
           ${t.isNew ? `title="${i('newtag')}"` : ''}>
      ${t.isNew ? '✨ ' : ''}${t.name}
      <button class="filter-token-remove" onclick="removeEditTag('${t.name}')" aria-label="Remove">×</button>
    </span>`
  ).join('');
}

function renderEditTagDropdown(filter) {
  if (filter !== undefined) _editTagFilter = filter;
  const dropdown = document.getElementById('edit-tag-dropdown');
  if (!dropdown) return;

  const selectedNames = editTags.map(t => t.name);
  const q = _editTagFilter.toLowerCase();
  const available = TAGS.filter(t =>
    t.name.toLowerCase().includes(q) && !selectedNames.includes(t.name)
  );

  if (available.length === 0 && q === '') {
    dropdown.classList.remove('open');
    return;
  }

  dropdown.innerHTML = available.map(t =>
    `<div class="ms-option" onclick="toggleEditTag('${t.name}', false)">${t.name}</div>`
  ).join('') || (q ? `<div class="ms-empty">↵ Enter to add "<strong>${_editTagFilter}</strong>"</div>` : '');

  dropdown.classList.toggle('open', available.length > 0 || q.length > 0);
}

function toggleEditTagDropdown() {
  const dd = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  if (dd.classList.contains('open')) { dd.classList.remove('open'); }
  else { renderEditTagDropdown(_editTagFilter); }
}

function onEditTagInput(value) {
  renderEditTagDropdown(value);
}

function onEditTagKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const value = _editTagFilter.trim();
    if (!value) return;
    if (editTags.find(t => t.name.toLowerCase() === value.toLowerCase())) return;
    const existing = TAGS.find(t => t.name.toLowerCase() === value.toLowerCase());
    editTags.push({ name: existing ? existing.name : value, isNew: !existing });
    document.getElementById('edit-tag-input').value = '';
    _editTagFilter = '';
    document.getElementById('edit-tag-error').style.display = 'none';
    renderEditTagChips();
    renderEditTagDropdown('');
  } else if (event.key === 'Escape') {
    document.getElementById('edit-tag-dropdown')?.classList.remove('open');
  }
}

function toggleEditTag(name, isNew) {
  const idx = editTags.findIndex(t => t.name === name);
  if (idx >= 0) editTags.splice(idx, 1);
  else editTags.push({ name, isNew: !!isNew });
  if (document.getElementById('edit-tag-input')) {
    document.getElementById('edit-tag-input').value = '';
  }
  _editTagFilter = '';
  renderEditTagChips();
  renderEditTagDropdown('');
}

function removeEditTag(name) {
  editTags = editTags.filter(t => t.name !== name);
  renderEditTagChips();
  renderEditTagDropdown(_editTagFilter);
}

// ── Unused tag cleanup ────────────────────────────────────

async function cleanupUnusedTags() {
  const { data: allGames, error: gErr } = await sb.from('games').select('tags');
  if (gErr) { console.error('Tag cleanup: games fetch failed', gErr.message); return; }
  const usedTags = new Set((allGames || []).flatMap(g => g.tags || []));
  const { data: allTagsData, error: tErr } = await sb.from('tags').select('name');
  if (tErr) { console.error('Tag cleanup: tags fetch failed', tErr.message); return; }
  const unused = (allTagsData || []).filter(t => !usedTags.has(t.name)).map(t => t.name);
  if (unused.length > 0) {
    const { error } = await sb.from('tags').delete().in('name', unused);
    if (error) console.error('Tag cleanup: delete failed', error.message);
  }
}

// ── Save ──────────────────────────────────────────────────

async function saveGame() {
  if (editTags.length === 0) {
    document.getElementById('edit-tag-error').style.display = 'block';
    return;
  }
  document.getElementById('edit-tag-error').style.display = 'none';

  const gameId = document.getElementById('edit-game-id').value;
  const dlType = document.querySelector('input[name="download-type"]:checked')?.value;
  const url    = dlType === 'available'
    ? (document.getElementById('edit-download-url').value.trim() || null)
    : null;
  const country = document.getElementById('edit-game-country').value.trim() || 'Unknown';

  // Insert brand-new tags into Supabase first
  const newTags = editTags.filter(t => t.isNew);
  if (newTags.length > 0) {
    const { error: tagErr } = await sb.from('tags').upsert(
      newTags.map(t => ({ name: t.name })), { onConflict: 'name' }
    );
    if (tagErr) console.error('Tag insert failed:', tagErr.message);
  }

  let ss = null;
  const ssFileInput = document.getElementById('edit-screenshot-file');
  const ssUrlInput  = document.getElementById('edit-screenshot-url');
  if (ssFileInput.style.display !== 'none' && ssFileInput.files.length > 0) {
    ss = await _uploadScreenshot(ssFileInput.files[0]);
  } else {
    ss = ssUrlInput.value.trim() || null;
  }

  const game = {
    title:     document.getElementById('edit-game-title').value.trim() || 'Sem título',
    developer: document.getElementById('edit-game-developer').value.trim() || '',
    v_id:      document.getElementById('edit-game-version').value || VERSIONS[0]?.id || '',
    year:      parseInt(document.getElementById('edit-game-year').value) || new Date().getFullYear(),
    country,
    tags:      editTags.map(t => t.name),
    ss,
    url,
  };
  if (gameId) game.id = gameId;

  const { error } = await sb.from('games').upsert(game);
  if (error) { console.error('Save failed:', error.message); return; }

  await cleanupUnusedTags();
  await loadData();
  closeModal('edit-modal');
  renderAll();
}

// ── Delete ────────────────────────────────────────────────

async function delGame(gameId) {
  const g = GAMES.find(x => x.id === gameId);
  if (!confirm(`${i('confirmdel')}\n"${g?.title}"`)) return;
  const { error } = await sb.from('games').delete().eq('id', gameId);
  if (error) { console.error('Delete failed:', error.message); return; }
  await cleanupUnusedTags();
  await loadData();
  renderAll();
}
