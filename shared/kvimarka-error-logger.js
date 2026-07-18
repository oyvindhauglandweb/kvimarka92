/* Kvimarka 92 felles feillogger v2
   Produksjonsnavn: shared/kvimarka-error-logger.js */
(function(){
  "use strict";

  if(window.KvimarkaErrorLogger && window.KvimarkaErrorLogger.version){
    return;
  }

  const VERSION = "kvimarka-error-logger-v2-2026-07-18";
  const API_BASE = "https://api-kvimarka92.carstereogarage.com";
  const QUEUE_KEY = "kvimarka.errorLog.queue.v2";
  const MAX_QUEUE_LENGTH = 100;
  let flushPromise = null;

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

  function readQueue(){
    try{
      const value=JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]");
      return Array.isArray(value)?value:[];
    }catch(error){
      return [];
    }
  }

  function writeQueue(queue){
    try{
      localStorage.setItem(QUEUE_KEY,JSON.stringify((queue||[]).slice(-MAX_QUEUE_LENGTH)));
      return true;
    }catch(error){
      console.warn("Kunne ikke lagre feilloggkø lokalt.",error);
      return false;
    }
  }

  function queuePayload(payload){
    const queue=readQueue();
    queue.push({payload,queuedAt:new Date().toISOString(),attempts:0});
    writeQueue(queue);
  }

  function buildPayload(details){
    const data = details && typeof details === "object" ? details : {};
    const error = data.error instanceof Error ? data.error : null;
    const errorMessage = text(data.errorMessage || data.message || (error && error.message) || data.error || "Ukjent feil");
    if(!errorMessage)return null;

    return {
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
    };
  }

  async function sendPayload(payload){
    const response = await fetch(`${API_BASE}/error-log`, {
      method:"POST",
      credentials:"include",
      headers:{"Content-Type":"text/plain;charset=UTF-8"},
      body:JSON.stringify(payload)
    });

    if(!response.ok){
      const detail = await response.text().catch(() => "");
      const error=new Error(`Feilloggen svarte med HTTP ${response.status}${detail?`: ${detail}`:""}`);
      error.httpStatus=response.status;
      error.detail=detail;
      throw error;
    }

    return await response.json().catch(() => ({ success:true, status:response.status }));
  }

  async function flushQueue(){
    if(flushPromise)return flushPromise;
    flushPromise=(async function(){
      const queue=readQueue();
      if(!queue.length)return {success:true,sent:0,remaining:0};

      let sent=0;
      while(queue.length){
        const entry=queue[0];
        try{
          await sendPayload(entry.payload);
          queue.shift();
          sent+=1;
          writeQueue(queue);
        }catch(error){
          entry.attempts=Number(entry.attempts||0)+1;
          entry.lastAttemptAt=new Date().toISOString();
          entry.lastError=text(error&&error.message||error);
          writeQueue(queue);
          return {success:false,sent,remaining:queue.length,error};
        }
      }
      return {success:true,sent,remaining:0};
    })().finally(()=>{flushPromise=null;});
    return flushPromise;
  }

  async function log(details){
    const payload=buildPayload(details);
    if(!payload)return {skipped:true};

    try{
      await flushQueue();
      const result=await sendPayload(payload);
      return Object.assign({success:true,queued:false},result||{});
    }catch(logError){
      queuePayload(payload);
      console.warn("Feilen ble lagret lokalt og sendes til feilloggen når forbindelsen virker igjen.",logError);
      return {success:false,queued:true,error:logError};
    }
  }

  function globalErrorHandler(event){
    const target = event && event.target;
    if(target && target !== window){
      const source = target.src || target.href || "";
      if(source){
        void log({
          name:"Ressurs kunne ikke lastes",
          errorType:"Resource",
          errorMessage:`Kunne ikke laste ressurs: ${source}`,
          context:{ tagName:target.tagName || "", source }
        });
      }
      return;
    }

    const error = event && event.error;
    void log({
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
    void log({
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
    flushQueue,
    getQueuedCount:function(){return readQueue().length;},
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
  window.addEventListener("online",()=>{void flushQueue();});
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible")void flushQueue();
  });
  window.setTimeout(()=>{void flushQueue();},1500);
})();
