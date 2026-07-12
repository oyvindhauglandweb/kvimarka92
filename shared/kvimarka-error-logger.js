/* Kvimarka 92 felles feillogger v1
   Produksjonsnavn: shared/kvimarka-error-logger.js */
(function(){
  "use strict";

  if(window.KvimarkaErrorLogger && window.KvimarkaErrorLogger.version){
    return;
  }

  const VERSION = "kvimarka-error-logger-v1-2026-07-12";
  const API_BASE = "https://api-kvimarka92.carstereogarage.com";
  let isSending = false;

  function text(value){
    return String(value == null ? "" : value).trim();
  }

  function detectDevice(){
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const touchPoints = Number(navigator.maxTouchPoints || 0);

    if(/iPad/i.test(ua) || (platform === "MacIntel" && touchPoints > 1)) return "Nettbrett";
    if(/Tablet|Android(?!.*Mobile)/i.test(ua)) return "Nettbrett";
    if(/iPhone|iPod|Android.*Mobile|Mobile/i.test(ua)) return "Mobil";
    return "PC";
  }

  function detectBrowser(){
    const ua = navigator.userAgent || "";
    let match;

    if((match = ua.match(/Edg\/([\d.]+)/i))) return `Edge ${match[1]}`;
    if((match = ua.match(/OPR\/([\d.]+)/i))) return `Opera ${match[1]}`;
    if((match = ua.match(/Firefox\/([\d.]+)/i))) return `Firefox ${match[1]}`;
    if((match = ua.match(/CriOS\/([\d.]+)/i))) return `Chrome ${match[1]}`;
    if((match = ua.match(/Chrome\/([\d.]+)/i))) return `Chrome ${match[1]}`;
    if((match = ua.match(/FxiOS\/([\d.]+)/i))) return `Firefox ${match[1]}`;
    if((match = ua.match(/Version\/([\d.]+).*Safari/i))) return `Safari ${match[1]}`;
    return navigator.appName || "Ukjent";
  }

  function detectOperatingSystem(){
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const touchPoints = Number(navigator.maxTouchPoints || 0);
    let match;

    if((match = ua.match(/Windows NT ([\d.]+)/i))){
      const names = {
        "10.0":"Windows 10/11",
        "6.3":"Windows 8.1",
        "6.2":"Windows 8",
        "6.1":"Windows 7"
      };
      return names[match[1]] || `Windows NT ${match[1]}`;
    }

    if(/iPad|iPhone|iPod/i.test(ua) || (platform === "MacIntel" && touchPoints > 1)){
      match = ua.match(/OS (\d+)[._](\d+)(?:[._](\d+))?/i);
      const version = match ? [match[1], match[2], match[3]].filter(Boolean).join(".") : "";
      const osName = (/iPad/i.test(ua) || (platform === "MacIntel" && touchPoints > 1)) ? "iPadOS" : "iOS";
      return version ? `${osName} ${version}` : osName;
    }

    if((match = ua.match(/Android\s+([\d.]+)/i))) return `Android ${match[1]}`;
    if((match = ua.match(/Mac OS X\s+([\d_]+)/i))) return `macOS ${match[1].replace(/_/g, ".")}`;
    if(/Linux/i.test(ua)) return "Linux";
    return platform || "Ukjent";
  }

  function detectApplication(){
    const page = (location.pathname.split("/").pop() || "").toLowerCase();
    if(page.startsWith("handleliste-") || (page === "help.html" && /(?:^|[?&])case=handleliste(?:&|$)/i.test(location.search))){
      return "Handleliste";
    }
    if(location.hostname.startsWith("opplevelser.")) return "Opplevelser";
    if(location.hostname.includes("carstereogarage.com")) return "Kvimarka 92";
    return "Kvimarka 92";
  }

  function pageName(){
    return location.pathname.split("/").pop() || location.pathname || "ukjent side";
  }

  async function log(details){
    const data = details && typeof details === "object" ? details : {};
    const error = data.error instanceof Error ? data.error : null;
    const errorMessage = text(data.errorMessage || data.message || (error && error.message) || data.error || "Ukjent feil");

    if(!errorMessage || isSending) return { skipped:true };

    isSending = true;
    try{
      const response = await fetch(`${API_BASE}/error-log`, {
        method:"POST",
        credentials:"include",
        headers:{"Content-Type":"text/plain;charset=UTF-8"},
        body:JSON.stringify({
          name:text(data.name) || errorMessage.slice(0, 180),
          application:text(data.application) || detectApplication(),
          page:text(data.page) || pageName(),
          errorMessage,
          errorType:text(data.errorType) || "JavaScript",
          stackTrace:text(data.stackTrace || (error && error.stack)),
          context:data.context || {},
          occurredAt:data.occurredAt || new Date().toISOString(),
          device:detectDevice(),
          browser:detectBrowser(),
          operatingSystem:detectOperatingSystem(),
          fingerprint:text(data.fingerprint)
        })
      });

      if(!response.ok){
        const detail = await response.text().catch(() => "");
        console.warn("Feilloggen svarte med feil.", response.status, detail);
        return { success:false, status:response.status, detail };
      }

      return await response.json().catch(() => ({ success:true, status:response.status }));
    }catch(logError){
      console.warn("Kunne ikke registrere feil i feilloggen.", logError);
      return { success:false, error:logError };
    }finally{
      isSending = false;
    }
  }

  function globalErrorHandler(event){
    const target = event && event.target;
    if(target && target !== window){
      const source = target.src || target.href || "";
      if(source){
        log({
          name:"Ressurs kunne ikke lastes",
          errorType:"Resource",
          errorMessage:`Kunne ikke laste ressurs: ${source}`,
          context:{ tagName:target.tagName || "", source }
        });
      }
      return;
    }

    const error = event && event.error;
    log({
      name:"Ubehandlet JavaScript-feil",
      errorType:"JavaScript",
      error,
      errorMessage:(event && event.message) || (error && error.message) || "Ubehandlet JavaScript-feil",
      stackTrace:error && error.stack,
      context:{
        filename:event && event.filename || "",
        line:event && event.lineno || null,
        column:event && event.colno || null
      }
    });
  }

  function rejectionHandler(event){
    const reason = event && event.reason;
    const error = reason instanceof Error ? reason : null;
    log({
      name:"Ubehandlet promise-feil",
      errorType:"Unhandled promise",
      error,
      errorMessage:(error && error.message) || text(reason) || "Ubehandlet promise-feil",
      stackTrace:error && error.stack,
      context:{ reasonType:typeof reason }
    });
  }

  window.KvimarkaErrorLogger = {
    version:VERSION,
    log,
    detectDevice,
    detectBrowser,
    detectOperatingSystem,
    getEnvironment:function(){
      return {
        device:detectDevice(),
        browser:detectBrowser(),
        operatingSystem:detectOperatingSystem()
      };
    }
  };

  window.addEventListener("error", globalErrorHandler, true);
  window.addEventListener("unhandledrejection", rejectionHandler);
})();
