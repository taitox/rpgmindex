'use strict';

let S = {
  lang:              'pt',
  theme:             'light',
  view:              'compact',
  isAdmin:           false,
  loading:           true,
  session:           null,
  advancedOpen:      false,
  openDropdown:      null,
  activeModalGameId: null,
  activeDev:         null,
  warningExpanded:   true,

  sort: { col: 'title', dir: 'asc' },

  filters: {
    search:    '',
    versions:  [],
    countries: [],
    years:     [],
    tags:      [],
    tagMode:   'and',
    fanLangs:  [],
  },

  cols: {
    developer: true,
    version:   true,
    year:      true,
    country:   true,
    tags:      true,
    fanLang:   true,
    fanDev:    true,
  },
};
