'use strict';

// app-core.js — session restore, preferences, auth listener, URL routing.
// Loaded on every page. Does NOT load game data.

(async function initCore() {

  // Restore user preferences from localStorage
  try { var t = localStorage.getItem('rpgmkbr-theme'); if (t) setTheme(t); } catch (_) {}
  try { var l = localStorage.getItem('rpgmkbr-lang');  if (l) setLang(l);  } catch (_) {}
  try { var v = localStorage.getItem('rpgmkbr-view');  if (v) S.view = v;  } catch (_) {}
  try {
    var c = localStorage.getItem('rpgmkbr-cols');
    if (c) {
      var parsed = JSON.parse(c);
      Object.keys(parsed).forEach(function(k) { if (k in S.cols) S.cols[k] = parsed[k]; });
    }
  } catch (_) {}

  // Determine initial page from URL hash
  var hashPage = window.location.hash.replace('#', '');
  var validPages = ['games', 'about', 'settings'];
  S.page = validPages.indexOf(hashPage) !== -1 ? hashPage : 'games';

  // Restore existing Supabase session (does not block on network)
  try {
    var sessionResult = await sb.auth.getSession();
    var session = sessionResult.data ? sessionResult.data.session : null;
    if (session) {
      S.session = session;
      S.isAdmin = true;
      await loadProfile();
    }
  } catch (_) {}

  // Listen for login / logout events fired by Supabase Auth
  sb.auth.onAuthStateChange(async function(event, session) {
    S.session = session;
    S.isAdmin = !!session;
    if (session) {
      await loadProfile();
    } else {
      S.profile = null;
    }
    renderAll();
  });

}());
