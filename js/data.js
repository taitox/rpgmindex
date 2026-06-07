'use strict';

// ── Countries (used in admin dropdown) ───────────────────
const COUNTRIES = [
  'Unknown',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'DR Congo', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland',
  'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
  'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
  'Jordan', 'Kazakhstan', 'Kenya', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

// ── Runtime data — populated by loadData() ────────────────
let GAMES    = [];
let VERSIONS = [];
let TAGS     = [];

// ── Cached derived lists — recomputed after loadData() ────
// Avoids re-filtering on every render call.
let _versionsInUse  = [];
let _countriesInUse = [];
let _devList        = [];

function getVersionsInUse()  { return _versionsInUse;  }
function getCountriesInUse() { return _countriesInUse; }
function getDevList()        { return _devList;         }

// ── Supabase fetch ────────────────────────────────────────

async function loadData() {
  S.loading = true;

  const [gRes, vRes, tRes] = await Promise.all([
    sb.from('games').select('*'),
    sb.from('versions').select('*'),
    sb.from('tags').select('*').order('name', { ascending: true }),
  ]);

  if (gRes.error) console.error('Games load error:',    gRes.error.message);
  if (vRes.error) console.error('Versions load error:', vRes.error.message);
  if (tRes.error) console.error('Tags load error:',     tRes.error.message);

  GAMES = (gRes.data || []).map(row => ({
    id:         row.id,
    title:      row.title     || '',
    developer:  row.developer || '',
    vId:        row.v_id,
    year:       row.year,
    country:    row.country   || 'Unknown',
    tags:       row.tags      || [],
    ss:         row.ss        || null,
    url:        row.url       || null,
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

  // Rebuild cached derived lists
  const usedVIds = new Set(GAMES.map(g => g.vId).filter(Boolean));
  _versionsInUse  = VERSIONS.filter(v => usedVIds.has(v.id));
  _countriesInUse = [...new Set(GAMES.map(g => g.country).filter(Boolean))].sort();
  _devList        = [...new Set(GAMES.map(g => g.developer).filter(Boolean))].sort();

  S.loading = false;
}
