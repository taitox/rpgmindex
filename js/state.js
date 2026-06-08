'use strict';

let S = {
  lang:             'pt',
  theme:            'light',
  view:             'compact',
  isAdmin:          false,
  loading:          true,
  session:          null,
  advancedOpen:     false,
  openDropdown:     null,    // which ms-*-dropdown is open
  activeModalGameId: null,   // game currently shown in detail modal; used to refresh badges on filter change

  sort: { col: 'title', dir: 'asc' },

  filters: {
    search:   '',
    versions:  [],
    freeOnly: false,
    countries: [],
    tags:     [],
    tagMode:  'and',   // AND by default
  },

  cols: {
    developer: true,
    version:   true,
    year:      true,
    country:   true,
    tags:      true,
  },
};
