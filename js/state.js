'use strict';

let S = {
  lang:             'pt',
  theme:            'light',
  view:             'compact',
  isAdmin:          false,
  loading:          true,
  session:          null,
  advancedOpen:     false,
  openDropdown:     null,
  activeModalGameId: null,

  sort: { col: 'title', dir: 'asc' },

  filters: {
    search:   '',
    versions:  [],
    countries: [],
    tags:     [],
    tagMode:  'and',
  },

  cols: {
    developer: true,
    version:   true,
    year:      true,
    country:   true,
    tags:      true,
  },
};
