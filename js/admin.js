/* jshint esversion: 6 */
'use strict';

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

  if (error) {
    errEl.style.display = 'block';
    return;
  }

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

  // Refresh developer autocomplete list
  const devList = document.getElementById('developer-list');
  if (devList) {
    devList.innerHTML = getDevList().map(d => `<option value="${d}"/>`).join('');
  }

  document.getElementById('edit-game-id').value    = gameId || '';
  document.getElementById('edit-game-title').value = g?.title     || '';
  document.getElementById('edit-game-developer').value   = g?.developer || '';
  document.getElementById('edit-game-version').value   = g?.vId       || VERSIONS[0]?.id || '';
  document.getElementById('edit-game-year').value    = g?.year      || '';

  // Screenshot — default to URL mode
  setScreenshotMode('url');
  document.getElementById('edit-screenshot-url').value = g?.ss || '';

  // Download type
  const dlType = g?.url ? 'available' : 'na';
  document.getElementById(`download-${dlType === 'available' ? 'available' : 'unavailable'}`).checked = true;
  document.getElementById('edit-download-url').value = g?.url || '';
  toggleDownloadField();

  // Tag checkboxes — rebuild is handled by syncI18n each renderAll,
  // so just set checked state here
  TAGS.forEach(t => {
    const cb = document.getElementById(`tag-checkbox-${t.name}`);
    if (cb) cb.checked = g?.tags.includes(t.name) || false;
  });
  document.getElementById('edit-tag-error').style.display = 'none';

  // Language checkboxes
  LANGS_MAP.forEach(({ id, emoji }) => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = g?.langs.includes(emoji) || false;
  });

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
    urlInput.style.display  = 'block';
    fileInput.style.display = 'none';
    urlBtn.classList.add('on');
    fileBtn.classList.remove('on');
  } else {
    urlInput.style.display  = 'none';
    fileInput.style.display = 'block';
    urlBtn.classList.remove('on');
    fileBtn.classList.add('on');
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

// ── Save ──────────────────────────────────────────────────

async function saveGame() {
  // Tag validation — block if none selected
  const tagNames = TAGS.map(t => t.name);
  const tags = tagNames.filter(t => document.getElementById(`tag-checkbox-${t}`)?.checked);

  if (tags.length === 0) {
    document.getElementById('edit-tag-error').style.display = 'block';
    return;
  }
  document.getElementById('edit-tag-error').style.display = 'none';

  const gameId  = document.getElementById('edit-game-id').value;
  const dlType  = document.querySelector('input[name="download-type"]:checked')?.value;
  const url     = dlType === 'available'
    ? (document.getElementById('edit-download-url').value.trim() || null)
    : null;

  const langs = LANGS_MAP
    .filter(({ id }) => document.getElementById(id)?.checked)
    .map(({ emoji }) => emoji);

  // Screenshot — URL or uploaded file
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
    developer: document.getElementById('edit-game-developer').value.trim()   || '',
    v_id:      document.getElementById('edit-game-version').value          || VERSIONS[0]?.id || '',
    year:      parseInt(document.getElementById('edit-game-year').value) || new Date().getFullYear(),
    langs:     langs.length ? langs : ['🇧🇷'],
    tags,
    ss,
    url,
  };

  // Include id only when editing — omit on insert so Supabase generates it
  if (gameId) game.id = gameId;

  const { error } = await sb.from('games').upsert(game);
  if (error) { console.error('Save failed:', error.message); return; }

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

  await loadData();
  renderAll();
}
