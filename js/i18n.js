'use strict';

const T = {
  pt: {
    sub:      'Catálogo de jogos feitos no RPG Maker',
    search:   'Buscar título, dev, tags…',
    allver:   'Todas as versões', allcountries: 'Todos os países', alltags: 'Todas as tags',
    filterversions: 'Filtrar versões…', filtercountries: 'Filtrar países…',
    filtertags: 'Filtrar tags…', filterfanlangs: 'Filtrar idiomas…',
    blacklistph: 'Excluir tags…',
    selectedtags: 'Tags selecionadas', blacklistedtags: 'Tags excluídas',
    cols: 'Colunas', compact: 'Tabela', cards: 'Cartões',
    clearall: 'Limpar tudo',
    found:    function(n) { return n + ' jogo' + (n !== 1 ? 's' : '') + ' encontrado' + (n !== 1 ? 's' : ''); },
    loading:  'Carregando…', advsearch: 'Busca Avançada', sortby: 'Ordenar por',
    tagsonly: 'Apenas tags',

    title: 'Título', dev: 'Dev', ver: 'Versão', yr: 'Ano', country: 'País', tags: 'Tags',
    dl: 'Download', na: 'Lost Media', noss: 'Sem screenshot disponível.',
    fanTranslation: 'Fan-tradução', fanDeveloper: 'Dev. Fan-trad.',
    responsible: 'Por',

    adminlogin: 'Login Admin', adminsub: 'Acesso restrito ao painel de administração',
    email: 'E-mail', pass: 'Senha', login: 'Entrar', cancel: 'Cancelar',
    logout: 'Sair', addgame: '+ Adicionar Jogo', editgame: 'Editar Jogo',
    save: 'Salvar', actions: 'Ações', adminmode: 'Modo Admin',
    confirmdel: 'Excluir este jogo?', managever: 'Versões', managetags: 'Tags',
    manageusers: 'Usuários',

    edtitle: 'Título', eddev: 'Desenvolvedor', edver: 'Versão RPG Maker', edyr: 'Ano',
    edss: 'Screenshot URL', eddl: 'Download', edtags: 'Tags', edcountry: 'País de Origem',
    edfanlang: 'Fan-tradução', edfandev: 'Dev. da fan-tradução',
    avail: 'Disponível', na2: 'Lost Media',
    countryph: 'Digite ou selecione um país…',
    tagph: 'Selecionar ou adicionar tag…',
    fanLangph: 'Idioma fan-traduzido…', fanDevph: 'Dev. da fan-tradução…',
    sourceph: 'Link da loja ou fonte (https://…)',
    archiveph: 'Link Archive (Opcional, https://archive.org…)',
    proofph: 'Prova de existência (https://…)',
    lostarchiveph: 'Archive.org (https://archive.org…)',
    protectedtag: 'Esta é uma tag protegida e não pode ser modificada.',
    newtag: 'Nova tag — será adicionada ao salvar',
    tagsrequired: 'Selecione pelo menos uma tag.',
    notitle: 'O jogo precisa de um título.',
    invalidyear: 'Digite um ano válido (ex: 2004).',
    invalidarchive: 'O link deve ser um archive.org válido.',
    sourceOrArchive: 'Informe pelo menos Source ou Archive.',
    fanDevRequired: 'Dev. obrigatório quando o idioma está preenchido.',
    uploadimage: 'Enviar imagem', deleteimage: 'Deletar imagem',

    confirmclear: 'Abandonar busca?',
    confirmclearsub: 'Sua busca atual será limpa e você voltará à visualização padrão.',
    confirmkeep: 'Retornar', confirmclearbtn: 'Abandonar',

    pendingactions: 'Ações Pendentes', executing: 'Executando…',
    gamedelwarn:   function(n)    { return 'Jogo "' + n + '" será excluído'; },
    tagdelwarn:    function(n)    { return 'Tag "' + n + '" será excluída de todos os jogos'; },
    tagrenamewarn: function(o, n) { return 'Tag "' + o + '" será renomeada para "' + n + '"'; },
    tagmergewarn:  function(o, n) { return 'Tag "' + o + '" será mesclada em "' + n + '"'; },

    addversion: '+ Adicionar Versão', vername: 'Nome (longo)',
    cannotdelete: 'Não é possível excluir — há jogos usando esta entrada.',
    deleteconfirm: 'Atenção: clique novamente para excluir esta entrada.',
    addtag: '+ Adicionar Tag', renametag: 'Renomear',
    mergewarning: 'Esta tag já existe e será mesclada.',
    filtertagsmanager: 'Filtrar tags…',
    uploadicon: 'Enviar ícone', deleteicon: 'Deletar ícone',

    // Settings page
    settings: 'Configurações', aboutus: 'Sobre',
    settingsunderconstruction: 'Configurações — em construção.',
    changepassword: 'Alterar senha',
    passwordresetsentto: function(e) { return 'E-mail de redefinição enviado para ' + e + '.'; },
    roleArchiver: 'Arquivista', roleMod: 'Moderador',

    // Users management
    usernameunique: 'Este nome de usuário já está em uso.',
    confirmdeluser: 'Remover acesso deste usuário?',

    // About page
    abouttitle: 'Sobre o RPGMINDEX',
    aboutdesc: 'RPGMINDEX é um catálogo comunitário de jogos feitos com RPG Maker. Nosso objetivo é preservar e documentar jogos independentes criados com as diversas versões do RPG Maker ao longo das décadas.',
    contacttitle: 'Contato', contactsub: 'Envie uma mensagem para a equipe.',
    contactname: 'Nome', contactemail: 'E-mail', contactmsg: 'Mensagem', contactsend: 'Enviar',
    contact: 'Sobre',
  },

  en: {
    sub:      'RPG Maker Games Index',
    search:   'Search title, dev, tags…',
    allver:   'All Versions', allcountries: 'All Countries', alltags: 'All Tags',
    filterversions: 'Filter versions…', filtercountries: 'Filter countries…',
    filtertags: 'Filter tags…', filterfanlangs: 'Filter languages…',
    blacklistph: 'Exclude tags…',
    selectedtags: 'Selected tags', blacklistedtags: 'Blacklisted tags',
    cols: 'Columns', compact: 'Table', cards: 'Cards',
    clearall: 'Clear all',
    found:    function(n) { return n + ' game' + (n !== 1 ? 's' : '') + ' found'; },
    loading:  'Loading…', advsearch: 'Advanced Search', sortby: 'Sort by',
    tagsonly: 'Tags only',

    title: 'Title', dev: 'Developer', ver: 'Version', yr: 'Year', country: 'Country', tags: 'Tags',
    dl: 'Download', na: 'Lost Media', noss: 'No screenshot available.',
    fanTranslation: 'Fan-translation', fanDeveloper: 'Fan-transl. Dev.',
    responsible: 'By',

    adminlogin: 'Admin Login', adminsub: 'Restricted access to admin panel',
    email: 'Email', pass: 'Password', login: 'Login', cancel: 'Cancel',
    logout: 'Logout', addgame: '+ Add Game', editgame: 'Edit Game',
    save: 'Save', actions: 'Actions', adminmode: 'Admin Mode',
    confirmdel: 'Delete this game?', managever: 'Versions', managetags: 'Tags',
    manageusers: 'Users',

    edtitle: 'Title', eddev: 'Developer', edver: 'RPG Maker Version', edyr: 'Year',
    edss: 'Screenshot URL', eddl: 'Download', edtags: 'Tags', edcountry: 'Country of Origin',
    edfanlang: 'Fan-translation', edfandev: 'Fan-translation Dev.',
    avail: 'Available', na2: 'Lost Media',
    countryph: 'Type or select a country…',
    tagph: 'Select or add a tag…',
    fanLangph: 'Fan-translated language…', fanDevph: 'Fan-translation developer…',
    sourceph: 'Store or source link (https://…)',
    archiveph: 'Archive link (Optional, https://archive.org…)',
    proofph: 'Proof of existence (https://…)',
    lostarchiveph: 'Archive.org (https://archive.org…)',
    protectedtag: 'This is a protected tag and cannot be modified.',
    newtag: 'New tag — will be added on save',
    tagsrequired: 'Select at least one tag.',
    notitle: 'Game requires a title.',
    invalidyear: 'Enter a valid year (e.g. 2004).',
    invalidarchive: 'Link must be a valid archive.org URL.',
    sourceOrArchive: 'Provide at least a Source or Archive link.',
    fanDevRequired: 'Dev. required when a language is set.',
    uploadimage: 'Upload image', deleteimage: 'Delete image',

    confirmclear: 'Abandon search?',
    confirmclearsub: 'Your current search will be cleared and you will return to the default view.',
    confirmkeep: 'Return', confirmclearbtn: 'Abandon',

    pendingactions: 'Pending Actions', executing: 'Executing…',
    gamedelwarn:   function(n)    { return 'Game "' + n + '" will be deleted'; },
    tagdelwarn:    function(n)    { return 'Tag "' + n + '" will be deleted from all games'; },
    tagrenamewarn: function(o, n) { return 'Tag "' + o + '" will be renamed to "' + n + '"'; },
    tagmergewarn:  function(o, n) { return 'Tag "' + o + '" will be merged into "' + n + '"'; },

    addversion: '+ Add Version', vername: 'Name (long form)',
    cannotdelete: 'Cannot delete — games are using this entry.',
    deleteconfirm: 'Warning: Click again to delete this entry.',
    addtag: '+ Add Tag', renametag: 'Rename',
    mergewarning: 'This tag already exists and will be merged.',
    filtertagsmanager: 'Filter tags…',
    uploadicon: 'Upload icon', deleteicon: 'Delete icon',

    // Settings page
    settings: 'Settings', aboutus: 'About',
    settingsunderconstruction: 'Settings — under construction.',
    changepassword: 'Change password',
    passwordresetsentto: function(e) { return 'Password reset email sent to ' + e + '.'; },
    roleArchiver: 'Archiver', roleMod: 'Mod',

    // Users management
    usernameunique: 'This username is already taken.',
    confirmdeluser: 'Remove this user\'s access?',

    // About page
    abouttitle: 'About RPGMINDEX',
    aboutdesc: 'RPGMINDEX is a community catalogue of games made with RPG Maker. Our goal is to preserve and document independent games created with the many versions of RPG Maker across the decades.',
    contacttitle: 'Contact', contactsub: 'Send a message to the team.',
    contactname: 'Name', contactemail: 'Email', contactmsg: 'Message', contactsend: 'Send',
    contact: 'About',
  },
};

function i(key) {
  var args = Array.prototype.slice.call(arguments, 1);
  var val  = T[S.lang][key] !== undefined ? T[S.lang][key] : key;
  return typeof val === 'function' ? val.apply(null, args) : val;
}
