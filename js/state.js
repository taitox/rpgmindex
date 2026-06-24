'use strict';

let S = {
  lang:              'pt',
  theme:             'light',
  view:              'compact',
  page:              'games',    // 'games' | 'about' | 'settings'
  isAdmin:           false,
  profile:           null,       // { id, username, role } for the current logged-in user
  loading:           true,
  session:           null,
  advancedOpen:      false,
  openDropdown:      null,
  activeModalGameId: null,
  activeDev:         null,
  warningExpanded:   true,

  sort: { col: 'title', dir: 'asc' },

  filters: {
    search:        '',
    versions:      [],
    countries:     [],
    years:         [],
    tags:          [],
    blacklistTags: [],
    tagModeAll:    true,
    fanLangs:      [],
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
