/* Kvimarka 92 felles versjonslinje v2 - passiv
   Produksjonsnavn: shared/kvimarka-version-footer.js
   Viktig: Denne filen gjør ingen fetch/API-kall. Den skal ikke kunne hindre sidelasting. */
(function(){
  "use strict";

  var FOOTER_VERSION = "kvimarka-version-footer-v2-passive-2026-07-08";
  var FOOTER_ID = "kvimarkaVersionFooter";
  var STYLE_ID = "kvimarkaVersionFooterStyle";
  var state = {
    user: null,
    visibleByUser: false,
    workerVersion: "",
    extra: ""
  };

  function safeText(value){
    return String(value == null ? "" : value);
  }

  function normalizeRole(value){
    return safeText(value).trim().toLowerCase();
  }

  function isAdminUser(user){
    if(!user) return false;
    if(user.isAdmin === true || user.admin === true || user.isAdministrator === true) return true;

    var role = normalizeRole(user.role || user.userRole || user.type);
    var memberRole = normalizeRole(user.family && user.family.memberRole);
    var accessRole = normalizeRole(user.accessRole);
    var allowed = {
      "administrator": true,
      "admin": true,
      "supervisor": true,
      "family admin": true,
      "familieadministrator": true
    };

    return !!(allowed[role] || allowed[memberRole] || allowed[accessRole]);
  }

  function pageFileName(){
    try{
      var page = (location.pathname.split("/").pop() || "index.html").trim();
      return page || "index.html";
    }catch(error){
      return "ukjent side";
    }
  }

  function metaContent(name){
    try{
      var el = document.querySelector('meta[name="' + name + '"]');
      return el ? safeText(el.getAttribute("content")).trim() : "";
    }catch(error){
      return "";
    }
  }

  function readPageVersion(){
    return metaContent("kvimarka-page-version") || metaContent("app-version") || "ukjent";
  }

  function readPageArea(){
    return metaContent("kvimarka-area") || "Kvimarka 92";
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + FOOTER_ID + "{display:none;margin:42px auto 0;padding:10px 12px;max-width:1100px;box-sizing:border-box;font:12px/1.35 Arial,sans-serif;color:rgba(120,120,120,.95);text-align:center;border-top:1px solid rgba(127,127,127,.28);}",
      "body.dark-mode #" + FOOTER_ID + "{color:rgba(210,210,210,.72);border-top-color:rgba(255,255,255,.16);}",
      "#" + FOOTER_ID + ".visible{display:block;}",
      "#" + FOOTER_ID + " strong{font-weight:700;}",
      "#adminVersionInfo{display:none!important;}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function ensureFooter(){
    if(!document.body) return null;

    var footer = document.getElementById(FOOTER_ID);
    if(footer) return footer;

    footer = document.createElement("div");
    footer.id = FOOTER_ID;
    footer.setAttribute("aria-live", "polite");
    footer.setAttribute("data-footer-version", FOOTER_VERSION);
    document.body.appendChild(footer);
    return footer;
  }

  function displayNameFromUser(user){
    return safeText((user && (user.name || user.displayName || user.email || user.username)) || "").trim();
  }

  function shouldShow(){
    try{
      if(localStorage.getItem("kvimarka.versionFooter.visible") === "true") return true;
    }catch(error){}

    return !!state.visibleByUser;
  }

  function render(){
    ensureStyle();
    var footer = ensureFooter();
    if(!footer) return;

    if(!shouldShow()){
      footer.classList.remove("visible");
      footer.textContent = "";
      return;
    }

    var userName = displayNameFromUser(state.user) || "Administrator";
    var worker = safeText(state.workerVersion || (state.user && state.user.workerVersion) || "-").trim() || "-";
    var extra = state.extra ? " | " + state.extra : "";

    footer.textContent =
      readPageArea() +
      " | " + pageFileName() +
      " | HTML: " + readPageVersion() +
      " | Worker: " + worker +
      " | Innlogget: " + userName +
      " | Footer: " + FOOTER_VERSION +
      extra;

    footer.classList.add("visible");
  }

  function setUser(user, options){
    state.user = user || null;
    state.visibleByUser = isAdminUser(user);

    if(options && options.workerVersion !== undefined){
      state.workerVersion = safeText(options.workerVersion).trim();
    }
    if(options && options.extra !== undefined){
      state.extra = safeText(options.extra).trim();
    }

    render();
    return state.visibleByUser;
  }

  function setVisible(value, options){
    state.visibleByUser = !!value;
    if(options && options.user) state.user = options.user;
    if(options && options.workerVersion !== undefined) state.workerVersion = safeText(options.workerVersion).trim();
    if(options && options.extra !== undefined) state.extra = safeText(options.extra).trim();
    render();
  }

  function detectAdminFromExistingMenu(){
    try{
      var createUserLink = document.getElementById("handlelisteCreateUserLink");
      var loginMenuName = document.getElementById("handlelisteLoginMenuName");
      if(!createUserLink) return false;

      var style = window.getComputedStyle ? window.getComputedStyle(createUserLink) : null;
      var isVisible = style ? style.display !== "none" && style.visibility !== "hidden" : createUserLink.style.display !== "none";

      if(isVisible){
        setVisible(true, {
          user: {name: loginMenuName ? loginMenuName.textContent : "Administrator", role: "administrator"},
          extra: "admin fra meny"
        });
        return true;
      }
    }catch(error){}

    return false;
  }

  function refresh(){
    if(detectAdminFromExistingMenu()) return;
    render();
  }

  function init(){
    ensureStyle();
    render();

    /* Kun DOM-observasjon. Ingen API-kall. Brukes fordi fellesmenyen ofte laster brukerstatus etter siden. */
    try{
      var observer = new MutationObserver(function(){
        refresh();
      });
      observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["style","class"]});
      setTimeout(function(){ try{ observer.disconnect(); }catch(error){} }, 15000);
    }catch(error){}

    setTimeout(refresh, 0);
    setTimeout(refresh, 500);
    setTimeout(refresh, 1500);
  }

  window.KvimarkaVersionFooter = {
    version: FOOTER_VERSION,
    refresh: refresh,
    render: render,
    setUser: setUser,
    setVisible: setVisible,
    isAdminUser: isAdminUser
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();
