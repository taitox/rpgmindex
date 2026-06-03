/* jshint esversion: 6 */
'use strict';

// ── Language map (static config, never in DB) ─────────────
const LANGS_MAP = [
  { id: 'lang-check-pt', emoji: '🇧🇷' },
  { id: 'lang-check-en', emoji: '🇺🇸' },
  { id: 'lang-check-es', emoji: '🇪🇸' },
];

// ── Runtime data — populated by loadData() ────────────────
let GAMES    = [];
let VERSIONS = [];
let TAGS     = [];  // [{ name, bg, tx, bd }] — bg/tx/bd may be null (use CSS defaults)

// ── Supabase fetch ────────────────────────────────────────

async function loadData() {
  S.loading = true;

  const [gRes, vRes, tRes] = await Promise.all([
    sb.from('games').select('*'),
    sb.from('versions').select('*'),
    sb.from('tags').select('*').order('name', { ascending: true }),
  ]);

  if (gRes.error)  console.error('Error loading games:',    gRes.error.message);
  if (vRes.error)  console.error('Error loading versions:', vRes.error.message);
  if (tRes.error)  console.error('Error loading tags:',     tRes.error.message);

  // Map snake_case DB columns → camelCase JS objects
  GAMES = (gRes.data || []).map(row => ({
    id:         row.id,
    title:      row.title        || '',
    developer:  row.developer    || '',
    vId:        row.v_id,
    year:       row.year,
    langs:      row.langs        || ['🇧🇷'],
    tags:       row.tags         || [],
    ss:         row.ss           || null,
    url:        row.url          || null,
    created_at: row.created_at,
  }));

  VERSIONS = (vRes.data || []).map(row => ({
    id:    row.id,
    label: row.label,
    bg:    row.bg,
    tx:    row.tx,
    bd:    row.bd,
  }));

  TAGS = (tRes.data || []).map(row => ({
    name: row.name,
    bg:   row.color_bg || null,
    tx:   row.color_tx || null,
    bd:   row.color_bd || null,
  }));

  S.loading = false;
}

// ── Developer list — for autocomplete datalist ────────────
function getDevList() {
  return [...new Set(GAMES.map(g => g.developer).filter(Boolean))].sort();
}