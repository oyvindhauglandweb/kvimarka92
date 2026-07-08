/* activate-kvimarka-client-state.js
   Aktiverer trinn 1 for Kvimarka client-state.
   Kan kjøres én gang fra nettleseren eller legges midlertidig inn på en side.
*/
(function(){
  try{
    localStorage.setItem("kvimarka.clientState.enabled", "true");
    console.log("Kvimarka client-state er aktivert.");
    console.log("Reverser med: localStorage.removeItem('kvimarka.clientState.enabled')");

    if(document && document.body){
      var msg = document.createElement("div");
      msg.textContent = "Kvimarka client-state er aktivert. Refresh siden.";
      msg.style.position = "fixed";
      msg.style.left = "12px";
      msg.style.bottom = "12px";
      msg.style.zIndex = "999999";
      msg.style.padding = "10px 14px";
      msg.style.borderRadius = "8px";
      msg.style.background = "#245f73";
      msg.style.color = "#fff";
      msg.style.fontFamily = "Arial, sans-serif";
      msg.style.fontSize = "14px";
      msg.style.fontWeight = "bold";
      msg.style.boxShadow = "0 6px 20px rgba(0,0,0,.25)";
      document.body.appendChild(msg);
      setTimeout(function(){
        if(msg && msg.parentNode){
          msg.parentNode.removeChild(msg);
        }
      }, 6000);
    }
  }catch(error){
    console.error("Kunne ikke aktivere Kvimarka client-state:", error);
    alert("Kunne ikke aktivere Kvimarka client-state: " + (error && error.message ? error.message : error));
  }
})();
