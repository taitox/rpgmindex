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
  activeDev:        null,     // dev name shown in dev panel; null = hidden
  warningExpanded:  true,     // warning div expand/collapse state

  sort: { col: 'title', dir: 'asc' },

  filters: {
    search:   '',
    versions: [],
    countries: [],
    years:    [],             // selected years (OR logic, same as versions/countries)
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
