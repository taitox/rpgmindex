/* jshint esversion: 6 */
'use strict';

const T = {
  pt: {
    sub:      'Catálogo de jogos feitos no RPG Maker',
    search:   'Buscar título, dev, tags…',
    allver:   'Todas as versões',
    freeonly: 'Apenas grátis',
    cols:     'Colunas',
    compact:  'Tabela',
    cards:    'Cartões',
    filters:  'Filtros',
    clearall: 'Limpar tudo',
    found:    n => `${n} jogo${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`,
    loading:  'Carregando…',

    title:   'Título',      dev:     'Dev',          ver:  'Versão',
    yr:      'Ano',         country: 'País',          tags: 'Tags',
    dl:      'Download',    unavail: '❌ Indisponível',
    noss:    'Sem screenshot disponível.',

    adminlogin: 'Login Admin',
    adminsub:   'Acesso restrito ao painel de administração',
    email:      'E-mail',   pass:     'Senha',
    login:      'Entrar',   cancel:   'Cancelar',
    logout:     'Sair',     addgame:  '+ Adicionar Jogo',
    editgame:   'Editar Jogo',
    save:       'Salvar',   actions:  'Ações',
    sortby:     'Ordenar por',
    adminmode:  'Modo Admin',
    confirmdel: 'Excluir este jogo?',

    edtitle:   'Título',           eddev:     'Desenvolvedor',
    edver:     'Versão RPG Maker', edyr:      'Ano',
    edss:      'Screenshot',       edurl:     'URL de Download',
    eddl:      'Download',         edtags:    'Tags',
    edcountry: 'País de Origem',
    avail:     'Disponível',       na:        'Indisponível',
    ssurl:     'URL',              ssupload:  'Enviar Arquivo',
    countryph: 'Digite ou selecione um país…',

    tagsrequired: 'Selecione pelo menos uma tag.',

    contact:      'Contate-nos',
    contacttitle: 'Contato',
    contactsub:   'Envie uma mensagem para a equipe do RPGMINDEX.',
    contactname:  'Nome',
    contactemail: 'E-mail',
    contactmsg:   'Mensagem',
    contactsend:  'Enviar',
  },

  en: {
    sub:      'RPG Maker Games Index',
    search:   'Search title, dev, tags…',
    allver:   'All Versions',
    freeonly: 'Free Only',
    cols:     'Columns',
    compact:  'Table',
    cards:    'Cards',
    filters:  'Filters',
    clearall: 'Clear all',
    found:    n => `${n} game${n !== 1 ? 's' : ''} found`,
    loading:  'Loading…',

    title:   'Title',       dev:     'Developer',     ver:  'Version',
    yr:      'Year',        country: 'Country',        tags: 'Tags',
    dl:      'Download',    unavail: '❌ Unavailable',
    noss:    'No screenshot available.',

    adminlogin: 'Admin Login',
    adminsub:   'Restricted access to admin panel',
    email:      'Email',    pass:     'Password',
    login:      'Login',    cancel:   'Cancel',
    logout:     'Logout',   addgame:  '+ Add Game',
    editgame:   'Edit Game',
    save:       'Save',     actions:  'Actions',
    sortby:     'Sort by',
    adminmode:  'Admin Mode',
    confirmdel: 'Delete this game?',

    edtitle:   'Title',              eddev:     'Developer',
    edver:     'RPG Maker Version',  edyr:      'Year',
    edss:      'Screenshot',         edurl:     'Download URL',
    eddl:      'Download',           edtags:    'Tags',
    edcountry: 'Country of Origin',
    avail:     'Available',          na:        'Unavailable',
    ssurl:     'URL',                ssupload:  'Upload File',
    countryph: 'Type or select a country…',

    tagsrequired: 'Select at least one tag.',

    contact:      'Contact us',
    contacttitle: 'Contact',
    contactsub:   'Send a message to the RPGMINDEX team.',
    contactname:  'Name',
    contactemail: 'Email',
    contactmsg:   'Message',
    contactsend:  'Send',
  },
};

function i(key) {
  return T[S.lang][key] ?? key;
}
