'use strict';

let S = {
  lang:         'pt',
  theme:        'light',
  view:         'compact',
  isAdmin:      false,
  loading:      true,
  session:      null,
  advancedOpen: false,
  openDropdown: null,   // which ms-*-dropdown is open; replaces _openDropdown in ui.js

  sort: { col: 'title', dir: 'asc' },

  filters: {
    search:   '',
    versions:  [],
    freeOnly: false,
    countries: [],
    tags:     [],
    tagMode:  'or',
  },

  cols: {
    developer: true,
    version:   true,
    year:      true,
    country:   true,
    tags:      true,
  },
};
