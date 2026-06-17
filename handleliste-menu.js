
/* Handleliste felles toppmeny v3
   Produksjonsnavn: handleliste-menu.js */
(function(){
  const MENU_VERSION = "handleliste-menu-v8-2026-06-17";

  function svg(name){
    const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    const icons = {
      clipboard:`<svg ${common}><path d="M9 4.5h6"></path><path d="M10 3h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1z"></path><rect x="6" y="5" width="12" height="16" rx="2"></rect><path d="M9 10l1.4 1.4L13 8.8"></path><path d="M9 14l1.4 1.4L13 12.8"></path><path d="M9 18l1.4 1.4L13 16.8"></path><path d="M14.5 10H16"></path><path d="M14.5 14H16"></path><path d="M14.5 18H16"></path></svg>`,
      cart:`<svg ${common}><circle cx="9" cy="19" r="1.6"></circle><circle cx="17" cy="19" r="1.6"></circle><path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H7.2"></path></svg>`,
      home:`<svg ${common}><path d="M4 11.5L12 5l8 6.5"></path><path d="M7 10.5V19h10v-8.5"></path></svg>`,
      sliders:`<svg ${common}><path d="M5 7h14"></path><path d="M5 12h14"></path><path d="M5 17h14"></path><circle cx="9" cy="7" r="1.7"></circle><circle cx="15" cy="12" r="1.7"></circle><circle cx="11" cy="17" r="1.7"></circle></svg>`,
      pencil:`<svg ${common}><path d="M4 20h4l11-11a2.6 2.6 0 0 0-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path></svg>`,
      bell:`<svg ${common}><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>`,
      book:`<svg ${common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H7a3 3 0 0 0-3 3V5.5z"></path><path d="M4 20a3 3 0 0 1 3-3h13"></path></svg>`,
      history:`<svg ${common}><path d="M5 20V12"></path><path d="M12 20V5"></path><path d="M19 20V9"></path></svg>`,
      help:`<svg ${common}><circle cx="12" cy="12" r="9"></circle><path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 2-2.3 4"></path><path d="M12 17.2v.1"></path></svg>`
    };
    return icons[name] || "";
  }

  function pageName(){
    return location.pathname.split("/").pop().toLowerCase();
  }

  function isHandlelisteHelpCase(){
    try{
      const url = new URL(location.href);
      const caseName = (url.searchParams.get("case") || "").toLowerCase();
      return pageName() === "help.html" && caseName === "handleliste";
    }catch(error){
      return false;
    }
  }

  function shouldRenderOnThisPage(){
    const page = pageName();
    return page.startsWith("handleliste-") || isHandlelisteHelpCase();
  }

  function addCss(){
    if(document.getElementById("handlelisteSharedMenuCss")) return;
    const style = document.createElement("style");
    style.id = "handlelisteSharedMenuCss";
    style.textContent = `
      html.handleliste-size-small{--handleliste-menu-scale:1;}
      html.handleliste-size-medium{--handleliste-menu-scale:1.08;}
      html.handleliste-size-large{--handleliste-menu-scale:1.18;}

      .handleliste-shared-top-menu{
        display:flex !important;
        justify-content:center !important;
        align-items:center !important;
        gap:10px !important;
        flex-wrap:wrap !important;
        margin:14px 0 0 !important;
      }
      .handleliste-shared-top-menu .top-button{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:44px !important;
        height:44px !important;
        min-width:44px !important;
        min-height:44px !important;
        padding:0 !important;
        text-decoration:none !important;
        line-height:1 !important;
      }
      .handleliste-shared-top-menu .top-button svg{
        width:22px !important;
        height:22px !important;
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:2 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
        display:block !important;
      }
      .handleliste-shared-top-menu .menu-icon-button{
        font-size:0 !important;
      }
      .handleliste-shared-top-menu .settings-wrap{
        position:relative !important;
        display:inline-flex !important;
      }
      .handleliste-shared-top-menu .settings-menu{
        position:absolute !important;
        top:50px !important;
        right:0 !important;
        min-width:210px !important;
        z-index:99999 !important;
        padding:7px !important;
        border-radius:10px !important;
        background:var(--card,#242424) !important;
        color:var(--text,#eee) !important;
        box-shadow:0 12px 32px rgba(0,0,0,.28) !important;
        display:none !important;
      }
      .handleliste-shared-top-menu .settings-wrap.open .settings-menu{
        display:block !important;
      }
      .handleliste-shared-top-menu .settings-menu a{
        display:block !important;
        padding:9px 10px !important;
        border-radius:8px !important;
        color:var(--text,#eee) !important;
        text-decoration:none !important;
        font-weight:700 !important;
        white-space:nowrap !important;
        text-align:center !important;
      }
      .handleliste-shared-top-menu .settings-menu a:hover,
      .handleliste-shared-top-menu .settings-menu a.current-page{
        background:rgba(127,127,127,.18) !important;
      }
      body:not(.dark-mode) .handleliste-shared-top-menu .settings-menu{
        background:#ffffff !important;
        color:#111827 !important;
        border:1px solid #d1d5db !important;
      }
      body:not(.dark-mode) .handleliste-shared-top-menu .settings-menu a{
        color:#111827 !important;
      }
      .handleliste-shared-top-menu .theme-text-symbol{
        font-size:22px !important;
        font-family:Arial, sans-serif !important;
        font-weight:700 !important;
      }

      html.handleliste-size-medium body{font-size:calc(16px * 1.08) !important;}
      html.handleliste-size-large body{font-size:calc(16px * 1.18) !important;}
      html.handleliste-size-medium .item-name,
      html.handleliste-size-medium .action-button,
      html.handleliste-size-medium .owner-button,
      html.handleliste-size-medium .status{font-size:calc(1em * 1.06) !important;}
      html.handleliste-size-large .item-name,
      html.handleliste-size-large .action-button,
      html.handleliste-size-large .owner-button,
      html.handleliste-size-large .status{font-size:calc(1em * 1.13) !important;}


      body.dark-mode .handleliste-shared-top-menu .bestille-top-button,
      body.dark-mode .handleliste-shared-top-menu .handle-top-button{
        color:#ffffff !important;
      }
      body:not(.dark-mode) .handleliste-shared-top-menu .bestille-top-button,
      body:not(.dark-mode) .handleliste-shared-top-menu .handle-top-button{
        color:#111827 !important;
      }
      .handleliste-page-corner-icon{
        position:fixed !important;
        top:18px !important;
        left:20px !important;
        width:48px !important;
        height:48px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        z-index:50 !important;
        color:#b8b8c4 !important;
        pointer-events:none !important;
      }
      .handleliste-page-corner-icon svg{
        width:42px !important;
        height:42px !important;
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:2 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
      }
      body:not(.dark-mode) .handleliste-page-corner-icon{
        color:#59606c !important;
      }

      @media(max-width:700px){
        .handleliste-shared-top-menu{gap:8px !important;}
        .handleliste-shared-top-menu .top-button{
          width:40px !important;
          height:40px !important;
          min-width:40px !important;
          min-height:40px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function readSize(){
    try{
      return localStorage.getItem("shoppingHandleSize") || localStorage.getItem("handlelisteSize") || "small";
    }catch(error){
      return "small";
    }
  }

  function normalizedSize(){
    const value = readSize();
    return ["small","medium","large"].includes(value) ? value : "small";
  }

  function updateSizeButton(){
    const btn = document.getElementById("handlelisteSizeToggle");
    if(!btn) return;
    const size = normalizedSize();
    btn.textContent = size === "large" ? "A++" : size === "medium" ? "A+" : "A";
    btn.title = "Endre tekststørrelse";
    btn.setAttribute("aria-label", btn.title);
  }

  function applySizeState(){
    const size = normalizedSize();
    document.documentElement.classList.remove("handleliste-size-small","handleliste-size-medium","handleliste-size-large");
    document.documentElement.classList.add("handleliste-size-" + size);

    if(typeof window.applyHandleSizeState === "function"){
      try{ window.applyHandleSizeState(); }catch(error){}
    }

    updateSizeButton();
  }

  function toggleSize(){
    try{
      const allowed = ["small","medium","large"];
      const current = normalizedSize();
      const idx = allowed.indexOf(current);
      const next = allowed[(idx < 0 ? 0 : idx + 1) % allowed.length];
      localStorage.setItem("shoppingHandleSize", next);
      localStorage.setItem("handlelisteSize", next);
    }catch(error){}
    applySizeState();
  }

  function getThemeIsDark(){
    try{
      const saved = localStorage.getItem("shoppingTheme") || localStorage.getItem("brochureTheme") || "dark";
      return saved !== "light";
    }catch(error){
      return document.body ? document.body.classList.contains("dark-mode") : true;
    }
  }

  function updateThemeButton(){
    const btn = document.getElementById("handlelisteThemeToggle");
    if(!btn) return;
    const isDark = getThemeIsDark();
    btn.innerHTML = `<span class="theme-text-symbol">${isDark ? "✱" : "☾"}</span>`;
    btn.title = isDark ? "Bytt til lys modus" : "Bytt til mørk modus";
    btn.setAttribute("aria-label", btn.title);
  }

  function applyThemeState(){
    try{
      const isDark = getThemeIsDark();
      if(document.body){
        document.body.classList.toggle("dark-mode", isDark);
      }
      document.documentElement.classList.toggle("preload-dark-mode", isDark);
      localStorage.setItem("shoppingTheme", isDark ? "dark" : "light");
      localStorage.setItem("brochureTheme", isDark ? "dark" : "light");
    }catch(error){}
    updateThemeButton();
  }

  function toggleTheme(){
    try{
      const isDark = getThemeIsDark();
      localStorage.setItem("shoppingTheme", isDark ? "light" : "dark");
      localStorage.setItem("brochureTheme", isDark ? "light" : "dark");
    }catch(error){}
    applyThemeState();
  }

  function toggleDesign(){
    if(typeof window.toggleShoppingDesign === "function"){
      window.toggleShoppingDesign();
      return;
    }
    try{
      const isClassic = document.documentElement.classList.toggle("classic-design-root");
      localStorage.setItem("shoppingDesign", isClassic ? "classic" : "soft");
    }catch(error){}
  }

  function goBack(event){
    if(window.goHandlelisteBackOrHome){
      return window.goHandlelisteBackOrHome(event);
    }
    if(event) event.preventDefault();
    window.location.href = "index.html?restoreMenu=1";
    return false;
  }

  function currentBasePage(){
    return pageName();
  }

  function isCurrentTarget(url){
    try{
      const targetPage = String(url || "").split("?")[0].split("#")[0].toLowerCase();
      if(targetPage === currentBasePage()){
        return true;
      }
      if(targetPage === "handleliste-oppskrifter-rediger.html" && currentBasePage() === "handleliste-oppskrifter-rediger.html"){
        return true;
      }
      return false;
    }catch(error){
      return false;
    }
  }

  function pushAndGo(url, event){
    if(event) event.preventDefault();

    if(isCurrentTarget(url)){
      closeSettings();
      return false;
    }

    try{
      if(window.pushHandlelisteBackUrl){
        window.pushHandlelisteBackUrl();
      }
    }catch(error){}

    window.location.href = url;
    return false;
  }

  function toggleSettings(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    const wrap = document.getElementById("handlelisteSettingsWrap");
    if(wrap) wrap.classList.toggle("open");
    return false;
  }

  function closeSettings(event){
    const wrap = document.getElementById("handlelisteSettingsWrap");
    if(!wrap || !wrap.classList.contains("open")) return;
    if(event && wrap.contains(event.target)) return;
    wrap.classList.remove("open");
  }

  function settingsLink(url, label){
    const current = isCurrentTarget(url);
    const cls = current ? ' class="current-page" aria-current="page"' : "";
    return `<a${cls} href="${current ? "#" : url}" onclick="return HandlelisteMenu.pushAndGo('${url}', event)">${label}</a>`;
  }

  function actionLink(functionName, label){
    const exists = typeof window[functionName] === "function";
    if(!exists) return "";
    return `<a href="#" onclick="return HandlelisteMenu.runPageAction('${functionName}', event)">${label}</a>`;
  }

  function runPageAction(functionName, event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    closeSettings();
    if(typeof window[functionName] === "function"){
      window[functionName]();
    }
    return false;
  }


  function iconForPage(){
    const page = currentBasePage();
    if(page === "handleliste-bestille.html") return "clipboard";
    if(page === "handleliste-handle.html") return "cart";
    if(page === "handleliste-varsling.html") return "bell";
    if(page === "handleliste-historikk.html") return "history";
    if(page === "handleliste-oppskrifter.html") return "book";
    if(page === "help.html") return "help";
    return "pencil";
  }

  function renderCornerIcon(){
    if(!shouldRenderOnThisPage()) return;

    document.querySelectorAll(".page-icon-panel,.handleliste-page-corner-icon").forEach(node => {
      if(node && node.parentNode){
        node.parentNode.removeChild(node);
      }
    });

    const iconName = iconForPage();
    const corner = document.createElement("div");
    corner.id = "handlelistePageCornerIcon";
    corner.className = "handleliste-page-corner-icon";
    corner.setAttribute("aria-hidden", "true");
    corner.innerHTML = svg(iconName);
    document.body.appendChild(corner);
  }

  function render(){
    if(!shouldRenderOnThisPage()) return;
    addCss();

    const host = document.getElementById("handlelisteTopMenu") || document.querySelector(".header .top-buttons");
    if(!host) return;

    host.className = "top-buttons handleliste-shared-top-menu";
    host.innerHTML = `
      <a class="top-button" href="index.html?restoreMenu=1" title="Tilbake" onclick="return HandlelisteMenu.goBack(event)">←</a>
      <a class="top-button menu-icon-button bestille-top-button" href="handleliste-bestille.html" title="Bestille" onclick="return HandlelisteMenu.pushAndGo('handleliste-bestille.html', event)">${svg("clipboard")}</a>
      <a class="top-button menu-icon-button handle-top-button" href="handleliste-handle.html" title="Handle" onclick="return HandlelisteMenu.pushAndGo('handleliste-handle.html', event)">${svg("cart")}</a>
      <a class="top-button menu-icon-button" href="index.html" title="Hovedside">${svg("home")}</a>
      <a class="top-button" href="help.html?case=Handleliste" title="Hjelp">?</a>
      <button type="button" class="top-button" id="handlelisteSizeToggle" onclick="HandlelisteMenu.toggleSize()" title="Endre tekststørrelse" aria-label="Endre tekststørrelse">A</button>
      <button type="button" class="top-button" id="handlelisteThemeToggle" onclick="HandlelisteMenu.toggleTheme()" title="Bytt lys/mørk modus" aria-label="Bytt lys/mørk modus"><span class="theme-text-symbol">✱</span></button>
      <button type="button" class="top-button design-toggle-button" id="handlelisteDesignToggle" onclick="HandlelisteMenu.toggleDesign()" title="Bytt design" aria-label="Bytt design">◫</button>
      <span class="settings-wrap" id="handlelisteSettingsWrap">
        <button type="button" class="top-button menu-icon-button" id="handlelisteSettingsToggle" onclick="return HandlelisteMenu.toggleSettings(event)" title="Innstillinger" aria-label="Innstillinger">${svg("sliders")}</button>
        <span class="settings-menu" role="menu" aria-label="Innstillinger">
          ${settingsLink("handleliste-varsling.html", "Varsling")}
          ${settingsLink("handleliste-varetyper.html", "Varetyper")}
          ${settingsLink("handleliste-rediger.html", "Varer")}
          ${settingsLink("handleliste-historikk.html", "Historikk")}
          ${settingsLink("handleliste-rydde.html", "Rydde i varer")}
          ${settingsLink("handleliste-oppskrifter-rediger.html", "Oppskrifter")}
          ${actionLink("sendShoppingListEmail", "E-post")}
          ${actionLink("sendShoppingListSms", "SMS")}
        </span>
      </span>
    `;

    renderCornerIcon();
    applySizeState();
    updateThemeButton();
  }

  window.HandlelisteMenu = {
    version: MENU_VERSION,
    render,
    goBack,
    pushAndGo,
    toggleTheme,
    toggleDesign,
    toggleSize,
    toggleSettings,
    runPageAction
  };

  document.addEventListener("click", closeSettings);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){
      render();
      applyThemeState();
      applySizeState();
      setTimeout(updateThemeButton, 0);
      setTimeout(updateThemeButton, 100);
    });
  }else{
    render();
    applyThemeState();
    applySizeState();
    setTimeout(updateThemeButton, 0);
    setTimeout(updateThemeButton, 100);
  }
})();
