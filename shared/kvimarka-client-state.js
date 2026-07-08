/* Kvimarka client-state v1
   Parallelt og reversibelt klient-state-lag.
   Aktiv kun når localStorage["kvimarka.clientState.enabled"] === "true".
*/
(function(){
  "use strict";

  const FLAG_KEY = "kvimarka.clientState.enabled";
  const VERSION_KEY = "kvimarka.clientState.version";
  const PREFIX = "kvimarka.";
  const VERSION = "1.0.0-trinn1-2026-07-08";

  function hasStorage(){
    try{
      const testKey = "kvimarka.clientState.storageTest";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    }catch(error){
      return false;
    }
  }

  const storageAvailable = hasStorage();

  function isEnabled(){
    if(!storageAvailable) return false;
    try{
      return window.localStorage.getItem(FLAG_KEY) === "true";
    }catch(error){
      return false;
    }
  }

  function normalizeKey(key){
    const clean = String(key || "").trim();
    if(!clean) throw new Error("Mangler client-state-nøkkel");
    return clean.indexOf(PREFIX) === 0 ? clean : PREFIX + clean;
  }

  function get(key, defaultValue){
    if(!isEnabled()) return defaultValue;
    try{
      const raw = window.localStorage.getItem(normalizeKey(key));
      if(raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    }catch(error){
      return defaultValue;
    }
  }

  function set(key, value){
    if(!isEnabled()) return false;
    try{
      window.localStorage.setItem(normalizeKey(key), JSON.stringify(value));
      window.localStorage.setItem(VERSION_KEY, VERSION);
      return true;
    }catch(error){
      return false;
    }
  }

  function remove(key){
    if(!isEnabled()) return false;
    try{
      window.localStorage.removeItem(normalizeKey(key));
      return true;
    }catch(error){
      return false;
    }
  }

  function getBool(key, defaultValue){
    const value = get(key, !!defaultValue);
    if(typeof value === "boolean") return value;
    const text = String(value || "").trim().toLowerCase();
    if(["true","1","yes","ja","on"].includes(text)) return true;
    if(["false","0","no","nei","off"].includes(text)) return false;
    return !!defaultValue;
  }

  function setBool(key, value){
    return set(key, !!value);
  }

  window.KvimarkaClientState = {
    version: VERSION,
    flagKey: FLAG_KEY,
    isEnabled,
    get,
    set,
    remove,
    getBool,
    setBool
  };
})();
