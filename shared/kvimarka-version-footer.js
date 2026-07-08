/* Kvimarka 92 felles versjonslinje v1
   Vises bare nederst på siden for administrator/supervisor.
   Produksjonsnavn: shared/kvimarka-version-footer.js */
(function(){
  "use strict";

  var FOOTER_VERSION = "kvimarka-version-footer-v1-2026-07-08";
  var API_BASE = "https://api-kvimarka92.carstereogarage.com";
  var FOOTER_ID = "kvimarkaVersionFooter";

  function safeText(value){
    return String(value == null ? "" : value);
  }

  function normalizeRole(value){
    return safeText(value).trim().toLowerCase();
  }

  function isAdminUser(user){
    if(!user) return false;
    if(user.isAdmin === true) return true;

    var role = normalizeRole(user.role);
    var memberRole = normalizeRole(user.family && user.family.memberRole);
    var allowed = {
      "administrator": true,
      "admin": true,
      "supervisor": true,
      "family admin": true,
      "familieadministrator": true
    };

    return !!(allowed[role] || allowed[memberRole]);
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
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? safeText(el.getAttribute("content")).trim() : "";
  }

  function readPageVersion(){
    return metaContent("kvimarka-page-version") || metaContent("app-version") || "ukjent";
  }

  function readPageArea(){
    return metaContent("kvimarka-area") || "Kvimarka 92";
  }

  function ensureStyle(){
    if(document.getElementById("kvimarkaVersionFooterStyle")) return;
    var style = document.createElement("style");
    style.id = "kvimarkaVersionFooterStyle";
    style.textContent = [
      "#" + FOOTER_ID + "{display:none;margin:28px auto 0;padding:8px 10px;max-width:980px;box-sizing:border-box;font:12px/1.35 Arial,sans-serif;color:rgba(120,120,120,.95);text-align:center;border-top:1px solid rgba(127,127,127,.25);}",
      "body.dark-mode #" + FOOTER_ID + "{color:rgba(210,210,210,.72);border-top-color:rgba(255,255,255,.16);}",
      "#" + FOOTER_ID + ".visible{display:block;}",
      "#" + FOOTER_ID + " strong{font-weight:700;}",
      "#adminVersionInfo{display:none!important;}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function ensureFooter(){
    var footer = document.getElementById(FOOTER_ID);
    if(footer) return footer;
    footer = document.createElement("div");
    footer.id = FOOTER_ID;
    footer.setAttribute("aria-live", "polite");
    footer.setAttribute("data-footer-version", FOOTER_VERSION);
    document.body.appendChild(footer);
    return footer;
  }

  function setVisibleFooter(user, workerVersion){
    ensureStyle();
    var footer = ensureFooter();
    var userName = safeText((user && (user.name || user.email)) || "Administrator").trim() || "Administrator";
    var worker = safeText(workerVersion || (user && user.workerVersion) || "-").trim() || "-";
    var page = pageFileName();
    var version = readPageVersion();
    var area = readPageArea();

    footer.textContent = area + " | " + page + " | HTML: " + version + " | Worker: " + worker + " | Innlogget: " + userName + " | Footer: " + FOOTER_VERSION;
    footer.classList.add("visible");
  }

  function hideFooter(){
    var footer = document.getElementById(FOOTER_ID);
    if(footer){
      footer.classList.remove("visible");
      footer.textContent = "";
    }
  }

  async function fetchJson(url){
    var res = await fetch(url, {credentials:"include", cache:"no-store"});
    if(!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  async function fetchCurrentUser(){
    return await fetchJson(API_BASE + "/whoami?ts=" + Date.now());
  }

  async function fetchWorkerVersion(){
    try{
      var data = await fetchJson(API_BASE + "/shopping/version?ts=" + Date.now());
      return safeText(data && (data.workerVersion || data.version || data.name)).trim();
    }catch(error){
      return "-";
    }
  }

  async function initVersionFooter(){
    try{
      ensureStyle();
      hideFooter();
      var user = await fetchCurrentUser();
      if(!isAdminUser(user)){
        hideFooter();
        return;
      }
      var workerVersion = (user && user.workerVersion) || await fetchWorkerVersion();
      setVisibleFooter(user, workerVersion);
    }catch(error){
      hideFooter();
    }
  }

  window.KvimarkaVersionFooter = {
    version: FOOTER_VERSION,
    refresh: initVersionFooter,
    isAdminUser: isAdminUser
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initVersionFooter);
  }else{
    initVersionFooter();
  }
})();
