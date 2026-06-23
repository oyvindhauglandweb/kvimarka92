
/* Handleliste felles toppmeny v3
   Produksjonsnavn: handleliste-menu.js */
(function(){
  const MENU_VERSION = "handleliste-menu-v16-normalize-norwegian-phone-2026-06-23";
  const API_BASE = "https://api-kvimarka92.carstereogarage.com";

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

      .handleliste-floating-controls{
        position:fixed !important;
        top:18px !important;
        right:20px !important;
        z-index:99999 !important;
        display:flex !important;
        align-items:center !important;
        gap:8px !important;
      }
      .handleliste-floating-controls .floating-round-button,
      .handleliste-floating-controls .login-status{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:38px !important;
        height:38px !important;
        min-width:38px !important;
        min-height:38px !important;
        padding:0 !important;
        border:1px solid var(--border,#555) !important;
        border-radius:50% !important;
        background:var(--card,#242424) !important;
        color:var(--muted,#bbb) !important;
        text-decoration:none !important;
        font-size:13px !important;
        font-weight:bold !important;
        line-height:1 !important;
        opacity:.88 !important;
        box-sizing:border-box !important;
        cursor:pointer !important;
      }
      .handleliste-floating-controls .floating-round-button:hover,
      .handleliste-floating-controls .login-status:hover{
        opacity:1 !important;
        color:var(--text,#eee) !important;
      }
      .handleliste-floating-controls .floating-round-button svg{
        width:20px !important;
        height:20px !important;
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:2 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
      }
      .handleliste-floating-controls .settings-wrap{
        position:relative !important;
        display:inline-flex !important;
      }
      .handleliste-floating-controls .login-widget{
        position:relative !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
      }
      .handleliste-floating-controls .login-widget.open .login-menu{
        display:block !important;
      }
      .handleliste-floating-controls .settings-menu{
        position:absolute !important;
        top:44px !important;
        right:0 !important;
        min-width:210px !important;
        z-index:99999 !important;
        padding:7px !important;
        border-radius:10px !important;
        background:var(--card,#242424) !important;
        color:var(--text,#eee) !important;
        border:1px solid var(--border,#555) !important;
        box-shadow:0 12px 32px rgba(0,0,0,.28) !important;
        display:none !important;
      }
      .handleliste-floating-controls .settings-wrap.open .settings-menu{
        display:block !important;
      }
      .handleliste-floating-controls .settings-menu a{
        display:block !important;
        padding:9px 10px !important;
        border-radius:8px !important;
        color:var(--text,#eee) !important;
        text-decoration:none !important;
        font-weight:700 !important;
        white-space:nowrap !important;
        text-align:center !important;
      }
      .handleliste-floating-controls .settings-menu a:hover,
      .handleliste-floating-controls .settings-menu a.current-page{
        background:rgba(127,127,127,.18) !important;
      }
      .handleliste-floating-controls .login-menu{
        position:absolute !important;
        top:44px !important;
        right:0 !important;
        min-width:247px !important;
        padding:10px !important;
        border:1px solid var(--border,#555) !important;
        border-radius:10px !important;
        background:var(--card,#242424) !important;
        color:var(--text,#eee) !important;
        box-shadow:0 8px 24px rgba(0,0,0,.25) !important;
        box-sizing:border-box !important;
        display:none !important;
        z-index:100001 !important;
      }
      .handleliste-floating-controls .login-menu-name{
        display:block !important;
        font-weight:bold !important;
        font-size:13px !important;
        line-height:1.25 !important;
        margin-bottom:8px !important;
        color:var(--text,#eee) !important;
        white-space:normal !important;
        overflow-wrap:anywhere !important;
      }
      .handleliste-floating-controls .login-menu-link{
        display:block !important;
        padding:8px 10px !important;
        margin:0 -4px -4px !important;
        border-radius:8px !important;
        color:var(--handle-important-text,var(--link,#7cc7e8)) !important;
        text-decoration:none !important;
        font-weight:bold !important;
        font-size:13px !important;
      }
      .handleliste-floating-controls .login-menu-link:hover{
        background:rgba(127,127,127,.14) !important;
      }
      .handleliste-floating-controls .login-menu-logout{
        margin-top:8px !important;
        padding-top:10px !important;
        border-top:1px solid rgba(127,127,127,.18) !important;
      }
      .handleliste-floating-controls .login-status.is-signin{
        font-size:0 !important;
      }
      .handleliste-floating-controls .login-status.is-signin::before{
        content:"↗";
        font-size:18px;
        font-weight:bold;
      }
      .handleliste-create-user-modal{
        display:none;
        position:fixed;
        inset:0;
        z-index:100000;
        background:rgba(0,0,0,.72);
        padding:18px;
        overflow:auto;
        box-sizing:border-box;
      }
      .handleliste-create-user-modal.open{
        display:block;
      }
      .handleliste-create-user-modal-content{
        width:min(520px, calc(100vw - 36px));
        margin:70px auto;
        padding:18px;
        border-radius:14px;
        background:var(--card,#242424);
        color:var(--text,#eee);
        border:1px solid var(--border,#555);
        box-shadow:0 18px 44px rgba(0,0,0,.35);
      }
      .handleliste-create-user-modal-header{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:14px;
      }
      .handleliste-create-user-modal-title{
        font-size:22px;
        font-weight:800;
      }
      .handleliste-create-user-modal-close{
        width:40px;
        height:40px;
        min-width:40px;
        border:0;
        border-radius:8px;
        background:rgba(127,127,127,.16);
        color:var(--text,#eee);
        font-size:24px;
        font-weight:bold;
        cursor:pointer;
      }
      .handleliste-create-user-field{
        display:flex;
        flex-direction:column;
        gap:6px;
        margin-bottom:12px;
      }
      .handleliste-create-user-field label{
        font-size:14px;
        font-weight:800;
      }
      .handleliste-create-user-field input{
        width:100%;
        min-height:40px;
        padding:0 12px;
        border:0;
        border-radius:8px;
        background:rgba(127,127,127,.14);
        color:var(--text,#eee);
        font-size:15px;
        box-sizing:border-box;
      }
      .handleliste-create-user-help{
        margin:0 0 14px;
        color:var(--muted,#bbb);
        font-size:13px;
        line-height:1.35;
      }
      .handleliste-create-user-actions{
        display:flex;
        justify-content:flex-end;
        gap:8px;
        flex-wrap:wrap;
        margin-top:14px;
      }
      .handleliste-create-user-button{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:36px;
        padding:0 12px;
        border:0;
        border-radius:8px;
        background:rgba(127,127,127,.16);
        color:var(--text,#eee);
        font-weight:800;
        cursor:pointer;
      }
      .handleliste-create-user-button.primary{
        background:var(--link,#7cc7e8);
        color:#fff;
      }
      .handleliste-create-user-status{
        min-height:18px;
        margin-top:10px;
        color:var(--muted,#bbb);
        font-size:13px;
        line-height:1.35;
      }
      .handleliste-create-user-status.error{color:#ff8b8b;}
      .handleliste-create-user-status.success{color:#72c184;}
      @media(max-width:700px){
        .handleliste-floating-controls{
          top:10px !important;
          right:10px !important;
          gap:7px !important;
        }
        .handleliste-floating-controls .floating-round-button,
        .handleliste-floating-controls .login-status{
          width:36px !important;
          height:36px !important;
          min-width:36px !important;
          min-height:36px !important;
        }
        .handleliste-shared-top-menu{
          gap:8px !important;
        }
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

      #handlelisteSizeToggle{
        font-size:20px !important;
        letter-spacing:-.04em !important;
        padding:0 3px !important;
      }
      html.handleliste-size-medium #handlelisteSizeToggle,
      html.handleliste-size-large #handlelisteSizeToggle{
        font-size:18px !important;
        letter-spacing:-.08em !important;
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


  function getInitials(value){
    const text = String(value || "").trim();

    if(!text){
      return "";
    }

    const withoutEmail = text.includes("@") ? text.split("@")[0] : text;
    const cleaned = withoutEmail.replace(/[._-]+/g, " ").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);

    if(parts.length >= 2){
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return cleaned.slice(0, 2).toUpperCase();
  }

  function isAdminUser(user){
    const role = String((user && user.role) || "").trim().toLowerCase();
    const memberRole = String((user && user.family && user.family.memberRole) || "").trim().toLowerCase();
    return role === "administrator" || role === "admin" || memberRole === "administrator" || memberRole === "admin";
  }

  async function fetchCurrentUser(){
    try{
      const res = await fetch(`${API_BASE}/whoami`, {
        credentials:"include",
        cache:"no-store"
      });

      if(!res.ok){
        return null;
      }

      return await res.json();
    }catch(error){
      return null;
    }
  }

  async function performLogout(){
    try{
      await fetch(`${API_BASE}/cdn-cgi/access/logout`, {
        method:"GET",
        credentials:"include",
        mode:"no-cors"
      });
    }catch(error){}

    window.location.href = "index.html?logout=" + Date.now();
  }


  async function createStandardUserApi(payload){
    // text/plain unngår unødvendig CORS preflight mot Worker.
    // Worker leser fortsatt innholdet som JSON.
    const res = await fetch(`${API_BASE}/shopping/users/create-standard`, {
      method:"POST",
      mode:"cors",
      credentials:"include",
      headers:{"Content-Type":"text/plain;charset=UTF-8"},
      body:JSON.stringify(payload)
    });

    const text = await res.text();
    let data = null;
    try{ data = text ? JSON.parse(text) : null; }catch(error){}

    if(!res.ok){
      const message = (data && (data.error || data.message)) || text || `HTTP ${res.status}`;
      throw new Error(message);
    }

    return data || {};
  }

  function settingsMenuHtml(){
    return `
          ${settingsLink("handleliste-varsling.html", "Varsling")}
          ${settingsLink("handleliste-varetyper.html", "Varetyper")}
          ${settingsLink("handleliste-rediger.html", "Varer")}
          ${settingsLink("handleliste-historikk.html", "Historikk")}
          ${settingsLink("handleliste-rydde.html", "Rydde i varer")}
          ${settingsLink("handleliste-oppskrifter-rediger.html", "Oppskrifter")}
          ${actionLink("sendShoppingListEmail", "E-post")}
          ${actionLink("sendShoppingListSms", "SMS")}
        `;
  }

  function renderFloatingControls(){
    if(!shouldRenderOnThisPage()) return;

    let controls = document.getElementById("handlelisteFloatingControls");

    if(!controls){
      controls = document.createElement("div");
      controls.id = "handlelisteFloatingControls";
      controls.className = "handleliste-floating-controls";
      document.body.appendChild(controls);
    }

    controls.innerHTML = `
      <span class="settings-wrap" id="handlelisteSettingsWrap">
        <button type="button" class="floating-round-button menu-icon-button" id="handlelisteSettingsToggle" onclick="return HandlelisteMenu.toggleSettings(event)" title="Innstillinger" aria-label="Innstillinger">${svg("sliders")}</button>
        <span class="settings-menu" role="menu" aria-label="Innstillinger">
          ${settingsMenuHtml()}
        </span>
      </span>
      <span class="login-widget" id="handlelisteLoginWidget">
        <a id="handlelisteLoginStatus" class="login-status is-signin" href="#" title="Logg inn">↗</a>
        <span id="handlelisteLoginMenu" class="login-menu">
          <span id="handlelisteLoginMenuName" class="login-menu-name"></span>
          <a id="handlelisteCreateUserLink" class="login-menu-link" href="#">Opprett bruker</a>
          <a id="handlelisteLogoutLink" class="login-menu-link login-menu-logout" href="#">Logge av</a>
        </span>
      </span>
    `;

    renderCreateUserDialog();
    setupLoginWidget();
  }

  function renderCreateUserDialog(){
    if(document.getElementById("handlelisteCreateUserModal")){
      return;
    }

    const modal = document.createElement("div");
    modal.id = "handlelisteCreateUserModal";
    modal.className = "handleliste-create-user-modal";
    modal.innerHTML = `
      <div class="handleliste-create-user-modal-content" role="dialog" aria-modal="true" aria-labelledby="handlelisteCreateUserTitle">
        <div class="handleliste-create-user-modal-header">
          <div class="handleliste-create-user-modal-title" id="handlelisteCreateUserTitle">Opprett bruker</div>
          <button type="button" class="handleliste-create-user-modal-close" onclick="HandlelisteMenu.closeCreateUserDialog()" aria-label="Lukk">×</button>
        </div>
        <p class="handleliste-create-user-help">Oppretter en ny standard bruker i Handleliste. Brukeren får ikke administratorrolle.</p>
        <form id="handlelisteCreateUserForm" onsubmit="return HandlelisteMenu.submitCreateUserDialog(event)">
          <div class="handleliste-create-user-field">
            <label for="handlelisteCreateUserName">Fullt navn</label>
            <input id="handlelisteCreateUserName" name="name" type="text" autocomplete="name" required>
          </div>
          <div class="handleliste-create-user-field">
            <label for="handlelisteCreateUserDisplayName">Navn i Handleliste</label>
            <input id="handlelisteCreateUserDisplayName" name="displayName" type="text" autocomplete="nickname" required placeholder="F.eks. Per eller Ann Magret">
          </div>
          <div class="handleliste-create-user-field">
            <label for="handlelisteCreateUserEmail">E-post</label>
            <input id="handlelisteCreateUserEmail" name="email" type="email" autocomplete="email" required>
          </div>
          <div class="handleliste-create-user-field">
            <label for="handlelisteCreateUserPhone">Mobilnummer</label>
            <input id="handlelisteCreateUserPhone" name="phone" type="tel" autocomplete="tel" required inputmode="tel" placeholder="F.eks. 12345678">
          </div>
          <div class="handleliste-create-user-help"><strong>Rolle:</strong> Standard bruker</div>
          <div id="handlelisteCreateUserStatus" class="handleliste-create-user-status"></div>
          <div class="handleliste-create-user-actions">
            <button type="button" class="handleliste-create-user-button" onclick="HandlelisteMenu.closeCreateUserDialog()">Avbryt</button>
            <button id="handlelisteCreateUserSubmit" type="submit" class="handleliste-create-user-button primary" disabled>Opprett bruker</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }



  function isValidCreateUserName(value){
    const text = String(value || "").trim().replace(/\s+/g, " ");
    return text.length >= 2;
  }

  function isValidCreateUserDisplayName(value){
    const text = String(value || "").trim().replace(/\s+/g, " ");
    return text.length >= 2;
  }

  function isValidCreateUserEmail(value){
    const text = String(value || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  function normalizeNorwegianPhoneForSave(value){
    const text = String(value || "").trim();
    const digits = text.replace(/\D/g, "");

    if(!digits){
      return "";
    }

    if(text.startsWith("+")){
      return "+" + digits;
    }

    if(digits.length === 8){
      return "+47" + digits;
    }

    if(digits.length === 10 && digits.startsWith("47")){
      return "+" + digits;
    }

    return text.replace(/\s+/g, " ");
  }

  function isValidCreateUserPhone(value){
    const text = String(value || "").trim();
    if(!text) return false;
    if(!/^\+?[0-9\s().-]+$/.test(text)) return false;
    const digits = text.replace(/\D/g, "");
    if(text.startsWith("+47")) return digits.length === 10;
    if(text.startsWith("47") && digits.length === 10) return true;
    return digits.length >= 8 && digits.length <= 15;
  }

  function updateCreateUserSubmitState(){
    const nameInput = document.getElementById("handlelisteCreateUserName");
    const displayNameInput = document.getElementById("handlelisteCreateUserDisplayName");
    const emailInput = document.getElementById("handlelisteCreateUserEmail");
    const phoneInput = document.getElementById("handlelisteCreateUserPhone");
    const submitButton = document.getElementById("handlelisteCreateUserSubmit");

    const valid = isValidCreateUserName(nameInput && nameInput.value) &&
      isValidCreateUserDisplayName(displayNameInput && displayNameInput.value) &&
      isValidCreateUserEmail(emailInput && emailInput.value) &&
      isValidCreateUserPhone(phoneInput && phoneInput.value);

    if(submitButton){
      submitButton.disabled = !valid;
    }

    return valid;
  }

  function setupCreateUserValidation(){
    ["handlelisteCreateUserName", "handlelisteCreateUserDisplayName", "handlelisteCreateUserEmail", "handlelisteCreateUserPhone"].forEach(id => {
      const input = document.getElementById(id);
      if(input && !input.dataset.validationBound){
        input.dataset.validationBound = "1";
        input.addEventListener("input", updateCreateUserSubmitState);
        input.addEventListener("change", updateCreateUserSubmitState);
      }
    });

    updateCreateUserSubmitState();
  }

  function setCreateUserStatus(message, type){
    const status = document.getElementById("handlelisteCreateUserStatus");
    if(!status) return;
    status.className = "handleliste-create-user-status" + (type ? ` ${type}` : "");
    status.textContent = message || "";
  }

  function openCreateUserDialog(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    const loginWidget = document.getElementById("handlelisteLoginWidget");
    const loginMenu = document.getElementById("handlelisteLoginMenu");
    if(loginWidget) loginWidget.classList.remove("open");
    if(loginMenu) loginMenu.style.display = "none";
    renderCreateUserDialog();
    const modal = document.getElementById("handlelisteCreateUserModal");
    const form = document.getElementById("handlelisteCreateUserForm");
    if(form) form.reset();
    setCreateUserStatus("", "");
    setupCreateUserValidation();
    if(modal) modal.classList.add("open");
    setTimeout(function(){
      const nameInput = document.getElementById("handlelisteCreateUserName");
      if(nameInput) nameInput.focus();
    }, 0);
    closeSettings();
    return false;
  }

  function closeCreateUserDialog(){
    const modal = document.getElementById("handlelisteCreateUserModal");
    if(modal) modal.classList.remove("open");
    return false;
  }

  async function submitCreateUserDialog(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }

    const nameInput = document.getElementById("handlelisteCreateUserName");
    const displayNameInput = document.getElementById("handlelisteCreateUserDisplayName");
    const emailInput = document.getElementById("handlelisteCreateUserEmail");
    const phoneInput = document.getElementById("handlelisteCreateUserPhone");
    const submitButton = document.querySelector("#handlelisteCreateUserForm button[type='submit']");

    const payload = {
      name:String((nameInput && nameInput.value) || "").trim(),
      displayName:String((displayNameInput && displayNameInput.value) || "").trim(),
      email:String((emailInput && emailInput.value) || "").trim(),
      phone:normalizeNorwegianPhoneForSave((phoneInput && phoneInput.value) || ""),
      role:"User",
      userType:"standard"
    };

    if(!isValidCreateUserName(payload.name)){
      setCreateUserStatus("Fullt navn må fylles ut.", "error");
      updateCreateUserSubmitState();
      return false;
    }

    if(!isValidCreateUserDisplayName(payload.displayName)){
      setCreateUserStatus("Navn i Handleliste må fylles ut.", "error");
      updateCreateUserSubmitState();
      return false;
    }

    if(!isValidCreateUserEmail(payload.email)){
      setCreateUserStatus("Gyldig e-postadresse må fylles ut.", "error");
      updateCreateUserSubmitState();
      return false;
    }

    if(!isValidCreateUserPhone(payload.phone)){
      setCreateUserStatus("Gyldig mobilnummer må fylles ut.", "error");
      updateCreateUserSubmitState();
      return false;
    }

    try{
      if(submitButton) submitButton.disabled = true;
      setCreateUserStatus("Oppretter bruker ...", "");
      await createStandardUserApi(payload);
      setCreateUserStatus("Brukeren er opprettet.", "success");
      setTimeout(closeCreateUserDialog, 900);
    }catch(error){
      setCreateUserStatus(`Kunne ikke opprette bruker. ${error && error.message ? error.message : ""}`.trim(), "error");
    }finally{
      if(submitButton) submitButton.disabled = false;
    }

    return false;
  }

  async function setupLoginWidget(){
    const loginStatus = document.getElementById("handlelisteLoginStatus");
    const loginMenu = document.getElementById("handlelisteLoginMenu");
    const loginMenuName = document.getElementById("handlelisteLoginMenuName");
    const logoutLink = document.getElementById("handlelisteLogoutLink");
    const createUserLink = document.getElementById("handlelisteCreateUserLink");

    if(!loginStatus || !loginMenu || !loginMenuName || !logoutLink){
      return;
    }

    const currentUser = await fetchCurrentUser();

    if(currentUser){
      const displayName = currentUser.name || currentUser.email || "Innlogget";
      loginStatus.textContent = getInitials(displayName) || "✓";
      loginStatus.href = "#";
      loginStatus.classList.remove("is-signin");
      loginStatus.classList.add("signed-in");
      loginStatus.title = displayName;
      loginMenuName.textContent = displayName;
      logoutLink.textContent = "Logge av";

      if(createUserLink){
        createUserLink.style.display = "block";
        createUserLink.onclick = openCreateUserDialog;
      }

      loginStatus.onclick = function(event){
        event.preventDefault();
        event.stopPropagation();
        const loginWidget = document.getElementById("handlelisteLoginWidget");
        const willOpen = !(loginWidget && loginWidget.classList.contains("open"));
        closeSettings();
        if(loginWidget){
          loginWidget.classList.toggle("open", willOpen);
        }
        if(loginMenu){
          loginMenu.style.display = willOpen ? "block" : "none";
        }
        return false;
      };

      logoutLink.onclick = function(event){
        event.preventDefault();
        performLogout();
        return false;
      };
    }else{
      const returnUrl = window.location.href;
      loginStatus.textContent = "↗";
      loginStatus.href = `${API_BASE}/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      loginStatus.classList.add("is-signin");
      loginStatus.classList.remove("signed-in");
      loginStatus.title = "Logg inn";
      loginStatus.onclick = null;
      loginMenu.style.display = "none";
      const loginWidget = document.getElementById("handlelisteLoginWidget");
      if(loginWidget) loginWidget.classList.remove("open");
      if(createUserLink){
        createUserLink.style.display = "none";
        createUserLink.onclick = null;
      }
    }
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
    const loginWidget = document.getElementById("handlelisteLoginWidget");
    const loginMenu = document.getElementById("handlelisteLoginMenu");

    if(wrap && wrap.classList.contains("open")){
      if(!event || !wrap.contains(event.target)){
        wrap.classList.remove("open");
      }
    }

    if(loginWidget && loginWidget.classList.contains("open")){
      if(!event || !loginWidget.contains(event.target)){
        loginWidget.classList.remove("open");
        if(loginMenu) loginMenu.style.display = "none";
      }
    }else if(loginMenu && loginMenu.style.display === "block"){
      if(!event || !loginWidget || !loginWidget.contains(event.target)){
        loginMenu.style.display = "none";
      }
    }
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
    `;

    renderCornerIcon();
    renderFloatingControls();
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
    runPageAction,
    renderFloatingControls,
    openCreateUserDialog,
    closeCreateUserDialog,
    submitCreateUserDialog
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
