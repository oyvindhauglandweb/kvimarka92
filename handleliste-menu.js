
/* Handleliste felles toppmeny v1
   Én felles meny for Handleliste-sidene. Endre primært denne filen fremover. */
(function(){
  const MENU_VERSION = "handleliste-menu-v1-2026-06-17";

  function svg(name){
    const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    const icons = {
      clipboard:`<svg ${common}><path d="M9 4.5h6"></path><path d="M10 3h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1z"></path><rect x="6" y="5" width="12" height="16" rx="2"></rect><path d="M9 10l1.4 1.4L13 8.8"></path><path d="M9 14l1.4 1.4L13 12.8"></path><path d="M9 18l1.4 1.4L13 16.8"></path><path d="M14.5 10H16"></path><path d="M14.5 14H16"></path><path d="M14.5 18H16"></path></svg>`,
      cart:`<svg ${common}><circle cx="9" cy="19" r="1.6"></circle><circle cx="17" cy="19" r="1.6"></circle><path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H7.2"></path></svg>`,
      home:`<svg ${common}><path d="M4 11.5L12 5l8 6.5"></path><path d="M7 10.5V19h10v-8.5"></path></svg>`,
      settings:`<svg ${common}><circle cx="12" cy="12" r="3"></circle><path d="M12 2.8v2"></path><path d="M12 19.2v2"></path><path d="M4.9 4.9l1.4 1.4"></path><path d="M17.7 17.7l1.4 1.4"></path><path d="M2.8 12h2"></path><path d="M19.2 12h2"></path><path d="M4.9 19.1l1.4-1.4"></path><path d="M17.7 6.3l1.4-1.4"></path></svg>`
    };
    return icons[name] || "";
  }

  function addCss(){
    if(document.getElementById("handlelisteSharedMenuCss")) return;
    const style = document.createElement("style");
    style.id = "handlelisteSharedMenuCss";
    style.textContent = `
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
        min-width:190px !important;
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
      }
      .handleliste-shared-top-menu .settings-menu a:hover{
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

  function toggleSize(){
    if(typeof window.toggleHandleSize === "function"){
      window.toggleHandleSize();
      return;
    }
    try{
      const allowed = ["small","medium","large"];
      const current = localStorage.getItem("shoppingHandleSize") || "small";
      const idx = allowed.indexOf(current);
      const next = allowed[(idx < 0 ? 0 : idx + 1) % allowed.length];
      localStorage.setItem("shoppingHandleSize", next);
      document.documentElement.classList.remove("handle-size-small","handle-size-medium","handle-size-large");
      document.documentElement.classList.add("handle-size-" + next);
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

  function pushAndGo(url, event){
    if(event) event.preventDefault();
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

  function render(){
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
      <button type="button" class="top-button" id="handlelisteSizeToggle" onclick="HandlelisteMenu.toggleSize()" title="Endre tekststørrelse" aria-label="Endre tekststørrelse">A+</button>
      <button type="button" class="top-button" id="handlelisteThemeToggle" onclick="HandlelisteMenu.toggleTheme()" title="Bytt lys/mørk modus" aria-label="Bytt lys/mørk modus"><span class="theme-text-symbol">✱</span></button>
      <button type="button" class="top-button design-toggle-button" id="handlelisteDesignToggle" onclick="HandlelisteMenu.toggleDesign()" title="Bytt design" aria-label="Bytt design">◫</button>
      <span class="settings-wrap" id="handlelisteSettingsWrap">
        <button type="button" class="top-button menu-icon-button" id="handlelisteSettingsToggle" onclick="return HandlelisteMenu.toggleSettings(event)" title="Innstillinger" aria-label="Innstillinger">${svg("settings")}</button>
        <span class="settings-menu" role="menu" aria-label="Innstillinger">
          <a href="handleliste-varsling.html" onclick="return HandlelisteMenu.pushAndGo('handleliste-varsling.html', event)">Varsling</a>
          <a href="handleliste-varetyper.html" onclick="return HandlelisteMenu.pushAndGo('handleliste-varetyper.html', event)">Varetyper</a>
          <a href="handleliste-rediger.html" onclick="return HandlelisteMenu.pushAndGo('handleliste-rediger.html', event)">Varer</a>
          <a href="handleliste-rydde.html" onclick="return HandlelisteMenu.pushAndGo('handleliste-rydde.html', event)">Rydde i varer</a>
          <a href="handleliste-oppskrifter.html" onclick="return HandlelisteMenu.pushAndGo('handleliste-oppskrifter.html', event)">Oppskrifter</a>
        </span>
      </span>
    `;

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
    toggleSettings
  };

  document.addEventListener("click", closeSettings);
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){
      render();
      applyThemeState();
      setTimeout(updateThemeButton, 0);
      setTimeout(updateThemeButton, 100);
    });
  }else{
    render();
    applyThemeState();
    setTimeout(updateThemeButton, 0);
    setTimeout(updateThemeButton, 100);
  }
})();
