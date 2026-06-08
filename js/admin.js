'use strict';

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
  S.session = null;
  S.isAdmin = false;
  renderAll();
}

// ── Edit / Add ────────────────────────────────────────────

function openEdit(gameId) {
  const g = gameId ? GAMES.find(x => x.id === gameId) : null;

  document.getElementById('developer-list').innerHTML =
    getDevList().map(d => `<option value="${d}"/>`).join('');
  document.getElementById('country-datalist').innerHTML =
    COUNTRIES.map(c => `<option value="${c}"/>`).join('');

  editForm.tags      = (g?.tags || []).map(name => ({ name, isNew: false }));
  editForm.tagFilter = '';

  document.getElementById('edit-game-id').value        = gameId || '';
  document.getElementById('edit-game-title').value     = g?.title     || '';
  document.getElementById('edit-game-developer').value = g?.developer || '';
  document.getElementById('edit-game-version').value   = g?.vId       || VERSIONS[0]?.id || '';
  document.getElementById('edit-game-year').value      = g?.year      || '';
  document.getElementById('edit-game-country').value   = g?.country   || 'Unknown';
  document.getElementById('edit-tag-input').value      = '';

  setScreenshotMode('url');
  document.getElementById('edit-screenshot-url').value = g?.ss || '';

  document.getElementById(g?.url ? 'download-available' : 'download-unavailable').checked = true;
  document.getElementById('edit-download-url').value = g?.url || '';
  toggleDownloadField();

  // Clear all inline errors
  ['edit-tag-error', 'edit-title-error', 'edit-year-error'].forEach(id => {
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

// ── Screenshot mode ───────────────────────────────────────

function setScreenshotMode(mode) {
  const isUrl = mode === 'url';
  document.getElementById('edit-screenshot-url').style.display  = isUrl ? 'block' : 'none';
  document.getElementById('edit-screenshot-file').style.display = isUrl ? 'none'  : 'block';
  document.getElementById('screenshot-url-button').classList.toggle('on',  isUrl);
  document.getElementById('screenshot-file-button').classList.toggle('on', !isUrl);
}

async function _uploadScreenshot(file) {
  const path = `screenshots/${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await sb.storage.from('screenshots').upload(path, file);
  if (error) { console.error('Screenshot upload failed:', error.message); return null; }
  return sb.storage.from('screenshots').getPublicUrl(path).data.publicUrl || null;
}

// ── Edit modal tag multi-select ───────────────────────────

function renderEditTagChips() {
  document.getElementById('edit-tag-chips').innerHTML = editForm.tags.map(t =>
    `<span class="edit-tag-chip${t.isNew ? ' tag-new' : ''}" ${t.isNew ? `title="${i('newtag')}"` : ''}>
      ${t.isNew ? '✨ ' : ''}${t.name}
      <button class="filter-token-remove" onclick="removeEditTag('${t.name}')">×</button>
    </span>`
  ).join('');
}

function renderEditTagDropdown(filter) {
  if (filter !== undefined) editForm.tagFilter = filter;
  const dd      = document.getElementById('edit-tag-dropdown');
  if (!dd) return;
  const selected = editForm.tags.map(t => t.name);
  const q        = editForm.tagFilter.toLowerCase();
  const matches  = TAGS.filter(t => t.name.toLowerCase().includes(q) && !selected.includes(t.name));
  dd.innerHTML = matches.map(t =>
    `<div class="ms-option" onclick="toggleEditTag('${t.name}', false)">${t.name}</div>`
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
  idx >= 0 ? editForm.tags.splice(idx, 1) : editForm.tags.push({ name, isNew: !!isNew });
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

// ── Unused tag cleanup ────────────────────────────────────

async function cleanupUnusedTags() {
  const { data: allGames, error: gErr } = await sb.from('games').select('tags');
  if (gErr) { console.error('Tag cleanup — games:', gErr.message); return; }
  const used = new Set((allGames || []).flatMap(g => g.tags || []));
  const { data: allTags, error: tErr } = await sb.from('tags').select('name');
  if (tErr) { console.error('Tag cleanup — tags:', tErr.message); return; }
  const unused = (allTags || []).filter(t => !used.has(t.name)).map(t => t.name);
  if (unused.length) {
    const { error } = await sb.from('tags').delete().in('name', unused);
    if (error) console.error('Tag cleanup — delete:', error.message);
  }
}

// ── Save ──────────────────────────────────────────────────

async function saveGame() {
  let valid = true;

  // Title validation
  const title = document.getElementById('edit-game-title').value.trim();
  const titleErr = document.getElementById('edit-title-error');
  if (!title) {
    titleErr.textContent = i('notitle');
    titleErr.style.display = 'block';
    valid = false;
  } else {
    titleErr.style.display = 'none';
  }

  // Year validation — must be 4 digits starting with 19 or 20
  const yearVal  = document.getElementById('edit-game-year').value.trim();
  const yearErr  = document.getElementById('edit-year-error');
  const validYear = /^(19|20)\d{2}$/.test(yearVal);
  if (!validYear) {
    yearErr.textContent = i('invalidyear');
    yearErr.style.display = 'block';
    document.getElementById('edit-game-year').classList.add('field-error');
    valid = false;
  } else {
    yearErr.style.display = 'none';
    document.getElementById('edit-game-year').classList.remove('field-error');
  }

  // Tags validation
  const tagErr = document.getElementById('edit-tag-error');
  if (!editForm.tags.length) {
    tagErr.style.display = 'block';
    valid = false;
  } else {
    tagErr.style.display = 'none';
  }

  if (!valid) return;

  // Insert brand-new tags first
  const newTags = editForm.tags.filter(t => t.isNew);
  if (newTags.length) {
    const { error } = await sb.from('tags').upsert(newTags.map(t => ({ name: t.name })), { onConflict: 'name' });
    if (error) console.error('Tag insert failed:', error.message);
  }

  const ssFile = document.getElementById('edit-screenshot-file');
  const ssUrl  = document.getElementById('edit-screenshot-url');
  const ss     = (ssFile.style.display !== 'none' && ssFile.files.length)
    ? await _uploadScreenshot(ssFile.files[0])
    : ssUrl.value.trim() || null;

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
