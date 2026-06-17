'use strict';

// app-games.js — loads game data and kicks off the first render.
// Runs after app-core.js has restored session and preferences.

(async function initGames() {

  var loadingEl = document.getElementById('loading-overlay');
  if (loadingEl) loadingEl.classList.remove('hidden');

  try {
    await loadData();
  } catch (err) {
    console.error('Failed to load data:', err);
  }

  if (loadingEl) loadingEl.classList.add('hidden');

  renderAll();

}());
