'use strict';

const COUNTRIES = [
  ['Unknown',''],
  ['Afghanistan','🇦🇫'],['Albania','🇦🇱'],['Algeria','🇩🇿'],['Andorra','🇦🇩'],
  ['Angola','🇦🇴'],['Argentina','🇦🇷'],['Armenia','🇦🇲'],['Australia','🇦🇺'],
  ['Austria','🇦🇹'],['Azerbaijan','🇦🇿'],['Bahamas','🇧🇸'],['Bahrain','🇧🇭'],
  ['Bangladesh','🇧🇩'],['Belarus','🇧🇾'],['Belgium','🇧🇪'],['Belize','🇧🇿'],
  ['Benin','🇧🇯'],['Bhutan','🇧🇹'],['Bolivia','🇧🇴'],['Bosnia and Herzegovina','🇧🇦'],
  ['Botswana','🇧🇼'],['Brazil','🇧🇷'],['Brunei','🇧🇳'],['Bulgaria','🇧🇬'],
  ['Burkina Faso','🇧🇫'],['Burundi','🇧🇮'],['Cambodia','🇰🇭'],['Cameroon','🇨🇲'],
  ['Canada','🇨🇦'],['Cape Verde','🇨🇻'],['Central African Republic','🇨🇫'],['Chad','🇹🇩'],
  ['Chile','🇨🇱'],['China','🇨🇳'],['Colombia','🇨🇴'],['Comoros','🇰🇲'],
  ['Congo','🇨🇬'],['Costa Rica','🇨🇷'],['Croatia','🇭🇷'],['Cuba','🇨🇺'],
  ['Cyprus','🇨🇾'],['Czech Republic','🇨🇿'],['Denmark','🇩🇰'],['Djibouti','🇩🇯'],
  ['Dominican Republic','🇩🇴'],['DR Congo','🇨🇩'],['Ecuador','🇪🇨'],['Egypt','🇪🇬'],
  ['El Salvador','🇸🇻'],['Equatorial Guinea','🇬🇶'],['Eritrea','🇪🇷'],['Estonia','🇪🇪'],
  ['Eswatini','🇸🇿'],['Ethiopia','🇪🇹'],['Fiji','🇫🇯'],['Finland','🇫🇮'],
  ['France','🇫🇷'],['Gabon','🇬🇦'],['Gambia','🇬🇲'],['Georgia','🇬🇪'],
  ['Germany','🇩🇪'],['Ghana','🇬🇭'],['Greece','🇬🇷'],['Guatemala','🇬🇹'],
  ['Guinea','🇬🇳'],['Guinea-Bissau','🇬🇼'],['Guyana','🇬🇾'],['Haiti','🇭🇹'],
  ['Honduras','🇭🇳'],['Hungary','🇭🇺'],['Iceland','🇮🇸'],['India','🇮🇳'],
  ['Indonesia','🇮🇩'],['Iran','🇮🇷'],['Iraq','🇮🇶'],['Ireland','🇮🇪'],
  ['Israel','🇮🇱'],['Italy','🇮🇹'],['Jamaica','🇯🇲'],['Japan','🇯🇵'],
  ['Jordan','🇯🇴'],['Kazakhstan','🇰🇿'],['Kenya','🇰🇪'],['Kosovo','🇽🇰'],
  ['Kuwait','🇰🇼'],['Kyrgyzstan','🇰🇬'],['Laos','🇱🇦'],['Latvia','🇱🇻'],
  ['Lebanon','🇱🇧'],['Lesotho','🇱🇸'],['Liberia','🇱🇷'],['Libya','🇱🇾'],
  ['Liechtenstein','🇱🇮'],['Lithuania','🇱🇹'],['Luxembourg','🇱🇺'],['Madagascar','🇲🇬'],
  ['Malawi','🇲🇼'],['Malaysia','🇲🇾'],['Maldives','🇲🇻'],['Mali','🇲🇱'],
  ['Malta','🇲🇹'],['Mauritania','🇲🇷'],['Mauritius','🇲🇺'],['Mexico','🇲🇽'],
  ['Moldova','🇲🇩'],['Monaco','🇲🇨'],['Mongolia','🇲🇳'],['Montenegro','🇲🇪'],
  ['Morocco','🇲🇦'],['Mozambique','🇲🇿'],['Myanmar','🇲🇲'],['Namibia','🇳🇦'],
  ['Nepal','🇳🇵'],['Netherlands','🇳🇱'],['New Zealand','🇳🇿'],['Nicaragua','🇳🇮'],
  ['Niger','🇳🇪'],['Nigeria','🇳🇬'],['North Korea','🇰🇵'],['North Macedonia','🇲🇰'],
  ['Norway','🇳🇴'],['Oman','🇴🇲'],['Pakistan','🇵🇰'],['Palestine','🇵🇸'],
  ['Panama','🇵🇦'],['Papua New Guinea','🇵🇬'],['Paraguay','🇵🇾'],['Peru','🇵🇪'],
  ['Philippines','🇵🇭'],['Poland','🇵🇱'],['Portugal','🇵🇹'],['Qatar','🇶🇦'],
  ['Romania','🇷🇴'],['Russia','🇷🇺'],['Rwanda','🇷🇼'],['Saudi Arabia','🇸🇦'],
  ['Senegal','🇸🇳'],['Serbia','🇷🇸'],['Sierra Leone','🇸🇱'],['Singapore','🇸🇬'],
  ['Slovakia','🇸🇰'],['Slovenia','🇸🇮'],['Somalia','🇸🇴'],['South Africa','🇿🇦'],
  ['South Korea','🇰🇷'],['South Sudan','🇸🇸'],['Spain','🇪🇸'],['Sri Lanka','🇱🇰'],
  ['Sudan','🇸🇩'],['Suriname','🇸🇷'],['Sweden','🇸🇪'],['Switzerland','🇨🇭'],
  ['Syria','🇸🇾'],['Taiwan','🇹🇼'],['Tajikistan','🇹🇯'],['Tanzania','🇹🇿'],
  ['Thailand','🇹🇭'],['Timor-Leste','🇹🇱'],['Togo','🇹🇬'],['Trinidad and Tobago','🇹🇹'],
  ['Tunisia','🇹🇳'],['Turkey','🇹🇷'],['Turkmenistan','🇹🇲'],['Uganda','🇺🇬'],
  ['Ukraine','🇺🇦'],['United Arab Emirates','🇦🇪'],['United Kingdom','🇬🇧'],['United States','🇺🇸'],
  ['Uruguay','🇺🇾'],['Uzbekistan','🇺🇿'],['Venezuela','🇻🇪'],['Vietnam','🇻🇳'],
  ['Yemen','🇾🇪'],['Zambia','🇿🇲'],['Zimbabwe','🇿🇼'],
];

const FAN_LANGUAGES = [
  'English','Portuguese','Spanish','French','German','Italian',
  'Russian','Japanese','Korean','Chinese (Simplified)','Chinese (Traditional)',
  'Arabic','Polish','Dutch','Swedish','Norwegian','Danish',
  'Finnish','Czech','Hungarian','Romanian','Turkish','Greek','Ukrainian',
];

let GAMES    = [];
let VERSIONS = [];
let TAGS     = [];
let PROFILES = [];   // all user profiles, loaded when admin is authenticated
let PENDING_ACTIONS = [];

let _versionsInUse  = [];
let _countriesInUse = [];
let _devList        = [];

function getVersionsInUse()  { return _versionsInUse;  }
function getCountriesInUse() { return _countriesInUse; }
function getDevList()        { return _devList;        }

function countryFlag(name) {
  const entry = COUNTRIES.find(function(pair) { return pair[0] === name; });
  return entry ? entry[1] : '';
}

function countryWithFlag(name) {
  if (!name || name === 'Unknown') return name || 'Unknown';
  const flag = countryFlag(name);
  return flag ? flag + ' ' + name : name;
}

// Loads the current user's profile into S.profile.
// Called after every successful login and on initial session restore.
async function loadProfile() {
  if (!S.session || !S.session.user) { S.profile = null; return; }
  const result = await sb.from('profiles').select('*').eq('id', S.session.user.id).single();
  if (result.error || !result.data) { S.profile = null; return; }
  S.profile = {
    id:       result.data.id,
    username: result.data.username,
    role:     result.data.role,
  };
}

// Loads all profiles for the Users management modal (Archiver only).
async function loadProfiles() {
  if (!S.isAdmin) { PROFILES = []; return; }
  const result = await sb.from('profiles').select('*').order('username', { ascending: true });
  if (result.error) { console.error('Profiles:', result.error.message); PROFILES = []; return; }
  PROFILES = (result.data || []).map(function(row) {
    return { id: row.id, username: row.username, role: row.role };
  });
}

async function loadData() {
  S.loading = true;

  const queries = [
    sb.from('games').select('*'),
    sb.from('versions').select('*'),
    sb.from('tags').select('*').order('name', { ascending: true }),
  ];
  if (S.isAdmin) {
    queries.push(sb.from('pending_actions').select('*').order('created_at', { ascending: true }));
  }

  const results    = await Promise.all(queries);
  const gRes = results[0];
  const vRes = results[1];
  const tRes = results[2];
  const pRes = results[3];

  if (gRes.error) console.error('Games:',    gRes.error.message);
  if (vRes.error) console.error('Versions:', vRes.error.message);
  if (tRes.error) console.error('Tags:',     tRes.error.message);

  GAMES = (gRes.data || []).map(function(row) {
    return {
      id:          row.id,
      title:       row.title      || '',
      developer:   row.developer  || '',
      vId:         row.v_id,
      year:        row.year,
      country:     row.country    || 'Unknown',
      tags:        row.tags       || [],
      ss:          row.ss         || null,
      url:         row.url        || null,
      archiveUrl:  row.archive_url  || null,
      isLostMedia: row.is_lost_media || false,
      fanLang:     row.fan_lang   || null,
      fanDev:      row.fan_dev    || null,
      signedBy:    row.signed_by  || null,
      created_at:  row.created_at,
    };
  });

  VERSIONS = (vRes.data || []).map(function(row) {
    return {
      id:      row.id,
      name:    row.name  || row.label,
      label:   row.label,
      iconUrl: row.icon_url || null,
      bg: row.bg, tx: row.tx, bd: row.bd,
    };
  });

  TAGS = (tRes.data || []).map(function(row) {
    return {
      name: row.name,
      bg:   row.color_bg || null,
      tx:   row.color_tx || null,
      bd:   row.color_bd || null,
    };
  });

  PENDING_ACTIONS = (pRes && pRes.data ? pRes.data : []).map(function(row) {
    return {
      id:          row.id,
      type:        row.type,
      payload:     row.payload     || {},
      description: row.description,
      execute_at:  row.execute_at,
      created_by:  row.created_by,
      created_at:  row.created_at,
    };
  });

  // Protected tags must always exist.
  await sb.from('tags').upsert(
    [{ name: 'Lost Media' }, { name: 'Found Media' }],
    { onConflict: 'name', ignoreDuplicates: true }
  );

  await loadProfiles();

  const usedVIds  = new Set(GAMES.map(function(g) { return g.vId; }).filter(Boolean));
  _versionsInUse  = VERSIONS.filter(function(v) { return usedVIds.has(v.id); });
  _countriesInUse = Array.from(new Set(GAMES.map(function(g) { return g.country; }).filter(Boolean))).sort();
  _devList        = Array.from(new Set(GAMES.map(function(g) { return g.developer; }).filter(Boolean))).sort();

  S.loading = false;
}
