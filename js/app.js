/* jshint esversion: 6 */
'use strict';

(async function init() {
  // ── Restore persisted preferences ──────────────────────
  try { const t = localStorage.getItem('rpgmkbr-theme'); if (t) S.theme = t; } catch (_) {}
  try { const l = localStorage.getItem('rpgmkbr-lang');  if (l) S.lang  = l; } catch (_) {}
  try { const v = localStorage.getItem('rpgmkbr-view');  if (v) S.view  = v; } catch (_) {}
  try {
    const c = localStorage.getItem('rpgmkbr-cols');
    if (c) S.cols = { ...S.cols, ...JSON.parse(c) };
  } catch (_) {}

  // Fall back to OS colour-scheme preference
  try {
    if (!localStorage.getItem('rpgmkbr-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
      S.theme = 'dark';
    }
  } catch (_) {}

  // ── Apply theme and lang before first paint ─────────────
  document.documentElement.setAttribute('data-theme', S.theme);
  document.documentElement.lang = S.lang === 'pt' ? 'pt-BR' : 'en';

  // ── Show loading overlay ────────────────────────────────
  const loadingOv = document.getElementById('loading-overlay');
  if (loadingOv) loadingOv.classList.remove('hidden');

  // ── Restore Supabase session ────────────────────────────
  try {
    const { data: { session } } = await sb.auth.getSession();
    S.session = session;
    S.isAdmin = !!session;
  } catch (_) {}

  // ── Fetch data from Supabase ────────────────────────────
  try {
    await loadData();
  } catch (err) {
    console.error('loadData failed:', err);
    S.loading = false;
  }

  // ── Hide loading overlay + first render ─────────────────
  if (loadingOv) loadingOv.classList.add('hidden');
  renderAll();

  // ── Listen for auth state changes ───────────────────────
  try {
    sb.auth.onAuthStateChange((_event, session) => {
      S.session = session;
      S.isAdmin = !!session;
      renderAll();
    });
  } catch (_) {}
})();