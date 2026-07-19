// HANDLELISTE_MENU_IOS12_ES5_COMPAT_V238
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// HANDLELISTE_MENU_V223_DELETE_DETAIL_AND_ARCHIVE

/* Handleliste felles toppmeny v4
   Produksjonsnavn: handleliste-menu.js */
(function () {
  function loadSharedErrorLogger() {
    if (window.KvimarkaErrorLogger) {
      return Promise.resolve(window.KvimarkaErrorLogger);
    }
    if (window.KvimarkaErrorLoggerReady) {
      return window.KvimarkaErrorLoggerReady;
    }
    window.KvimarkaErrorLoggerReady = new Promise(function (resolve) {
      var existing = document.getElementById("kvimarkaErrorLoggerScript");
      if (existing) {
        existing.addEventListener("load", function () {
          return resolve(window.KvimarkaErrorLogger || null);
        }, {
          once: true
        });
        existing.addEventListener("error", function () {
          return resolve(null);
        }, {
          once: true
        });
        return;
      }
      var script = document.createElement("script");
      script.id = "kvimarkaErrorLoggerScript";
      script.src = "shared/kvimarka-error-logger.js?v=2";
      script.async = false;
      script.onload = function () {
        return resolve(window.KvimarkaErrorLogger || null);
      };
      script.onerror = function () {
        console.warn("Kunne ikke laste felles feillogger.");
        resolve(null);
      };
      (document.head || document.documentElement).appendChild(script);
    });
    return window.KvimarkaErrorLoggerReady;
  }
  loadSharedErrorLogger();
  var MENU_VERSION = "handleliste-menu-v17-manage-types-2026-07-14";
  var API_BASE = "https://api-kvimarka92.carstereogarage.com";
  function svg(name) {
    var common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    var icons = {
      clipboard: "<svg ".concat(common, "><path d=\"M9 4.5h6\"></path><path d=\"M10 3h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1z\"></path><rect x=\"6\" y=\"5\" width=\"12\" height=\"16\" rx=\"2\"></rect><path d=\"M9 10l1.4 1.4L13 8.8\"></path><path d=\"M9 14l1.4 1.4L13 12.8\"></path><path d=\"M9 18l1.4 1.4L13 16.8\"></path><path d=\"M14.5 10H16\"></path><path d=\"M14.5 14H16\"></path><path d=\"M14.5 18H16\"></path></svg>"),
      cart: "<svg ".concat(common, "><circle cx=\"9\" cy=\"19\" r=\"1.6\"></circle><circle cx=\"17\" cy=\"19\" r=\"1.6\"></circle><path d=\"M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H7.2\"></path></svg>"),
      home: "<svg ".concat(common, "><path d=\"M4 11.5L12 5l8 6.5\"></path><path d=\"M7 10.5V19h10v-8.5\"></path></svg>"),
      sliders: "<svg ".concat(common, "><path d=\"M5 7h14\"></path><path d=\"M5 12h14\"></path><path d=\"M5 17h14\"></path><circle cx=\"9\" cy=\"7\" r=\"1.7\"></circle><circle cx=\"15\" cy=\"12\" r=\"1.7\"></circle><circle cx=\"11\" cy=\"17\" r=\"1.7\"></circle></svg>"),
      pencil: "<svg ".concat(common, "><path d=\"M4 20h4l11-11a2.6 2.6 0 0 0-4-4L4 16v4z\"></path><path d=\"M13.5 6.5l4 4\"></path></svg>"),
      bell: "<svg ".concat(common, "><path d=\"M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9\"></path><path d=\"M10 21h4\"></path></svg>"),
      book: "<svg ".concat(common, "><path d=\"M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H7a3 3 0 0 0-3 3V5.5z\"></path><path d=\"M4 20a3 3 0 0 1 3-3h13\"></path></svg>"),
      history: "<svg ".concat(common, "><path d=\"M5 20V12\"></path><path d=\"M12 20V5\"></path><path d=\"M19 20V9\"></path></svg>"),
      help: "<svg ".concat(common, "><circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 2-2.3 4\"></path><path d=\"M12 17.2v.1\"></path></svg>")
    };
    return icons[name] || "";
  }
  function pageName() {
    return location.pathname.split("/").pop().toLowerCase();
  }
  function isHandlelisteHelpCase() {
    try {
      var url = new URL(location.href);
      var caseName = (url.searchParams.get("case") || "").toLowerCase();
      return pageName() === "help.html" && caseName === "handleliste";
    } catch (error) {
      return false;
    }
  }
  function shouldRenderOnThisPage() {
    var page = pageName();
    return page.startsWith("handleliste-") || isHandlelisteHelpCase();
  }
  function addCss() {
    if (document.getElementById("handlelisteSharedMenuCss")) return;
    var style = document.createElement("style");
    style.id = "handlelisteSharedMenuCss";
    style.textContent = "\n      html.handleliste-size-small{--handleliste-menu-scale:1;}\n      html.handleliste-size-medium{--handleliste-menu-scale:1.08;}\n      html.handleliste-size-large{--handleliste-menu-scale:1.18;}\n\n      .handleliste-shared-top-menu{\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        gap:10px !important;\n        flex-wrap:wrap !important;\n        margin:14px 0 0 !important;\n      }\n      .handleliste-shared-top-menu .top-button{\n        display:inline-flex !important;\n        align-items:center !important;\n        justify-content:center !important;\n        width:44px !important;\n        height:44px !important;\n        min-width:44px !important;\n        min-height:44px !important;\n        padding:0 !important;\n        text-decoration:none !important;\n        line-height:1 !important;\n      }\n      .handleliste-shared-top-menu .top-button svg{\n        width:22px !important;\n        height:22px !important;\n        fill:none !important;\n        stroke:currentColor !important;\n        stroke-width:2 !important;\n        stroke-linecap:round !important;\n        stroke-linejoin:round !important;\n        display:block !important;\n      }\n      .handleliste-shared-top-menu .menu-icon-button{\n        font-size:0 !important;\n      }\n\n      .handleliste-floating-controls{\n        position:fixed !important;\n        top:18px !important;\n        right:20px !important;\n        z-index:99999 !important;\n        display:flex !important;\n        align-items:center !important;\n        gap:8px !important;\n      }\n      .handleliste-floating-controls .floating-round-button,\n      .handleliste-floating-controls .login-status{\n        display:flex !important;\n        align-items:center !important;\n        justify-content:center !important;\n        width:38px !important;\n        height:38px !important;\n        min-width:38px !important;\n        min-height:38px !important;\n        padding:0 !important;\n        border:1px solid var(--border,#555) !important;\n        border-radius:50% !important;\n        background:var(--card,#242424) !important;\n        color:var(--muted,#bbb) !important;\n        text-decoration:none !important;\n        font-size:13px !important;\n        font-weight:bold !important;\n        line-height:1 !important;\n        opacity:.88 !important;\n        box-sizing:border-box !important;\n        cursor:pointer !important;\n      }\n      .handleliste-floating-controls .floating-round-button:hover,\n      .handleliste-floating-controls .login-status:hover{\n        opacity:1 !important;\n        color:var(--text,#eee) !important;\n      }\n      .handleliste-floating-controls .floating-round-button svg{\n        width:20px !important;\n        height:20px !important;\n        fill:none !important;\n        stroke:currentColor !important;\n        stroke-width:2 !important;\n        stroke-linecap:round !important;\n        stroke-linejoin:round !important;\n      }\n      .handleliste-floating-controls .settings-wrap{\n        position:relative !important;\n        display:inline-flex !important;\n      }\n      .handleliste-floating-controls .settings-menu{\n        position:absolute !important;\n        top:44px !important;\n        right:0 !important;\n        min-width:210px !important;\n        z-index:99999 !important;\n        padding:7px !important;\n        border-radius:10px !important;\n        background:var(--card,#242424) !important;\n        color:var(--text,#eee) !important;\n        border:1px solid var(--border,#555) !important;\n        box-shadow:0 12px 32px rgba(0,0,0,.28) !important;\n        display:none !important;\n      }\n      .handleliste-floating-controls .settings-wrap.open .settings-menu{\n        display:block !important;\n      }\n      .handleliste-floating-controls .settings-menu a{\n        display:block !important;\n        padding:9px 10px !important;\n        border-radius:8px !important;\n        color:var(--text,#eee) !important;\n        text-decoration:none !important;\n        font-weight:700 !important;\n        white-space:nowrap !important;\n        text-align:center !important;\n      }\n      .handleliste-floating-controls .settings-menu a:hover,\n      .handleliste-floating-controls .settings-menu a.current-page{\n        background:rgba(127,127,127,.18) !important;\n      }\n      .handleliste-floating-controls .login-menu{\n        position:absolute !important;\n        top:44px !important;\n        right:0 !important;\n        min-width:247px !important;\n        padding:10px !important;\n        border:1px solid var(--border,#555) !important;\n        border-radius:10px !important;\n        background:var(--card,#242424) !important;\n        color:var(--text,#eee) !important;\n        box-shadow:0 8px 24px rgba(0,0,0,.25) !important;\n        box-sizing:border-box !important;\n        display:none;\n      }\n      .handleliste-floating-controls .login-menu-name{\n        display:block !important;\n        font-weight:bold !important;\n        font-size:13px !important;\n        line-height:1.25 !important;\n        margin-bottom:8px !important;\n        color:var(--text,#eee) !important;\n        white-space:normal !important;\n        overflow-wrap:anywhere !important;\n      }\n      .handleliste-floating-controls .login-menu-link{\n        display:block !important;\n        padding:8px 10px !important;\n        margin:0 -4px -4px !important;\n        border-radius:8px !important;\n        color:var(--handle-important-text,var(--link,#7cc7e8)) !important;\n        text-decoration:none !important;\n        font-weight:bold !important;\n        font-size:13px !important;\n      }\n      .handleliste-floating-controls .login-menu-link:hover{\n        background:rgba(127,127,127,.14) !important;\n      }\n      .handleliste-floating-controls .login-status.is-signin{\n        font-size:0 !important;\n      }\n      .handleliste-floating-controls .login-status.is-signin::before{\n        content:\"\u2197\";\n        font-size:18px;\n        font-weight:bold;\n      }\n      .handleliste-create-user-modal{\n        display:none;\n        position:fixed;\n        inset:0;\n        z-index:100000;\n        background:rgba(0,0,0,.72);\n        padding:18px;\n        overflow:auto;\n        box-sizing:border-box;\n      }\n      .handleliste-create-user-modal.open{\n        display:block;\n      }\n      .handleliste-create-user-modal-content{\n        width:min(520px, calc(100vw - 36px));\n        margin:70px auto;\n        padding:18px;\n        border-radius:14px;\n        background:var(--card,#242424);\n        color:var(--text,#eee);\n        border:1px solid var(--border,#555);\n        box-shadow:0 18px 44px rgba(0,0,0,.35);\n      }\n      .handleliste-create-user-modal-header{\n        display:flex;\n        align-items:center;\n        justify-content:space-between;\n        gap:12px;\n        margin-bottom:14px;\n      }\n      .handleliste-create-user-modal-title{\n        font-size:22px;\n        font-weight:800;\n      }\n      .handleliste-create-user-modal-close{\n        width:40px;\n        height:40px;\n        min-width:40px;\n        border:0;\n        border-radius:8px;\n        background:rgba(127,127,127,.16);\n        color:var(--text,#eee);\n        font-size:24px;\n        font-weight:bold;\n        cursor:pointer;\n      }\n      .handleliste-create-user-field{\n        display:flex;\n        flex-direction:column;\n        gap:6px;\n        margin-bottom:12px;\n      }\n      .handleliste-create-user-field label{\n        font-size:14px;\n        font-weight:800;\n      }\n      .handleliste-create-user-field input,\n      .handleliste-create-user-field select{\n        width:100%;\n        min-height:40px;\n        padding:0 12px;\n        border:1px solid var(--border,#555);\n        border-radius:8px;\n        background:var(--card,#242424);\n        color:var(--text,#eee);\n        font-size:15px;\n        box-sizing:border-box;\n        color-scheme:dark;\n      }\n      .handleliste-create-user-field select option{\n        background:#242424;\n        color:#eee;\n      }\n      body.light-mode .handleliste-create-user-field select,\n      body.light-mode .handleliste-create-user-field select option{\n        background:#fff;\n        color:#222;\n        color-scheme:light;\n      }\n      .handleliste-create-user-help{\n        margin:0 0 14px;\n        color:var(--muted,#bbb);\n        font-size:13px;\n        line-height:1.35;\n      }\n      .handleliste-create-user-actions{\n        display:flex;\n        justify-content:flex-end;\n        gap:8px;\n        flex-wrap:wrap;\n        margin-top:14px;\n      }\n      .handleliste-create-user-button{\n        display:inline-flex;\n        align-items:center;\n        justify-content:center;\n        min-height:36px;\n        padding:0 12px;\n        border:0;\n        border-radius:8px;\n        background:rgba(127,127,127,.16);\n        color:var(--text,#eee);\n        font-weight:800;\n        cursor:pointer;\n      }\n      .handleliste-create-user-button.primary{\n        background:var(--link,#7cc7e8);\n        color:#fff;\n      }\n      body.light-mode #handlelisteItemTypeForm .handleliste-create-user-button.primary{\n        background:#0067c0;\n        color:#fff;\n      }\n      body.light-mode #handlelisteDeleteItemTypeForm .handleliste-create-user-button{\n        background:#b42318 !important;\n        color:#fff;\n      }\n      .handleliste-create-user-status{\n        min-height:18px;\n        margin-top:10px;\n        color:var(--muted,#bbb);\n        font-size:13px;\n        line-height:1.35;\n      }\n      .handleliste-create-user-status.error{color:#ff8b8b;}\n      .handleliste-create-user-status.success{color:#72c184;}\n      @media(max-width:700px){\n        .handleliste-floating-controls{\n          top:10px !important;\n          right:10px !important;\n          gap:7px !important;\n        }\n        .handleliste-floating-controls .floating-round-button,\n        .handleliste-floating-controls .login-status{\n          width:36px !important;\n          height:36px !important;\n          min-width:36px !important;\n          min-height:36px !important;\n        }\n        .handleliste-shared-top-menu{\n          gap:8px !important;\n        }\n      }\n\n      .handleliste-shared-top-menu .settings-wrap{\n        position:relative !important;\n        display:inline-flex !important;\n      }\n      .handleliste-shared-top-menu .settings-menu{\n        position:absolute !important;\n        top:50px !important;\n        right:0 !important;\n        min-width:210px !important;\n        z-index:99999 !important;\n        padding:7px !important;\n        border-radius:10px !important;\n        background:var(--card,#242424) !important;\n        color:var(--text,#eee) !important;\n        box-shadow:0 12px 32px rgba(0,0,0,.28) !important;\n        display:none !important;\n      }\n      .handleliste-shared-top-menu .settings-wrap.open .settings-menu{\n        display:block !important;\n      }\n      .handleliste-shared-top-menu .settings-menu a{\n        display:block !important;\n        padding:9px 10px !important;\n        border-radius:8px !important;\n        color:var(--text,#eee) !important;\n        text-decoration:none !important;\n        font-weight:700 !important;\n        white-space:nowrap !important;\n        text-align:center !important;\n      }\n      .handleliste-shared-top-menu .settings-menu a:hover,\n      .handleliste-shared-top-menu .settings-menu a.current-page{\n        background:rgba(127,127,127,.18) !important;\n      }\n      body:not(.dark-mode) .handleliste-shared-top-menu .settings-menu{\n        background:#ffffff !important;\n        color:#111827 !important;\n        border:1px solid #d1d5db !important;\n      }\n      body:not(.dark-mode) .handleliste-shared-top-menu .settings-menu a{\n        color:#111827 !important;\n      }\n\n      #handlelisteSizeToggle{\n        font-size:20px !important;\n        letter-spacing:-.04em !important;\n        padding:0 3px !important;\n      }\n      html.handleliste-size-medium #handlelisteSizeToggle,\n      html.handleliste-size-large #handlelisteSizeToggle{\n        font-size:18px !important;\n        letter-spacing:-.08em !important;\n      }\n\n      .handleliste-shared-top-menu .theme-text-symbol{\n        font-size:22px !important;\n        font-family:Arial, sans-serif !important;\n        font-weight:700 !important;\n      }\n      html.handleliste-size-medium body{font-size:calc(16px * 1.08) !important;}\n      html.handleliste-size-large body{font-size:calc(16px * 1.18) !important;}\n      html.handleliste-size-medium .item-name,\n      html.handleliste-size-medium .action-button,\n      html.handleliste-size-medium .owner-button,\n      html.handleliste-size-medium .status{font-size:calc(1em * 1.06) !important;}\n      html.handleliste-size-large .item-name,\n      html.handleliste-size-large .action-button,\n      html.handleliste-size-large .owner-button,\n      html.handleliste-size-large .status{font-size:calc(1em * 1.13) !important;}\n\n\n      body.dark-mode .handleliste-shared-top-menu .bestille-top-button,\n      body.dark-mode .handleliste-shared-top-menu .handle-top-button{\n        color:#ffffff !important;\n      }\n      body:not(.dark-mode) .handleliste-shared-top-menu .bestille-top-button,\n      body:not(.dark-mode) .handleliste-shared-top-menu .handle-top-button{\n        color:#111827 !important;\n      }\n      .handleliste-page-corner-icon{\n        position:fixed !important;\n        top:18px !important;\n        left:20px !important;\n        width:48px !important;\n        height:48px !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:center !important;\n        z-index:50 !important;\n        color:#b8b8c4 !important;\n        pointer-events:none !important;\n      }\n      .handleliste-page-corner-icon svg{\n        width:42px !important;\n        height:42px !important;\n        fill:none !important;\n        stroke:currentColor !important;\n        stroke-width:2 !important;\n        stroke-linecap:round !important;\n        stroke-linejoin:round !important;\n      }\n      body:not(.dark-mode) .handleliste-page-corner-icon{\n        color:#59606c !important;\n      }\n\n      @media(max-width:700px){\n        .handleliste-shared-top-menu{gap:8px !important;}\n        .handleliste-shared-top-menu .top-button{\n          width:40px !important;\n          height:40px !important;\n          min-width:40px !important;\n          min-height:40px !important;\n        }\n      }\n    ";
    document.head.appendChild(style);
  }
  function readSize() {
    try {
      return localStorage.getItem("shoppingHandleSize") || localStorage.getItem("handlelisteSize") || "small";
    } catch (error) {
      return "small";
    }
  }
  function normalizedSize() {
    var value = readSize();
    return ["small", "medium", "large"].includes(value) ? value : "small";
  }
  function updateSizeButton() {
    var btn = document.getElementById("handlelisteSizeToggle");
    if (!btn) return;
    var size = normalizedSize();
    btn.textContent = size === "large" ? "A++" : size === "medium" ? "A+" : "A";
    btn.title = "Endre tekststørrelse";
    btn.setAttribute("aria-label", btn.title);
  }
  function applySizeState() {
    var size = normalizedSize();
    document.documentElement.classList.remove("handleliste-size-small", "handleliste-size-medium", "handleliste-size-large");
    document.documentElement.classList.add("handleliste-size-" + size);
    if (typeof window.applyHandleSizeState === "function") {
      try {
        window.applyHandleSizeState();
      } catch (error) {}
    }
    updateSizeButton();
  }
  function toggleSize() {
    try {
      var allowed = ["small", "medium", "large"];
      var current = normalizedSize();
      var idx = allowed.indexOf(current);
      var next = allowed[(idx < 0 ? 0 : idx + 1) % allowed.length];
      localStorage.setItem("shoppingHandleSize", next);
      localStorage.setItem("handlelisteSize", next);
    } catch (error) {}
    applySizeState();
  }
  function getThemeIsDark() {
    try {
      var saved = localStorage.getItem("shoppingTheme") || localStorage.getItem("brochureTheme") || "dark";
      return saved !== "light";
    } catch (error) {
      return document.body ? document.body.classList.contains("dark-mode") : true;
    }
  }
  function updateThemeButton() {
    var btn = document.getElementById("handlelisteThemeToggle");
    if (!btn) return;
    var isDark = getThemeIsDark();
    btn.innerHTML = "<span class=\"theme-text-symbol\">".concat(isDark ? "✱" : "☾", "</span>");
    btn.title = isDark ? "Bytt til lys modus" : "Bytt til mørk modus";
    btn.setAttribute("aria-label", btn.title);
  }
  function applyThemeState() {
    try {
      var isDark = getThemeIsDark();
      if (document.body) {
        document.body.classList.toggle("dark-mode", isDark);
      }
      document.documentElement.classList.toggle("preload-dark-mode", isDark);
      localStorage.setItem("shoppingTheme", isDark ? "dark" : "light");
      localStorage.setItem("brochureTheme", isDark ? "dark" : "light");
    } catch (error) {}
    updateThemeButton();
    setTimeout(updateViewToggleButton, 0);
    setTimeout(updateViewToggleButton, 150);
  }
  function toggleTheme() {
    try {
      var isDark = getThemeIsDark();
      localStorage.setItem("shoppingTheme", isDark ? "light" : "dark");
      localStorage.setItem("brochureTheme", isDark ? "light" : "dark");
    } catch (error) {}
    applyThemeState();
  }
  function toggleDesign() {
    if (typeof window.toggleShoppingDesign === "function") {
      window.toggleShoppingDesign();
      return;
    }
    try {
      var isClassic = document.documentElement.classList.toggle("classic-design-root");
      localStorage.setItem("shoppingDesign", isClassic ? "classic" : "soft");
    } catch (error) {}
  }
  function goBack(event) {
    if (window.goHandlelisteBackOrHome) {
      return window.goHandlelisteBackOrHome(event);
    }
    if (event) event.preventDefault();
    window.location.href = "index.html?restoreMenu=1";
    return false;
  }
  function currentBasePage() {
    return pageName();
  }
  function isCurrentTarget(url) {
    try {
      var targetPage = String(url || "").split("?")[0].split("#")[0].toLowerCase();
      if (targetPage === currentBasePage()) {
        return true;
      }
      if (targetPage === "handleliste-oppskrifter-rediger.html" && currentBasePage() === "handleliste-oppskrifter-rediger.html") {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  function pushAndGo(url, event) {
    if (event) event.preventDefault();
    if (isCurrentTarget(url)) {
      closeSettings();
      return false;
    }
    try {
      if (window.pushHandlelisteBackUrl) {
        window.pushHandlelisteBackUrl();
      }
    } catch (error) {}
    window.location.href = url;
    return false;
  }
  function getInitials(value) {
    var text = String(value || "").trim();
    if (!text) {
      return "";
    }
    var withoutEmail = text.includes("@") ? text.split("@")[0] : text;
    var cleaned = withoutEmail.replace(/[._-]+/g, " ").trim();
    var parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
  }
  function isAdminUser(user) {
    var role = String(user && user.role || "").trim().toLowerCase();
    var handlelisteRole = String(user && user.handlelisteRole || "").trim().toLowerCase();
    var memberRole = String(user && user.family && user.family.memberRole || "").trim().toLowerCase();
    return !!(user && user.isFamilyAdmin) || role === "administrator" || role === "admin" || role === "supervisor" || handlelisteRole === "administrator" || handlelisteRole === "admin" || handlelisteRole === "family admin" || handlelisteRole === "family_admin" || memberRole === "administrator" || memberRole === "admin" || memberRole === "family admin" || memberRole === "family_admin" || memberRole === "owner";
  }
  function fetchCurrentUser() {
    return _fetchCurrentUser.apply(this, arguments);
  }
  function _fetchCurrentUser() {
    _fetchCurrentUser = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var res, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            _context.n = 1;
            return fetch("".concat(API_BASE, "/whoami"), {
              credentials: "include",
              cache: "no-store"
            });
          case 1:
            res = _context.v;
            if (res.ok) {
              _context.n = 2;
              break;
            }
            return _context.a(2, null);
          case 2:
            _context.n = 3;
            return res.json();
          case 3:
            return _context.a(2, _context.v);
          case 4:
            _context.p = 4;
            _t = _context.v;
            return _context.a(2, null);
        }
      }, _callee, null, [[0, 4]]);
    }));
    return _fetchCurrentUser.apply(this, arguments);
  }
  function performLogout() {
    return _performLogout.apply(this, arguments);
  }
  function _performLogout() {
    _performLogout = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            _context2.p = 0;
            _context2.n = 1;
            return fetch("".concat(API_BASE, "/cdn-cgi/access/logout"), {
              method: "GET",
              credentials: "include",
              mode: "no-cors"
            });
          case 1:
            _context2.n = 3;
            break;
          case 2:
            _context2.p = 2;
            _t2 = _context2.v;
          case 3:
            window.location.href = "index.html?logout=" + Date.now();
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[0, 2]]);
    }));
    return _performLogout.apply(this, arguments);
  }
  function createStandardUserApi(_x) {
    return _createStandardUserApi.apply(this, arguments);
  }
  function _createStandardUserApi() {
    _createStandardUserApi = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(payload) {
      var res, text, data, message;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            _context3.n = 1;
            return fetch("".concat(API_BASE, "/shopping/users/create-standard"), {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            });
          case 1:
            res = _context3.v;
            _context3.n = 2;
            return res.text();
          case 2:
            text = _context3.v;
            data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (error) {}
            if (res.ok) {
              _context3.n = 3;
              break;
            }
            message = data && (data.error || data.message) || text || "HTTP ".concat(res.status);
            throw new Error(message);
          case 3:
            return _context3.a(2, data || {});
        }
      }, _callee3);
    }));
    return _createStandardUserApi.apply(this, arguments);
  }
  function getActiveStoreChainForTypeOrderLink() {
    var keys = ["shoppingActiveStoreChainV2", "shoppingActiveStoreChainV1"];
    for (var _i = 0, _keys = keys; _i < _keys.length; _i++) {
      var key = _keys[_i];
      try {
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var saved = JSON.parse(raw);
        var chain = String(saved && saved.chain || "").trim();
        var expiresAt = Number(saved && saved.expiresAt || 0);
        var normalized = chain.toLocaleLowerCase("nb-NO").replace(/[^a-z0-9æøå]+/g, "");
        if (chain && expiresAt > Date.now() && normalized !== "standard" && normalized !== "standardrekkefolge") {
          return chain;
        }
      } catch (error) {}
    }
    return "";
  }
  function getTypeOrderSettingsUrl() {
    var chain = getActiveStoreChainForTypeOrderLink();
    return chain ? "handleliste-varetyper.html?chain=".concat(encodeURIComponent(chain)) : "handleliste-varetyper.html";
  }
  function settingsMenuHtml() {
    var typeOrderUrl = getTypeOrderSettingsUrl();
    return "\n          <a href=\"#\" id=\"handlelisteCreateExternalTypeLink\" style=\"display:none;\" onclick=\"return HandlelisteMenu.openItemTypeDialog('external', event)\">Opprette/slette butikk</a>\n          <a href=\"#\" id=\"handlelisteCreateFoodTypeLink\" style=\"display:none;\" onclick=\"return HandlelisteMenu.openItemTypeDialog('food', event)\">Opprette/slette varetyper</a>\n          ".concat(settingsLink(typeOrderUrl, "Plassere varetyper"), "\n          ").concat(settingsLink("handleliste-rediger.html", "Redigere varer"), "\n          ").concat(settingsLink("handleliste-rydde.html", "Slette varer"), "\n          ").concat(settingsLink("handleliste-oppskrifter-rediger.html", "Redigere oppskrifter"), "\n          ").concat(settingsLink("handleliste-varsling.html", "Varsling før handling"), "\n          ").concat(actionLink("sendShoppingListEmail", "Handleliste → E-post"), "\n          ").concat(actionLink("sendShoppingListSms", "Handleliste → SMS"), "\n          ").concat(settingsLink("handleliste-historikk.html", "Handlehistorikk"), "\n        ");
  }
  function renderFloatingControls() {
    if (!shouldRenderOnThisPage()) return;
    var controls = document.getElementById("handlelisteFloatingControls");
    if (!controls) {
      controls = document.createElement("div");
      controls.id = "handlelisteFloatingControls";
      controls.className = "handleliste-floating-controls";
      document.body.appendChild(controls);
    }
    controls.innerHTML = "\n      <span class=\"settings-wrap\" id=\"handlelisteSettingsWrap\">\n        <button type=\"button\" class=\"floating-round-button menu-icon-button\" id=\"handlelisteSettingsToggle\" onclick=\"return HandlelisteMenu.toggleSettings(event)\" title=\"Innstillinger\" aria-label=\"Innstillinger\">".concat(svg("sliders"), "</button>\n        <span class=\"settings-menu\" role=\"menu\" aria-label=\"Innstillinger\">\n          ").concat(settingsMenuHtml(), "\n        </span>\n      </span>\n      <span class=\"login-widget\" id=\"handlelisteLoginWidget\">\n        <a id=\"handlelisteLoginStatus\" class=\"login-status is-signin\" href=\"#\" title=\"Logg inn\">\u2197</a>\n        <span id=\"handlelisteLoginMenu\" class=\"login-menu\">\n          <span id=\"handlelisteLoginMenuName\" class=\"login-menu-name\"></span>\n          <a id=\"handlelisteLogoutLink\" class=\"login-menu-link\" href=\"#\">Logge av</a>\n          <a id=\"handlelisteCreateUserLink\" class=\"login-menu-link\" href=\"#\" style=\"display:none;\">Opprett bruker</a>\n        </span>\n      </span>\n    ");
    renderCreateUserDialog();
    renderItemTypeDialog();
    setupLoginWidget();
  }
  function renderCreateUserDialog() {
    if (document.getElementById("handlelisteCreateUserModal")) {
      return;
    }
    var modal = document.createElement("div");
    modal.id = "handlelisteCreateUserModal";
    modal.className = "handleliste-create-user-modal";
    modal.innerHTML = "\n      <div class=\"handleliste-create-user-modal-content\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"handlelisteCreateUserTitle\">\n        <div class=\"handleliste-create-user-modal-header\">\n          <div class=\"handleliste-create-user-modal-title\" id=\"handlelisteCreateUserTitle\">Opprett bruker</div>\n          <button type=\"button\" class=\"handleliste-create-user-modal-close\" onclick=\"HandlelisteMenu.closeCreateUserDialog()\" aria-label=\"Lukk\">\xD7</button>\n        </div>\n        <p class=\"handleliste-create-user-help\">Oppretter en ny standard bruker i Handleliste. Brukeren f\xE5r ikke administratorrolle.</p>\n        <form id=\"handlelisteCreateUserForm\" onsubmit=\"return HandlelisteMenu.submitCreateUserDialog(event)\">\n          <div class=\"handleliste-create-user-field\">\n            <label for=\"handlelisteCreateUserName\">Fullt navn</label>\n            <input id=\"handlelisteCreateUserName\" name=\"name\" type=\"text\" autocomplete=\"name\" required>\n          </div>\n          <div class=\"handleliste-create-user-field\">\n            <label for=\"handlelisteCreateUserEmail\">E-post</label>\n            <input id=\"handlelisteCreateUserEmail\" name=\"email\" type=\"email\" autocomplete=\"email\" required>\n          </div>\n          <div class=\"handleliste-create-user-field\">\n            <label for=\"handlelisteCreateUserPhone\">Mobilnummer</label>\n            <input id=\"handlelisteCreateUserPhone\" name=\"phone\" type=\"tel\" autocomplete=\"tel\" placeholder=\"Valgfritt\">\n          </div>\n          <div class=\"handleliste-create-user-help\"><strong>Rolle:</strong> Standard bruker</div>\n          <div id=\"handlelisteCreateUserStatus\" class=\"handleliste-create-user-status\"></div>\n          <div class=\"handleliste-create-user-actions\">\n            <button type=\"button\" class=\"handleliste-create-user-button\" onclick=\"HandlelisteMenu.closeCreateUserDialog()\">Avbryt</button>\n            <button type=\"submit\" class=\"handleliste-create-user-button primary\">Opprett bruker</button>\n          </div>\n        </form>\n      </div>\n    ";
    document.body.appendChild(modal);
  }
  function setCreateUserStatus(message, type) {
    var status = document.getElementById("handlelisteCreateUserStatus");
    if (!status) return;
    status.className = "handleliste-create-user-status" + (type ? " ".concat(type) : "");
    status.textContent = message || "";
  }
  function openCreateUserDialog(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    renderCreateUserDialog();
    var modal = document.getElementById("handlelisteCreateUserModal");
    var form = document.getElementById("handlelisteCreateUserForm");
    if (form) form.reset();
    setCreateUserStatus("", "");
    if (modal) modal.classList.add("open");
    setTimeout(function () {
      var nameInput = document.getElementById("handlelisteCreateUserName");
      if (nameInput) nameInput.focus();
    }, 0);
    closeSettings();
    return false;
  }
  function closeCreateUserDialog() {
    var modal = document.getElementById("handlelisteCreateUserModal");
    if (modal) modal.classList.remove("open");
    return false;
  }
  function submitCreateUserDialog(_x2) {
    return _submitCreateUserDialog.apply(this, arguments);
  }
  function _submitCreateUserDialog() {
    _submitCreateUserDialog = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(event) {
      var nameInput, emailInput, phoneInput, submitButton, payload, _t3;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            nameInput = document.getElementById("handlelisteCreateUserName");
            emailInput = document.getElementById("handlelisteCreateUserEmail");
            phoneInput = document.getElementById("handlelisteCreateUserPhone");
            submitButton = document.querySelector("#handlelisteCreateUserForm button[type='submit']");
            payload = {
              name: String(nameInput && nameInput.value || "").trim(),
              email: String(emailInput && emailInput.value || "").trim(),
              phone: String(phoneInput && phoneInput.value || "").trim(),
              role: "User",
              userType: "standard"
            };
            if (!(!payload.name || !payload.email)) {
              _context4.n = 1;
              break;
            }
            setCreateUserStatus("Navn og e-post må fylles ut.", "error");
            return _context4.a(2, false);
          case 1:
            _context4.p = 1;
            if (submitButton) submitButton.disabled = true;
            setCreateUserStatus("Oppretter bruker ...", "");
            _context4.n = 2;
            return createStandardUserApi(payload);
          case 2:
            setCreateUserStatus("Brukeren er opprettet.", "success");
            setTimeout(closeCreateUserDialog, 900);
            _context4.n = 4;
            break;
          case 3:
            _context4.p = 3;
            _t3 = _context4.v;
            setCreateUserStatus("Kunne ikke opprette bruker. ".concat(_t3 && _t3.message ? _t3.message : "").trim(), "error");
          case 4:
            _context4.p = 4;
            if (submitButton) submitButton.disabled = false;
            return _context4.f(4);
          case 5:
            return _context4.a(2, false);
        }
      }, _callee4, null, [[1, 3, 4, 5]]);
    }));
    return _submitCreateUserDialog.apply(this, arguments);
  }
  function renderItemTypeDialog() {
    if (document.getElementById("handlelisteItemTypeModal")) return;
    var modal = document.createElement("div");
    modal.id = "handlelisteItemTypeModal";
    modal.className = "handleliste-create-user-modal";
    modal.innerHTML = "\n      <div class=\"handleliste-create-user-modal-content\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"handlelisteItemTypeTitle\">\n        <div class=\"handleliste-create-user-modal-header\">\n          <div class=\"handleliste-create-user-modal-title\" id=\"handlelisteItemTypeTitle\">Opprette/slette</div>\n          <button type=\"button\" class=\"handleliste-create-user-modal-close\" onclick=\"HandlelisteMenu.closeItemTypeDialog()\" aria-label=\"Lukk\">\xD7</button>\n        </div>\n        <p class=\"handleliste-create-user-help\" id=\"handlelisteItemTypeHelp\"></p>\n        <input type=\"hidden\" id=\"handlelisteItemTypeKind\">\n        <form id=\"handlelisteItemTypeForm\" onsubmit=\"return HandlelisteMenu.submitItemTypeDialog(event)\">\n          <div class=\"handleliste-create-user-field\">\n            <label for=\"handlelisteItemTypeName\" id=\"handlelisteItemTypeNameLabel\">Nytt navn</label>\n            <input id=\"handlelisteItemTypeName\" type=\"text\" maxlength=\"80\" required autocomplete=\"off\">\n          </div>\n          <div class=\"handleliste-create-user-actions\">\n            <button type=\"submit\" class=\"handleliste-create-user-button primary\">Opprett</button>\n          </div>\n        </form>\n        <hr style=\"border:0;border-top:1px solid rgba(255,255,255,.14);margin:18px 0;\">\n        <form id=\"handlelisteDeleteItemTypeForm\" onsubmit=\"return HandlelisteMenu.submitDeleteItemTypeDialog(event)\">\n          <div class=\"handleliste-create-user-field\">\n            <label for=\"handlelisteDeleteItemTypeSelect\" id=\"handlelisteDeleteItemTypeLabel\">Velg for sletting</label>\n            <select id=\"handlelisteDeleteItemTypeSelect\" required><option value=\"\">Laster ...</option></select>\n          </div>\n          <div class=\"handleliste-create-user-actions\">\n            <button type=\"submit\" class=\"handleliste-create-user-button\" style=\"background:#5a3030;\">Slett valgt</button>\n          </div>\n        </form>\n        <div id=\"handlelisteItemTypeStatus\" class=\"handleliste-create-user-status\"></div>\n        <div class=\"handleliste-create-user-actions\">\n          <button type=\"button\" class=\"handleliste-create-user-button\" onclick=\"HandlelisteMenu.closeItemTypeDialog()\">Lukk</button>\n        </div>\n      </div>";
    document.body.appendChild(modal);
  }
  function setItemTypeStatus(message, type) {
    var el = document.getElementById("handlelisteItemTypeStatus");
    if (!el) return;
    el.className = "handleliste-create-user-status" + (type ? " ".concat(type) : "");
    el.textContent = message || "";
  }
  function loadItemTypeManagementOptions(_x3) {
    return _loadItemTypeManagementOptions.apply(this, arguments);
  }
  function _loadItemTypeManagementOptions() {
    _loadItemTypeManagementOptions = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(kind) {
      var select, res, text, data, list;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            select = document.getElementById("handlelisteDeleteItemTypeSelect");
            if (select) select.innerHTML = '<option value="">Laster ...</option>';
            _context5.n = 1;
            return fetch("".concat(API_BASE, "/shopping/item-types-manage"), {
              method: "GET",
              credentials: "include",
              cache: "no-store"
            });
          case 1:
            res = _context5.v;
            _context5.n = 2;
            return res.text();
          case 2:
            text = _context5.v;
            data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (error) {}
            if (!(!res.ok || !data || data.error)) {
              _context5.n = 3;
              break;
            }
            throw new Error(data && (data.detail || data.error) || text || "HTTP ".concat(res.status));
          case 3:
            list = kind === "food" ? data.food || [] : data.external || [];
            if (select) {
              select.innerHTML = '<option value="">Velg ...</option>' + list.filter(function (item) {
                var key = String(item.name || "").trim().toLowerCase();
                return !(kind === "food" && key === "annet") && !(kind === "external" && key === "netthandel");
              }).map(function (item) {
                return "<option value=\"".concat(String(item.id), "\">").concat(String(item.name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "</option>");
              }).join("");
            }
            return _context5.a(2, data);
        }
      }, _callee5);
    }));
    return _loadItemTypeManagementOptions.apply(this, arguments);
  }
  function openItemTypeDialog(_x4, _x5) {
    return _openItemTypeDialog.apply(this, arguments);
  }
  function _openItemTypeDialog() {
    _openItemTypeDialog = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(kind, event) {
      var isFood, form, _t4;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            renderItemTypeDialog();
            isFood = kind === "food";
            document.getElementById("handlelisteItemTypeKind").value = isFood ? "food" : "external";
            document.getElementById("handlelisteItemTypeTitle").textContent = isFood ? "Opprette/slette varetyper" : "Opprette/slette butikk";
            document.getElementById("handlelisteItemTypeHelp").textContent = isFood ? "Opprett eller slett matvaregrupper. Annet er en fast gruppe og kan ikke slettes." : "Opprett eller slett eksterne butikker/handelstyper. Dette gjelder ikke fysiske butikkfilialer med adresse og GPS-posisjon.";
            document.getElementById("handlelisteItemTypeNameLabel").textContent = isFood ? "Ny varetype" : "Ny butikk/handelstype";
            document.getElementById("handlelisteDeleteItemTypeLabel").textContent = isFood ? "Varetype som skal slettes" : "Butikk/handelstype som skal slettes";
            form = document.getElementById("handlelisteItemTypeForm");
            if (form) form.reset();
            setItemTypeStatus("", "");
            document.getElementById("handlelisteItemTypeModal").classList.add("open");
            closeSettings();
            _context6.p = 1;
            _context6.n = 2;
            return loadItemTypeManagementOptions(isFood ? "food" : "external");
          case 2:
            _context6.n = 4;
            break;
          case 3:
            _context6.p = 3;
            _t4 = _context6.v;
            setItemTypeStatus("Kunne ikke laste eksisterende valg. ".concat(_t4 && _t4.message ? _t4.message : "").trim(), "error");
          case 4:
            setTimeout(function () {
              var element = document.getElementById("handlelisteItemTypeName");
              if (element) {
                element.focus();
              }
            }, 0);
            return _context6.a(2, false);
        }
      }, _callee6, null, [[1, 3]]);
    }));
    return _openItemTypeDialog.apply(this, arguments);
  }
  function closeItemTypeDialog() {
    var modal = document.getElementById("handlelisteItemTypeModal");
    if (modal) {
      modal.classList.remove("open");
    }
    return false;
  }
  function submitItemTypeDialog(_x6) {
    return _submitItemTypeDialog.apply(this, arguments);
  }
  function _submitItemTypeDialog() {
    _submitItemTypeDialog = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(event) {
      var kindElement, kind, nameElement, name, button, res, text, data, _t5;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            kindElement = document.getElementById("handlelisteItemTypeKind");
            kind = String(kindElement && kindElement.value || "");
            nameElement = document.getElementById("handlelisteItemTypeName");
            name = String(nameElement && nameElement.value || "").trim();
            button = document.querySelector("#handlelisteItemTypeForm button[type='submit']");
            if (name) {
              _context7.n = 1;
              break;
            }
            setItemTypeStatus("Navn må fylles ut.", "error");
            return _context7.a(2, false);
          case 1:
            _context7.p = 1;
            if (button) button.disabled = true;
            setItemTypeStatus("Oppretter ...", "");
            _context7.n = 2;
            return fetch("".concat(API_BASE, "/shopping/item-type-create"), {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "text/plain;charset=UTF-8"
              },
              body: JSON.stringify({
                kind: kind,
                name: name,
                device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobil" : "PC",
                browser: navigator.userAgent || "",
                operatingSystem: navigator.platform || ""
              })
            });
          case 2:
            res = _context7.v;
            _context7.n = 3;
            return res.text();
          case 3:
            text = _context7.v;
            data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (error) {}
            if (!(!res.ok || data && data.error)) {
              _context7.n = 4;
              break;
            }
            throw new Error(data && (data.detail || data.error || data.message) || text || "HTTP ".concat(res.status));
          case 4:
            document.getElementById("handlelisteItemTypeName").value = "";
            _context7.n = 5;
            return loadItemTypeManagementOptions(kind);
          case 5:
            setItemTypeStatus(data && data.message || "".concat(name, " er opprettet."), "success");
            if (location.pathname.endsWith("handleliste-varetyper.html")) setTimeout(function () {
              return location.reload();
            }, 700);
            _context7.n = 7;
            break;
          case 6:
            _context7.p = 6;
            _t5 = _context7.v;
            setItemTypeStatus("Kunne ikke opprette. ".concat(_t5 && _t5.message ? _t5.message : "").trim(), "error");
          case 7:
            _context7.p = 7;
            if (button) button.disabled = false;
            return _context7.f(7);
          case 8:
            return _context7.a(2, false);
        }
      }, _callee7, null, [[1, 6, 7, 8]]);
    }));
    return _submitItemTypeDialog.apply(this, arguments);
  }
  function submitDeleteItemTypeDialog(_x7) {
    return _submitDeleteItemTypeDialog.apply(this, arguments);
  }
  function _submitDeleteItemTypeDialog() {
    _submitDeleteItemTypeDialog = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(event) {
      var kindElement, kind, select, id, selectedOption, name, button, res, text, data, _t6;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.p = _context8.n) {
          case 0:
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            kindElement = document.getElementById("handlelisteItemTypeKind");
            kind = String(kindElement && kindElement.value || "");
            select = document.getElementById("handlelisteDeleteItemTypeSelect");
            id = Number(select && select.value || 0);
            selectedOption = select && select.selectedOptions && select.selectedOptions.length ? select.selectedOptions[0] : null;
            name = String(selectedOption && selectedOption.textContent || "").trim();
            button = document.querySelector("#handlelisteDeleteItemTypeForm button[type='submit']");
            if (id) {
              _context8.n = 1;
              break;
            }
            setItemTypeStatus("Velg hva som skal slettes.", "error");
            return _context8.a(2, false);
          case 1:
            if (window.confirm("Slette ".concat(name, "?"))) {
              _context8.n = 2;
              break;
            }
            return _context8.a(2, false);
          case 2:
            _context8.p = 2;
            if (button) button.disabled = true;
            setItemTypeStatus("Sletter ...", "");
            _context8.n = 3;
            return fetch("".concat(API_BASE, "/shopping/item-type-delete"), {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "text/plain;charset=UTF-8"
              },
              body: JSON.stringify({
                kind: kind,
                id: id
              })
            });
          case 3:
            res = _context8.v;
            _context8.n = 4;
            return res.text();
          case 4:
            text = _context8.v;
            data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (error) {}
            if (!(!res.ok || data && data.error)) {
              _context8.n = 5;
              break;
            }
            throw new Error(data && (data.detail || data.error || data.message) || text || "HTTP ".concat(res.status));
          case 5:
            _context8.n = 6;
            return loadItemTypeManagementOptions(kind);
          case 6:
            setItemTypeStatus(data && data.message || "".concat(name, " er slettet."), "success");
            if (location.pathname.endsWith("handleliste-varetyper.html")) setTimeout(function () {
              return location.reload();
            }, 700);
            _context8.n = 8;
            break;
          case 7:
            _context8.p = 7;
            _t6 = _context8.v;
            setItemTypeStatus("Kunne ikke slette. ".concat(_t6 && _t6.message ? _t6.message : "").trim(), "error");
          case 8:
            _context8.p = 8;
            if (button) button.disabled = false;
            return _context8.f(8);
          case 9:
            return _context8.a(2, false);
        }
      }, _callee8, null, [[2, 7, 8, 9]]);
    }));
    return _submitDeleteItemTypeDialog.apply(this, arguments);
  }
  function setupLoginWidget() {
    return _setupLoginWidget.apply(this, arguments);
  }
  function _setupLoginWidget() {
    _setupLoginWidget = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9() {
      var loginStatus, loginMenu, loginMenuName, logoutLink, createUserLink, createFoodTypeLink, createExternalTypeLink, currentUser, displayName, canManageTypes, returnUrl;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.n) {
          case 0:
            loginStatus = document.getElementById("handlelisteLoginStatus");
            loginMenu = document.getElementById("handlelisteLoginMenu");
            loginMenuName = document.getElementById("handlelisteLoginMenuName");
            logoutLink = document.getElementById("handlelisteLogoutLink");
            createUserLink = document.getElementById("handlelisteCreateUserLink");
            createFoodTypeLink = document.getElementById("handlelisteCreateFoodTypeLink");
            createExternalTypeLink = document.getElementById("handlelisteCreateExternalTypeLink");
            if (!(!loginStatus || !loginMenu || !loginMenuName || !logoutLink)) {
              _context9.n = 1;
              break;
            }
            return _context9.a(2);
          case 1:
            _context9.n = 2;
            return fetchCurrentUser();
          case 2:
            currentUser = _context9.v;
            if (currentUser) {
              displayName = currentUser.name || currentUser.email || "Innlogget";
              loginStatus.textContent = getInitials(displayName) || "✓";
              loginStatus.href = "#";
              loginStatus.classList.remove("is-signin");
              loginStatus.classList.add("signed-in");
              loginStatus.title = displayName;
              loginMenuName.textContent = displayName;
              logoutLink.textContent = "Logge av";
              canManageTypes = isAdminUser(currentUser);
              if (createFoodTypeLink) createFoodTypeLink.style.display = canManageTypes ? "block" : "none";
              if (createExternalTypeLink) createExternalTypeLink.style.display = canManageTypes ? "block" : "none";
              if (createUserLink) {
                if (canManageTypes) {
                  createUserLink.style.display = "block";
                  createUserLink.onclick = openCreateUserDialog;
                } else {
                  createUserLink.style.display = "none";
                  createUserLink.onclick = null;
                }
              }
              loginStatus.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                loginMenu.style.display = loginMenu.style.display === "block" ? "none" : "block";
                closeSettings();
                return false;
              };
              logoutLink.onclick = function (event) {
                event.preventDefault();
                performLogout();
                return false;
              };
            } else {
              returnUrl = window.location.href;
              loginStatus.textContent = "↗";
              loginStatus.href = "".concat(API_BASE, "/login?returnUrl=").concat(encodeURIComponent(returnUrl));
              loginStatus.classList.add("is-signin");
              loginStatus.classList.remove("signed-in");
              loginStatus.title = "Logg inn";
              loginStatus.onclick = null;
              loginMenu.style.display = "none";
              if (createUserLink) {
                createUserLink.style.display = "none";
                createUserLink.onclick = null;
              }
              if (createFoodTypeLink) createFoodTypeLink.style.display = "none";
              if (createExternalTypeLink) createExternalTypeLink.style.display = "none";
            }
          case 3:
            return _context9.a(2);
        }
      }, _callee9);
    }));
    return _setupLoginWidget.apply(this, arguments);
  }
  function toggleSettings(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    var wrap = document.getElementById("handlelisteSettingsWrap");
    if (wrap) wrap.classList.toggle("open");
    return false;
  }
  function closeSettings(event) {
    var wrap = document.getElementById("handlelisteSettingsWrap");
    var loginWidget = document.getElementById("handlelisteLoginWidget");
    var loginMenu = document.getElementById("handlelisteLoginMenu");
    if (wrap && wrap.classList.contains("open")) {
      if (!event || !wrap.contains(event.target)) {
        wrap.classList.remove("open");
      }
    }
    if (loginMenu && loginMenu.style.display === "block") {
      if (!event || !loginWidget || !loginWidget.contains(event.target)) {
        loginMenu.style.display = "none";
      }
    }
  }
  function settingsLink(url, label) {
    var current = isCurrentTarget(url);
    var cls = current ? ' class="current-page" aria-current="page"' : "";
    return "<a".concat(cls, " href=\"").concat(current ? "#" : url, "\" onclick=\"return HandlelisteMenu.pushAndGo('").concat(url, "', event)\">").concat(label, "</a>");
  }
  function actionLink(functionName, label) {
    // Menyen bygges i <head> før sideskriptet har definert handlingene.
    // Vis derfor valget alltid; funksjonen finnes når brukeren klikker.
    return "<a href=\"#\" onclick=\"return HandlelisteMenu.runPageAction('".concat(functionName, "', event)\">").concat(label, "</a>");
  }
  function runPageAction(functionName, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    closeSettings();
    if (typeof window[functionName] === "function") {
      window[functionName]();
    }
    return false;
  }
  function iconForPage() {
    var page = currentBasePage();
    if (page === "handleliste-bestille.html") return "clipboard";
    if (page === "handleliste-handle.html") return "cart";
    if (page === "handleliste-varsling.html") return "bell";
    if (page === "handleliste-historikk.html") return "history";
    if (page === "handleliste-oppskrifter.html") return "book";
    if (page === "help.html") return "help";
    return "pencil";
  }
  function renderCornerIcon() {
    if (!shouldRenderOnThisPage()) return;
    document.querySelectorAll(".page-icon-panel,.handleliste-page-corner-icon").forEach(function (node) {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    var iconName = iconForPage();
    var corner = document.createElement("div");
    corner.id = "handlelistePageCornerIcon";
    corner.className = "handleliste-page-corner-icon";
    corner.setAttribute("aria-hidden", "true");
    corner.innerHTML = svg(iconName);
    document.body.appendChild(corner);
  }
  function pageHasViewToggle() {
    var page = currentBasePage();
    return page === "handleliste-bestille.html" || page === "handleliste-handle.html";
  }
  function getPageViewMode() {
    try {
      if (typeof window.handlelisteGetViewMode === "function") {
        return window.handlelisteGetViewMode() === "thumb" ? "thumb" : "list";
      }
      if (currentBasePage() === "handleliste-bestille.html" && typeof window.getOrderViewMode === "function") {
        return window.getOrderViewMode() === "thumb" ? "thumb" : "list";
      }
      if (currentBasePage() === "handleliste-handle.html" && typeof window.getHandleViewMode === "function") {
        return window.getHandleViewMode() === "thumb" ? "thumb" : "list";
      }
    } catch (error) {}
    return "list";
  }
  function updateViewToggleButton() {
    var btn = document.getElementById("handlelisteViewModeToggle");
    if (!btn) return;
    var thumb = getPageViewMode() === "thumb";
    btn.textContent = thumb ? "☰" : "▦";
    btn.classList.remove("active");
    btn.title = thumb ? "Vis som liste" : "Vis som bilder";
    btn.setAttribute("aria-label", btn.title);
  }
  function toggleViewMode(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      if (typeof window.handlelisteToggleViewMode === "function") {
        window.handlelisteToggleViewMode();
      } else if (currentBasePage() === "handleliste-bestille.html" && typeof window.toggleOrderViewMode === "function") {
        window.toggleOrderViewMode();
      } else if (currentBasePage() === "handleliste-handle.html" && typeof window.toggleHandleViewMode === "function") {
        window.toggleHandleViewMode();
      }
    } catch (error) {}
    updateViewToggleButton();
    return false;
  }
  function viewToggleButtonHtml() {
    if (!pageHasViewToggle()) {
      return "";
    }
    return "<button type=\"button\" class=\"top-button menu-view-toggle-button\" id=\"handlelisteViewModeToggle\" onclick=\"return HandlelisteMenu.toggleViewMode(event)\" title=\"Vis som bilder\" aria-label=\"Vis som bilder\">\u25A6</button>";
  }
  function render() {
    if (!shouldRenderOnThisPage()) return;
    addCss();
    var host = document.getElementById("handlelisteTopMenu") || document.querySelector(".header .top-buttons");
    if (!host) return;
    host.className = "top-buttons handleliste-shared-top-menu";
    host.innerHTML = "\n      <a class=\"top-button\" href=\"index.html?restoreMenu=1\" title=\"Tilbake\" onclick=\"return HandlelisteMenu.goBack(event)\">\u2190</a>\n      <a class=\"top-button menu-icon-button bestille-top-button\" href=\"handleliste-bestille.html\" title=\"Bestille\" onclick=\"return HandlelisteMenu.pushAndGo('handleliste-bestille.html', event)\">".concat(svg("clipboard"), "</a>\n      <a class=\"top-button menu-icon-button handle-top-button\" href=\"handleliste-handle.html\" title=\"Handle\" onclick=\"return HandlelisteMenu.pushAndGo('handleliste-handle.html', event)\">").concat(svg("cart"), "</a>\n      <a class=\"top-button menu-icon-button\" href=\"index.html\" title=\"Hovedside\">").concat(svg("home"), "</a>\n      <a class=\"top-button\" href=\"help.html?case=Handleliste\" title=\"Hjelp\">?</a>\n      <button type=\"button\" class=\"top-button\" id=\"handlelisteSizeToggle\" onclick=\"HandlelisteMenu.toggleSize()\" title=\"Endre tekstst\xF8rrelse\" aria-label=\"Endre tekstst\xF8rrelse\">A</button>\n      <button type=\"button\" class=\"top-button\" id=\"handlelisteThemeToggle\" onclick=\"HandlelisteMenu.toggleTheme()\" title=\"Bytt lys/m\xF8rk modus\" aria-label=\"Bytt lys/m\xF8rk modus\"><span class=\"theme-text-symbol\">\u2731</span></button>\n      ").concat(viewToggleButtonHtml(), "\n    ");
    renderCornerIcon();
    renderFloatingControls();
    applySizeState();
    updateThemeButton();
  }
  window.HandlelisteMenu = {
    version: MENU_VERSION,
    render: render,
    goBack: goBack,
    pushAndGo: pushAndGo,
    toggleTheme: toggleTheme,
    toggleDesign: toggleDesign,
    toggleSize: toggleSize,
    toggleSettings: toggleSettings,
    toggleViewMode: toggleViewMode,
    updateViewToggleButton: updateViewToggleButton,
    runPageAction: runPageAction,
    renderFloatingControls: renderFloatingControls,
    openCreateUserDialog: openCreateUserDialog,
    closeCreateUserDialog: closeCreateUserDialog,
    submitCreateUserDialog: submitCreateUserDialog,
    openItemTypeDialog: openItemTypeDialog,
    closeItemTypeDialog: closeItemTypeDialog,
    submitItemTypeDialog: submitItemTypeDialog,
    submitDeleteItemTypeDialog: submitDeleteItemTypeDialog
  };
  document.addEventListener("click", closeSettings);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      render();
      applyThemeState();
      applySizeState();
      setTimeout(updateThemeButton, 0);
      setTimeout(updateThemeButton, 100);
    });
  } else {
    render();
    applyThemeState();
    applySizeState();
    setTimeout(updateThemeButton, 0);
    setTimeout(updateThemeButton, 100);
  }
})();
