/* =====================================================================
   Tripoli Royal Shades — Couche de données partagée (site + admin)
   - Charge les données depuis data/site.json
   - Applique les personnalisations stockées en localStorage
   - Expose window.SITE_DATA + window.SiteStore + window.applySiteDataToPage
   ===================================================================== */
(function () {
  'use strict';

  var SITE_DATA_KEY = 'trs-site-data-v1';
  var SITE_JSON_URL = 'data/site.json';

  /* ---------- utils ---------- */
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }

  function deepMerge(base, over) {
    if (Array.isArray(over)) return over.slice();
    if (isObj(base) && isObj(over)) {
      var out = {}, k;
      for (k in base) out[k] = base[k];
      for (k in over) out[k] = (k in out) ? deepMerge(out[k], over[k]) : over[k];
      return out;
    }
    return (over === undefined) ? base : over;
  }

  function getPath(obj, path, fb) {
    if (!obj || !path) return fb;
    var cur = obj, parts = String(path).split('.'), i;
    for (i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return fb;
      cur = cur[parts[i]];
    }
    return (cur === undefined) ? fb : cur;
  }

  function setPath(obj, path, val) {
    var parts = String(path).split('.'), cur = obj, i;
    for (i = 0; i < parts.length - 1; i++) {
      if (!isObj(cur[parts[i]])) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }

  function escAttr(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function escHtml(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function lang() {
    try {
      if (typeof window.LANG === 'string' && window.LANG) return window.LANG;
      var d = document.documentElement ? document.documentElement.lang : '';
      return (d === 'en' || d === 'ar') ? d : 'ar';
    } catch (e) { return 'ar'; }
  }

  function L(obj, fb) {
    if (obj === null || obj === undefined) return (fb === undefined ? '' : fb);
    if (typeof obj === 'string' || typeof obj === 'number') return obj;
    var l = lang();
    if (obj[l] !== undefined && obj[l] !== null) return obj[l];
    if (obj.ar !== undefined) return obj.ar;
    if (obj.en !== undefined) return obj.en;
    return (fb === undefined ? '' : fb);
  }

  /* ---------- store ---------- */
  function loadStored() {
    try {
      var raw = window.localStorage ? localStorage.getItem(SITE_DATA_KEY) : null;
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('[site-data] stored data illisible:', e); }
    return null;
  }

  var stored = loadStored();
  window.SITE_DATA = stored || null;

  var readyResolve;
  var readyPromise = new Promise(function (res) { readyResolve = res; });

  function persist() {
    try {
      window.SITE_DATA.updatedAt = new Date().toISOString();
      localStorage.setItem(SITE_DATA_KEY, JSON.stringify(window.SITE_DATA));
      return true;
    } catch (e) {
      console.error('[site-data] sauvegarde impossible:', e);
      return false;
    }
  }

  window.SiteStore = {
    key: SITE_DATA_KEY,
    ready: readyPromise,
    get data() { return window.SITE_DATA; },
    getPath: getPath,
    setPath: setPath,
    save: persist,
    reset: function () {
      try { localStorage.removeItem(SITE_DATA_KEY); } catch (e) {}
    },
    exportJSON: function () { return JSON.stringify(window.SITE_DATA, null, 2); },
    importJSON: function (obj) {
      if (!isObj(obj) || !isObj(obj.settings) || !Array.isArray(obj.products)) {
        throw new Error('Fichier invalide : settings / products manquants.');
      }
      window.SITE_DATA = obj;
      try { localStorage.setItem(SITE_DATA_KEY, JSON.stringify(obj)); } catch (e) {}
      return true;
    }
  };

  window.trsL = L;
  window.trsLang = lang;
  window.trsEscAttr = escAttr;
  window.trsEscHtml = escHtml;

  /* ---------- styles partagés ---------- */
  var BADGE_BG = {
    green: 'linear-gradient(135deg,#1F7A56,#3AA67C)',
    dark: 'linear-gradient(135deg,#141210,#3A322A)',
    brand: 'linear-gradient(135deg,var(--t-brand-deep),var(--t-brand))',
    brown: 'linear-gradient(135deg,#5B4A2F,#8A6D2B)',
    gold: 'linear-gradient(135deg,#B8964E,#E9D9B8)'
  };
  var FEATURE_STYLE = {
    brand: 'background:linear-gradient(135deg,var(--t-brand-deep),var(--t-brand));color:#fff',
    green: 'background:linear-gradient(135deg,#1F7A56,#3AA67C);color:#fff',
    blue: 'background:linear-gradient(135deg,#0E3C5E,#1A6EA6);color:#fff',
    gold: ''
  };
  var STEP_ACCENT = {
    ink: 'background:linear-gradient(135deg,#141210,#3A322A);border:1px solid var(--t-gold)',
    brand: 'background:linear-gradient(135deg,var(--t-brand-deep),var(--t-brand));border:1px solid var(--t-gold)',
    gold: 'background:linear-gradient(135deg,#7A5F2E,#C9A86A);border:1px solid var(--t-gold)',
    green: 'background:linear-gradient(135deg,#0E3E2C,#1F7A56);border:1px solid var(--t-gold)'
  };
  var STEP_SUB = {
    green: 'background:#22c55e;color:#fff',
    brand: 'background:var(--t-brand);color:#fff',
    ink: 'background:var(--t-inkbox);color:#fff',
    gold: 'background:var(--t-gold);color:#1A1408'
  };
  var TICK_STYLE = {
    gold: 'background:linear-gradient(135deg,#B8964E,#E9D9B8);color:#1A1408',
    gold2: 'background:#D4AF37;color:#1A1408',
    green: ''
  };

  function visibleProducts(D) {
    return (D.products || []).filter(function (p) { return p && p.visible !== false; });
  }
  function featuredProducts(D) {
    return visibleProducts(D).filter(function (p) { return p.featured; });
  }
  function visibleGallery(D) {
    return (D.gallery || []).filter(function (g) { return g && g.visible !== false; });
  }

  /* =====================================================================
     RENDUS DYNAMIQUES (page index uniquement — chaque fonction est gardée)
     ===================================================================== */
  function biAttr(obj) {
    obj = obj || {};
    return 'data-ar="' + escAttr(obj.ar !== undefined ? obj.ar : '') + '" data-en="' + escAttr(obj.en !== undefined ? obj.en : '') + '"';
  }

  function renderHeroSlides(D) {
    var wrap = document.getElementById('heroSlides');
    if (!wrap || !D.hero || !Array.isArray(D.hero.slides) || !D.hero.slides.length) return;
    var l = lang();
    wrap.querySelectorAll('.hero-slide').forEach(function (s) { s.remove(); });
    D.hero.slides.forEach(function (url, i) {
      var d = document.createElement('div');
      d.className = 'hero-slide' + (i === 0 ? ' active' : '');
      d.style.backgroundImage = "url('" + String(url).replace(/'/g, '%27') + "')";
      wrap.insertBefore(d, wrap.firstChild ? wrap.children[Math.min(i, wrap.children.length)] : null);
      if (!wrap.firstChild) wrap.appendChild(d);
    });
    try {
      window.slides = document.querySelectorAll('.hero-slide');
      window.cur = 0;
      if (typeof window.buildDots === 'function') window.buildDots();
      if (window.heroTimer) clearInterval(window.heroTimer);
      window.heroTimer = setInterval(function () {
        if (typeof window.goSlide === 'function') window.goSlide((window.cur + 1) % window.slides.length);
      }, 6000);
    } catch (e) {}
    void l;
  }

  function renderHeroStats(D) {
    var box = document.getElementById('heroStats');
    if (!box || !D.hero || !Array.isArray(D.hero.stats)) return;
    var html = D.hero.stats.map(function (s) {
      s = s || {};
      var valHtml;
      if (s.kind === 'text') {
        valHtml = escHtml(s.value) + (s.star ? ' <i class="fa-solid fa-star text-sm" style="color:#D4AF37"></i>' : '');
      } else {
        valHtml = '<span class="counter" data-target="' + escAttr(s.value) + '">0</span>' + escHtml(s.suffix || '');
      }
      return '<div class="glass rounded-2xl p-3 text-center"><div class="font-black text-xl text-white">' + valHtml + '</div>' +
        '<div class="text-[12px] font-bold text-white/70" ' + biAttr(s.label) + '>' + escHtml(L(s.label)) + '</div></div>';
    }).join('');
    box.innerHTML = html;
  }

  function renderFeatures(D) {
    var grid = document.getElementById('featuresGrid');
    if (!grid || !Array.isArray(D.features)) return;
    grid.innerHTML = D.features.map(function (f, i) {
      f = f || {};
      var cls = (f.color === 'gold')
        ? 'w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0 badge-gold'
        : 'w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0';
      var style = FEATURE_STYLE[f.color] || FEATURE_STYLE.brand;
      return '<div class="reveal lux-card card-shine p-5 flex items-center gap-3' + (i ? ' reveal-d' + Math.min(i, 3) : '') + '">' +
        '<div class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + '><i class="fa-solid ' + escAttr(f.icon || 'fa-star') + '"></i></div>' +
        '<div class="font-bold text-[14px]" ' + biAttr(f.text) + '>' + escHtml(L(f.text)) + '</div></div>';
    }).join('');
  }

  function productCard(p, D) {
    var feats = (p.features || []).map(function (f) {
      return '<li><i class="fa-solid fa-check ml-1" style="color:var(--t-brand)"></i><span ' + biAttr(f) + '>' + escHtml(L(f)) + '</span></li>';
    }).join('');
    var tag = p.photoTag || {};
    return '<div class="reveal lux-card card-shine flex flex-col">' +
      '<div class="img-zoom h-56 relative">' +
      '<img src="' + escAttr(p.image) + '" alt="' + escAttr(L(p.name)) + '" class="w-full h-full object-cover" loading="lazy">' +
      '<span class="photo-tag"><i class="fa-solid ' + escAttr(tag.icon || 'fa-tag') + ' ' + escAttr(tag.color || '') + '"></i> ' + escHtml(tag.text || '') + '</span>' +
      '<span class="absolute top-3 right-3 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow" style="background:' + escAttr(BADGE_BG[p.badgeStyle] || BADGE_BG.brand) + '" ' + biAttr(p.badge) + '>' + escHtml(L(p.badge)) + '</span>' +
      '<div class="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div></div>' +
      '<div class="p-5 flex-1 flex flex-col">' +
      '<h3 class="font-black text-[17px] mb-1" ' + biAttr(p.name) + '>' + escHtml(L(p.name)) + '</h3>' +
      '<p class="text-[13px] font-semibold mb-3 leading-relaxed" style="color:var(--t-muted)" ' + biAttr(p.desc) + '>' + escHtml(L(p.desc)) + '</p>' +
      '<ul class="text-[13px] font-bold space-y-1.5 mb-4">' + feats + '</ul>' +
      '<div class="mt-auto flex items-center justify-between rounded-2xl p-3 border" style="background:var(--t-sand);border-color:var(--t-line)">' +
      '<div><div class="text-[11px] font-bold" style="color:var(--t-muted)" data-ar="يبدأ من" data-en="From">' + (lang() === 'ar' ? 'يبدأ من' : 'From') + '</div>' +
      '<div class="font-black text-xl gold-text">' + escHtml(p.price) + ' <span class="text-[13px]" ' + biAttr(p.unit) + '>' + escHtml(L(p.unit)) + '</span></div></div>' +
      '<button onclick="selectType(\'' + escAttr(p.id) + '\')" class="btn-gold text-sm font-black px-4 py-2.5 rounded-xl" data-ar="احسبها" data-en="Calculate">' + (lang() === 'ar' ? 'احسبها' : 'Calculate') + '</button>' +
      '</div></div></div>';
  }

  function renderServices(D) {
    var grid = document.getElementById('servicesGrid');
    if (!grid || !Array.isArray(D.products)) return;
    var list = visibleProducts(D);
    if (!list.length) return;
    grid.innerHTML = list.map(function (p) { return productCard(p, D); }).join('');
  }

  function priceCard(p, D) {
    var pts = (p.pricePoints || []).map(function (pt) {
      var iconCls = p.priceStyle === 'gold' ? 'style="color:var(--t-brand)"' : 'text-green-600';
      return '<li class="flex gap-2"><i class="fa-solid fa-circle-check mt-1 ' + (p.priceStyle === 'gold' ? '' : 'text-green-600') + '"' + (p.priceStyle === 'gold' ? ' style="color:var(--t-brand)"' : '') + '></i><span ' + biAttr(pt) + '>' + escHtml(L(pt)) + '</span></li>';
    }).join('');
    void D;
    var choose = lang() === 'ar' ? 'اختار هذا النوع' : 'Choose this';
    if (p.priceStyle === 'gold') {
      var pill = (p.priceBadge && (p.priceBadge.ar || p.priceBadge.en))
        ? '<span class="absolute -top-3 right-1/2 translate-x-1/2 text-[12px] font-black px-5 py-1.5 rounded-full shadow z-10 whitespace-nowrap" style="background:linear-gradient(135deg,#7A5F2E,#C9A86A);color:#fff" ' + biAttr(p.priceBadge) + '>' + escHtml(L(p.priceBadge)) + '</span>' : '';
      return '<div class="reveal rounded-[26px] p-[2px] relative md:scale-[1.04] shadow-lux" style="background:linear-gradient(135deg,#B8964E,#F5E6B8 40%,#B8964E 60%,#F5E6B8)">' + pill +
        '<div class="rounded-[24px] p-6 h-full" style="background:var(--t-card);color:var(--t-ink)">' +
        '<div class="font-black text-[12px] tracking-widest mb-1" style="color:var(--t-brand)" ' + biAttr(p.priceTag) + '>' + escHtml(L(p.priceTag)) + '</div>' +
        '<h3 class="font-black text-2xl mb-1" ' + biAttr(p.calcName) + '>' + escHtml(L(p.calcName)) + '</h3>' +
        '<div class="font-black text-5xl mb-1 gold-text">' + escHtml(p.price) + '<span class="text-base font-bold opacity-60" ' + biAttr(p.unit) + '> ' + escHtml(L(p.unit)) + '</span></div>' +
        '<p class="text-sm font-semibold mb-4" style="color:var(--t-muted)" ' + biAttr(p.priceDesc) + '>' + escHtml(L(p.priceDesc)) + '</p>' +
        '<div class="gold-line mb-4"></div><ul class="space-y-2.5 text-sm font-bold">' + pts + '</ul>' +
        '<button onclick="selectType(\'' + escAttr(p.id) + '\')" class="btn-gold w-full mt-6 rounded-2xl py-3 font-black" data-ar="اختار هذا النوع" data-en="Choose this">' + choose + '</button>' +
        '</div></div>';
    }
    return '<div class="reveal rounded-[26px] p-[2px]" style="background:linear-gradient(135deg,#3AA67C,#D9ECE1)">' +
      '<div class="rounded-[24px] p-6 h-full" style="background:var(--t-card);color:var(--t-ink)">' +
      '<div class="font-black text-green-700 text-[12px] tracking-widest mb-1" ' + biAttr(p.priceTag) + '>' + escHtml(L(p.priceTag)) + '</div>' +
      '<h3 class="font-black text-2xl mb-1" ' + biAttr(p.calcName) + '>' + escHtml(L(p.calcName)) + '</h3>' +
      '<div class="font-black text-5xl mb-1 gold-text">' + escHtml(p.price) + '<span class="text-base font-bold opacity-60" ' + biAttr(p.unit) + '> ' + escHtml(L(p.unit)) + '</span></div>' +
      '<p class="text-sm font-semibold mb-4" style="color:var(--t-muted)" ' + biAttr(p.priceDesc) + '>' + escHtml(L(p.priceDesc)) + '</p>' +
      '<div class="gold-line mb-4"></div><ul class="space-y-2.5 text-sm font-bold">' + pts + '</ul>' +
      '<button onclick="selectType(\'' + escAttr(p.id) + '\')" class="w-full mt-6 rounded-2xl py-3 font-black border-2 transition hover:brightness-110" style="border-color:var(--t-line)" data-ar="اختار هذا النوع" data-en="Choose this">' + choose + '</button>' +
      '</div></div>';
  }

  function renderPrices(D) {
    var grid = document.getElementById('pricesGrid');
    if (!grid || !Array.isArray(D.products)) return;
    var feat = featuredProducts(D);
    if (!feat.length) feat = visibleProducts(D).slice(0, 2);
    var html = feat.map(function (p) { return priceCard(p, D); }).join('');
    var n = D.priceNote;
    if (n) {
      var pts = (n.points || []).map(function (pt) {
        return '<li class="flex gap-2"><i class="fa-solid fa-circle-xmark mt-1"></i><span ' + biAttr(pt) + '>' + escHtml(L(pt)) + '</span></li>';
      }).join('');
      html += '<div class="reveal rounded-[26px] p-6 border-2 border-dashed border-white/25 text-white/80" style="background:rgba(255,255,255,.06);backdrop-filter:blur(10px)">' +
        '<div class="font-black text-white/50 text-[12px] tracking-widest mb-1" ' + biAttr(n.tag) + '>' + escHtml(L(n.tag)) + '</div>' +
        '<h3 class="font-black text-2xl mb-1 text-white/70" ' + biAttr(n.title) + '>' + escHtml(L(n.title)) + '</h3>' +
        '<div class="font-black text-5xl mb-1 text-white/40">' + escHtml(n.price) + '<span class="text-base" ' + biAttr(n.unit) + '> ' + escHtml(L(n.unit)) + '</span></div>' +
        '<p class="text-sm font-semibold mb-4" ' + biAttr(n.desc) + '>' + escHtml(L(n.desc)) + '</p>' +
        '<ul class="space-y-2.5 text-sm font-bold">' + pts + '</ul>' +
        '<div class="mt-5 rounded-xl p-3 text-sm font-bold text-center border border-white/15" style="background:rgba(212,175,55,.14);color:#F5E6B8" ' + biAttr(n.advice) + '>' + escHtml(L(n.advice)) + '</div></div>';
    }
    grid.innerHTML = html;
  }

  function renderCalcTypes(D) {
    var box = document.getElementById('typeBtns');
    if (!box || !Array.isArray(D.products)) return;
    var list = visibleProducts(D);
    if (!list.length) return;
    try {
      if (typeof window.curType === 'string' && window.TYPES && !window.TYPES[window.curType]) {
        window.curType = list[0].id;
      }
    } catch (e) {}
    var cur = (typeof window.curType === 'string') ? window.curType : list[0].id;
    box.innerHTML = list.map(function (p) {
      var line = { ar: L(p.calcName, '') + ' — ' + p.price + ' ' + L(getPath(D, 'settings.currency', { ar: 'د.ل', en: 'LYD' })), en: '' };
      line.en = (p.calcName && p.calcName.en ? p.calcName.en : '') + ' — ' + p.price + ' ' + ((D.settings && D.settings.currency && D.settings.currency.en) || 'LYD');
      return '<button data-type="' + escAttr(p.id) + '" onclick="setCalcType(\'' + escAttr(p.id) + '\')" class="type-btn border-2 rounded-2xl p-3 text-right font-bold text-sm transition' + (p.id === cur ? ' active-type' : '') + '" style="border-color:var(--t-line)">' +
        '<div ' + biAttr(line) + '>' + escHtml(L(line)) + '</div>' +
        '<div class="text-xs opacity-70" ' + biAttr(p.calcSub) + '>' + escHtml(L(p.calcSub)) + '</div></button>';
    }).join('');
  }

  function renderGalleryFilters(D) {
    var box = document.getElementById('galleryFilters');
    if (!box || !Array.isArray(D.categories)) return;
    var all = D.categoriesAll || { ar: 'الكل', en: 'All' };
    var html = '<button onclick="filterGallery(\'all\',this)" class="filter-btn active border-2 px-4 py-2 rounded-full font-bold text-sm" style="background:var(--t-card);border-color:var(--t-line)" ' + biAttr(all) + '>' + escHtml(L(all)) + '</button>';
    html += D.categories.map(function (c) {
      return '<button onclick="filterGallery(\'' + escAttr(c.id) + '\',this)" class="filter-btn border-2 px-4 py-2 rounded-full font-bold text-sm" style="background:var(--t-card);border-color:var(--t-line)" ' + biAttr(c.label) + '>' + escHtml(L(c.label)) + '</button>';
    }).join('');
    box.innerHTML = html;
  }

  function renderGallery(D) {
    var grid = document.getElementById('galleryGrid');
    if (!grid || !Array.isArray(D.gallery)) return;
    var list = visibleGallery(D);
    grid.innerHTML = list.map(function (g) {
      g = g || {};
      var b = g.badge || {};
      var badgeInner = b.gold
        ? '<i class="fa-solid ' + escAttr(b.icon || 'fa-circle-check') + '" style="color:#D4AF37"></i> ' + escHtml(b.text || '')
        : '<i class="fa-solid ' + escAttr(b.icon || 'fa-circle-check') + ' text-green-400"></i> ' + escHtml(b.text || '');
      var capAr = escAttr(((g.title && g.title.ar) || '') + ' | ' + ((g.subtitle && g.subtitle.ar) || ''));
      var capEn = escAttr(((g.title && g.title.en) || '') + ' | ' + ((g.subtitle && g.subtitle.en) || ''));
      return '<div class="gallery-item reveal group relative rounded-3xl overflow-hidden img-zoom shadow-card cursor-pointer border" style="border-color:var(--t-gold)" data-cat="' + escAttr(g.category) + '" data-cap-ar="' + capAr + '" data-cap-en="' + capEn + '" onclick="openLightbox(this)">' +
        '<img src="' + escAttr(g.image) + '" class="w-full h-64 object-cover" alt="' + escAttr(L(g.title)) + '" loading="lazy">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>' +
        '<div class="absolute top-3 left-3 glass px-2.5 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1">' + badgeInner + '</div>' +
        '<div class="absolute bottom-3 right-3 left-3 text-white"><div class="font-black text-sm" ' + biAttr(g.title) + '>' + escHtml(L(g.title)) + '</div>' +
        '<div class="text-xs opacity-80 font-bold" ' + biAttr(g.subtitle) + '>' + escHtml(L(g.subtitle)) + '</div></div>' +
        '<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><div class="w-12 h-12 rounded-full glass flex items-center justify-center text-white text-lg"><i class="fa-solid fa-magnifying-glass"></i></div></div></div>';
    }).join('');
  }

  function renderSteps(D) {
    var grid = document.getElementById('stepsGrid');
    if (!grid || !Array.isArray(D.steps)) return;
    var html = '<div class="step-line"></div>' + D.steps.map(function (s, i) {
      s = s || {};
      return '<div class="reveal lux-card text-center p-6 relative card-shine' + (i ? ' reveal-d' + Math.min(i, 3) : '') + '">' +
        '<div class="w-[70px] h-[70px] mx-auto rounded-2xl text-white flex items-center justify-center text-2xl font-black mb-3 relative z-10 shadow-lg" style="' + escAttr(STEP_ACCENT[s.accent] || STEP_ACCENT.ink) + '">' + (i + 1) +
        '<i class="fa-solid ' + escAttr(s.icon2 || 'fa-star') + ' absolute -bottom-2 -left-2 w-7 h-7 rounded-full text-[13px] flex items-center justify-center text-white border-2 border-white" style="' + escAttr(STEP_SUB[s.sub] || STEP_SUB.green) + '"></i></div>' +
        '<h3 class="font-black mb-1" ' + biAttr(s.title) + '>' + escHtml(L(s.title)) + '</h3>' +
        '<p class="text-sm font-semibold" style="color:var(--t-muted)" ' + biAttr(s.desc) + '>' + escHtml(L(s.desc)) + '</p></div>';
    }).join('');
    grid.innerHTML = html;
  }

  function renderWhy(D) {
    var box = document.getElementById('whyPoints');
    var w = D.why || {};
    if (box && Array.isArray(w.points)) {
      box.innerHTML = w.points.map(function (p) {
        p = p || {};
        var tickCls = p.tick === 'green' ? 'tick bg-green-500 text-white shrink-0' : 'tick text-white shrink-0';
        var tickStyle = TICK_STYLE[p.tick] !== undefined ? TICK_STYLE[p.tick] : TICK_STYLE.gold;
        return '<div class="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">' +
          '<div class="' + tickCls + '"' + (tickStyle ? ' style="' + tickStyle + '"' : '') + '><i class="fa-solid fa-check"></i></div>' +
          '<div><div class="font-black" ' + biAttr(p.title) + '>' + escHtml(L(p.title)) + '</div>' +
          '<div class="text-sm opacity-60 font-semibold" ' + biAttr(p.desc) + '>' + escHtml(L(p.desc)) + '</div></div></div>';
      }).join('');
    }
  }

  function renderParallaxStats(D) {
    var grid = document.getElementById('parallaxStats');
    var st = getPath(D, 'sections.parallax.stats', null);
    if (!grid || !Array.isArray(st)) return;
    grid.innerHTML = st.map(function (s) {
      s = s || {};
      var vCls = s.gold ? 'font-black text-2xl' : 'font-black text-2xl text-white';
      var vStyle = s.gold ? ' style="color:#D4AF37"' : '';
      return '<div class="glass rounded-2xl p-4"><div class="' + vCls + '"' + vStyle + '>' + escHtml(s.value) + '</div>' +
        '<div class="text-[12px] font-bold text-white/70" ' + biAttr(s.label) + '>' + escHtml(L(s.label)) + '</div></div>';
    }).join('');
  }

  function renderReviews(D) {
    var track = document.getElementById('testiTrack');
    var R = D.reviews || {};
    if (track && Array.isArray(R.items) && R.items.length) {
      track.innerHTML = R.items.map(function (r) {
        r = r || {};
        var stars = '';
        var n = Math.max(0, Math.min(5, parseInt(r.rating, 10) || 5));
        for (var i = 0; i < n; i++) stars += '<i class="fa-solid fa-star text-sm"></i>';
        return '<div class="min-w-full p-8 md:p-10 text-center" style="background:var(--t-card)">' +
          '<img src="' + escAttr(r.avatar || 'https://i.pravatar.cc/100?img=12') + '" class="w-16 h-16 rounded-full mx-auto mb-3 border-4 object-cover" style="border-color:var(--t-gold)" alt="عميل" loading="lazy">' +
          '<div class="flex justify-center gap-1 mb-3" style="color:#D4AF37">' + stars + '</div>' +
          '<p class="text-lg font-bold leading-relaxed mb-4">' + escHtml(L(r.text)) + '</p>' +
          '<div class="font-black">' + escHtml(r.name || '') + '</div>' +
          '<div class="text-sm font-bold" style="color:var(--t-brand-deep)">✔ <span ' + biAttr(r.verified) + '>' + escHtml(L(r.verified)) + '</span></div></div>';
      }).join('');
      try {
        window.track = track;
        window.tn = track.children.length;
        window.ti = 0;
        track.style.transform = 'translateX(0%)';
        if (typeof window.buildDotsT === 'function') window.buildDotsT();
        if (window.testiTimer) clearInterval(window.testiTimer);
        window.testiTimer = setInterval(function () { if (typeof window.goTesti === 'function') window.goTesti(window.ti + 1); }, 7000);
      } catch (e) {}
    }
  }

  function renderFaq(D) {
    var list = document.getElementById('faqList');
    if (!list || !Array.isArray(D.faqs)) return;
    list.innerHTML = D.faqs.map(function (f) {
      f = f || {};
      return '<div class="faq-item reveal border rounded-2xl overflow-hidden shadow-sm" style="background:var(--t-card);border-color:var(--t-line)">' +
        '<button onclick="this.parentElement.classList.toggle(\'open\')" class="w-full flex justify-between items-center p-5 font-black text-right gap-3"><span ' + biAttr(f.q) + '>' + escHtml(L(f.q)) + '</span>' +
        '<span class="faq-icon w-9 h-9 rounded-full flex items-center justify-center shrink-0 border" style="background:var(--t-sand);border-color:var(--t-line)"><i class="fa-solid fa-plus"></i></span></button>' +
        '<div class="faq-body px-5"><p class="pb-5 font-semibold" style="color:var(--t-muted)" ' + biAttr(f.a) + '>' + escHtml(L(f.a)) + '</p></div></div>';
    }).join('');
  }

  function renderContactSelects(D) {
    var districts = D.districts || {};
    var selD = document.getElementById('cfDistrict');
    if (selD && Array.isArray(districts.ar)) {
      var html = districts.ar.map(function (dAr, i) {
        var dEn = (districts.en && districts.en[i]) || dAr;
        return '<option data-ar="' + escAttr(dAr) + '" data-en="' + escAttr(dEn) + '">' + escHtml(L({ ar: dAr, en: dEn })) + '</option>';
      }).join('');
      var other = districts.other || {};
      html += '<option data-ar="' + escAttr(other.ar || '') + '" data-en="' + escAttr(other.en || '') + '">' + escHtml(L(other)) + '</option>';
      selD.innerHTML = html;
    }
    var selT = document.getElementById('cfType');
    if (selT && Array.isArray(D.products)) {
      var htmlT = visibleProducts(D).map(function (p) {
        return '<option data-ar="' + escAttr((p.option && p.option.ar) || '') + '" data-en="' + escAttr((p.option && p.option.en) || '') + '">' + escHtml(L(p.option)) + '</option>';
      }).join('');
      var co = getPath(D, 'contact.consultOption', {});
      htmlT += '<option data-ar="' + escAttr(co.ar || '') + '" data-en="' + escAttr(co.en || '') + '">' + escHtml(L(co)) + '</option>';
      selT.innerHTML = htmlT;
    }
  }

  function renderFooterServices(D) {
    var ul = document.getElementById('footerServices');
    if (!ul || !Array.isArray(D.products)) return;
    ul.innerHTML = visibleProducts(D).map(function (p) {
      return '<li ' + biAttr(p.name) + '>' + escHtml(L(p.name)) + '</li>';
    }).join('');
  }

  function renderCalcLabels(D) {
    var c = D.calculator || {};
    var cur = getPath(D, 'settings.currency', { ar: 'د.ل', en: 'LYD' }) || {};
    var labels = [
      { id: 'optCurtainLabel', ar: '+ ' + ((c.curtainName && c.curtainName.ar) || '') + ' (+' + (c.curtainPrice || 0) + ' ' + ((c.curtainUnit && c.curtainUnit.ar) || '') + ')', en: '+ ' + ((c.curtainName && c.curtainName.en) || '') + ' (+' + (c.curtainPrice || 0) + ' ' + ((c.curtainUnit && c.curtainUnit.en) || '') + ')' },
      { id: 'optLightLabel', ar: '+ ' + ((c.lightName && c.lightName.ar) || '') + ' (+' + (c.lightPrice || 0) + ' ' + (cur.ar || '') + ')', en: '+ ' + ((c.lightName && c.lightName.en) || '') + ' (+' + (c.lightPrice || 0) + ' ' + (cur.en || '') + ')' }
    ];
    labels.forEach(function (o) {
      var el = document.getElementById(o.id);
      if (el) { el.setAttribute('data-ar', o.ar); el.setAttribute('data-en', o.en); }
    });
  }

  function applyStaticBindings(D) {
    document.querySelectorAll('[data-admin]').forEach(function (el) {
      var v = getPath(D, el.getAttribute('data-admin'), null);
      if (v && typeof v === 'object' && (v.ar !== undefined || v.en !== undefined)) {
        el.setAttribute('data-ar', v.ar !== undefined && v.ar !== null ? v.ar : '');
        el.setAttribute('data-en', v.en !== undefined && v.en !== null ? v.en : '');
      }
    });
    document.querySelectorAll('[data-admin-ph]').forEach(function (el) {
      var v = getPath(D, el.getAttribute('data-admin-ph'), null);
      if (v && typeof v === 'object') {
        el.setAttribute('data-ar-placeholder', v.ar || '');
        el.setAttribute('data-en-placeholder', v.en || '');
      }
    });
    document.querySelectorAll('[data-admin-text]').forEach(function (el) {
      var v = getPath(D, el.getAttribute('data-admin-text'), null);
      if (v !== null && v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-admin-img]').forEach(function (el) {
      var v = getPath(D, el.getAttribute('data-admin-img'), null);
      if (typeof v === 'string' && v) el.setAttribute('src', v);
    });
    document.querySelectorAll('[data-admin-bg]').forEach(function (el) {
      var v = getPath(D, el.getAttribute('data-admin-bg'), null);
      if (typeof v === 'string' && v) el.style.backgroundImage = "url('" + v.replace(/'/g, '%27') + "')";
    });
    var wa = getPath(D, 'settings.whatsapp', '');
    var tel = getPath(D, 'settings.phoneLink', '');
    if (wa) {
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
        try { a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + wa); } catch (e) {}
      });
    }
    if (tel) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        try { a.setAttribute('href', 'tel:' + tel); } catch (e) {}
      });
    }
  }

  function observeNew(D) {
    void D;
    try {
      if (typeof window.io !== 'undefined' && window.io) {
        document.querySelectorAll('.reveal:not([data-trs-obs])').forEach(function (el) {
          el.setAttribute('data-trs-obs', '1');
          window.io.observe(el);
        });
      }
    } catch (e) {}
    try {
      if (typeof window.cio !== 'undefined' && window.cio) {
        document.querySelectorAll('.counter:not([data-trs-obs])').forEach(function (el) {
          el.setAttribute('data-trs-obs', '1');
          window.cio.observe(el);
        });
      }
    } catch (e) {}
  }

  function buildTypesFromData(D) {
    var o = {};
    visibleProducts(D).forEach(function (p) {
      o[p.id] = { p: +p.price || 0, img: p.image, label: p.calcName || p.name };
    });
    return o;
  }

  /* ---------- point d'entrée page index ---------- */
  window.applySiteDataToPage = function () {
    var D = window.SITE_DATA;
    if (!D || typeof document === 'undefined') return false;
    var isIndex = !!(document.getElementById('servicesGrid') || document.querySelector('[data-admin]'));
    if (!isIndex) return false;
    try {
      if (D.districts && Array.isArray(D.districts.ar)) { try { window.DIST = D.districts; } catch (e) {} }
      if (Array.isArray(D.products) && D.products.length) { try { window.TYPES = buildTypesFromData(D); } catch (e) {} }
      applyStaticBindings(D);
      renderHeroSlides(D);
      renderHeroStats(D);
      renderFeatures(D);
      renderServices(D);
      renderPrices(D);
      renderCalcTypes(D);
      renderCalcLabels(D);
      renderGalleryFilters(D);
      renderGallery(D);
      renderSteps(D);
      renderWhy(D);
      renderParallaxStats(D);
      renderReviews(D);
      renderFaq(D);
      renderContactSelects(D);
      renderFooterServices(D);
      observeNew(D);
      if (typeof window.setLang === 'function') {
        try { window.setLang(lang()); } catch (e) {}
      }
      if (typeof window.updateCalc === 'function') {
        try { window.updateCalc(); } catch (e) {}
      }
      try { document.dispatchEvent(new CustomEvent('trs:data-applied')); } catch (e) {}
      return true;
    } catch (e) {
      console.error('[site-data] apply échoué:', e);
      return false;
    }
  };

  window.trsBuildTypes = buildTypesFromData;

  /* ---------- chargement distant (fusion avec le stocké) ---------- */
  function fetchDefaults() {
    var url = SITE_JSON_URL + '?v=' + Date.now();
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  fetchDefaults().then(function (remote) {
    if (!isObj(remote) || !isObj(remote.settings)) throw new Error('site.json invalide');
    window.SITE_DEFAULTS = remote;
    window.SITE_DATA = stored ? deepMerge(remote, stored) : remote;
    readyResolve(window.SITE_DATA);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { window.applySiteDataToPage(); });
    } else {
      window.applySiteDataToPage();
    }
  }).catch(function (e) {
    console.warn('[site-data] data/site.json non chargé (' + (e && e.message) + ') — mode statique/secours.');
    readyResolve(window.SITE_DATA);
    if (window.SITE_DATA) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { window.applySiteDataToPage(); });
      } else {
        window.applySiteDataToPage();
      }
    }
  });
})();
