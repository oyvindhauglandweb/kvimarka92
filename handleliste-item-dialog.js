(function(){
  "use strict";

  const state={config:{},suggestions:[],suggestionsLoaded:false,imageDataUrl:"",imageFileName:"",sourceItemId:0,sourceSuggestionId:0};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const clean=value=>String(value||"").trim();
  const key=value=>clean(value).replace(/\s+/g," ").toLowerCase();

  function config(){return state.config||{};}
  function apiBase(){return clean(config().apiBase||window.API_BASE||"https://api-kvimarka92.carstereogarage.com");}
  function getItems(){try{return (config().getItems&&config().getItems())||[];}catch(e){return [];}}
  function getOwners(){try{return (config().getOwners&&config().getOwners())||["Felles"];}catch(e){return ["Felles"];}}
  function getTypes(){try{return (config().getTypes&&config().getTypes())||[];}catch(e){return [];}}
  function defaultOwner(){try{return clean(config().getDefaultOwner&&config().getDefaultOwner())||"Felles";}catch(e){return "Felles";}}
  function resolveArea(type){try{return clean(config().resolveShoppingArea&&config().resolveShoppingArea(type))||type;}catch(e){return type;}}
  function canSetStandard(){try{return !!(config().canSetStandard&&config().canSetStandard());}catch(e){return false;}}
  function setHostStatus(message,type){try{if(config().setStatus)config().setStatus(message,type);}catch(e){}}

  async function fetchJson(url,options){
    const res=await fetch(url,Object.assign({credentials:"include"},options||{}));
    const text=await res.text();
    let data=null; try{data=text?JSON.parse(text):null;}catch(e){}
    if(!res.ok||(data&&data.error)) throw new Error((data&&(data.detail||data.error||data.message))||text||`HTTP ${res.status}`);
    return data||{};
  }

  function injectStyle(){
    if($("handlelisteItemDialogStyle"))return;
    const style=document.createElement("style");
    style.id="handlelisteItemDialogStyle";
    style.textContent=`
      .hid-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.72);z-index:10050}
      .hid-modal.open{display:flex}.hid-card{width:min(560px,100%);max-height:92vh;overflow:auto;background:var(--card,#202020);color:var(--text,#fff);border:1px solid var(--border,#555);border-radius:16px;padding:18px;box-shadow:0 20px 70px rgba(0,0,0,.55)}
      .hid-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.hid-title{font-size:24px;font-weight:800}.hid-close{width:42px;height:42px;border-radius:10px;border:1px solid var(--border,#555);background:var(--button,#303030);color:inherit;font-size:24px;font-weight:800}
      .hid-field{display:flex;flex-direction:column;gap:6px;margin:11px 0;position:relative}.hid-field label{font-weight:800}.hid-field input,.hid-field select{width:100%;min-height:42px;border:1px solid var(--border,#555);border-radius:9px;background:var(--button,#292929);color:inherit;padding:8px 11px;font:inherit;box-sizing:border-box}
      .hid-help{font-size:12px;color:var(--muted,#bbb)}.hid-check{display:flex;align-items:center;gap:10px;margin:10px 0;font-weight:700}.hid-check input{width:20px;height:20px}.hid-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}
      .hid-button{border:0;border-radius:9px;padding:10px 14px;background:var(--button,#303030);color:inherit;font-weight:800}.hid-button.primary{background:var(--primary,#2f7185);color:#fff}.hid-button:disabled{opacity:.55}
      .hid-suggestions{display:none;position:absolute;left:0;right:0;top:100%;max-height:260px;overflow:auto;background:var(--card,#202020);border:1px solid var(--border,#555);border-radius:9px;z-index:4;box-shadow:0 12px 30px rgba(0,0,0,.45)}.hid-suggestions.open{display:block}.hid-suggestion{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--border,#444);background:transparent;color:inherit;padding:9px 11px}.hid-suggestion:hover{background:rgba(255,255,255,.07)}.hid-suggestion small{display:block;color:var(--muted,#aaa);margin-top:2px}
      .hid-warning{font-size:12px;color:#ffb4b4;min-height:0}.hid-preview{display:none;gap:10px;align-items:center;margin:8px 0}.hid-preview.visible{display:flex}.hid-preview img{width:88px;height:88px;object-fit:contain;background:#fff;border-radius:9px}.hid-image-actions{display:grid;gap:8px}.hid-file{position:absolute;left:-10000px;width:1px;height:1px;opacity:0}
      @media(max-width:600px){.hid-card{padding:16px}.hid-title{font-size:22px}.hid-actions{justify-content:stretch}.hid-actions .hid-button{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function injectModal(){
    if($("handlelisteItemDialog"))return;
    injectStyle();
    const modal=document.createElement("div");
    modal.id="handlelisteItemDialog"; modal.className="hid-modal";
    modal.innerHTML=`<div class="hid-card" role="dialog" aria-modal="true" aria-labelledby="hidTitle" onclick="event.stopPropagation()">
      <div class="hid-head"><div class="hid-title" id="hidTitle">Legg til ny vare</div><button class="hid-close" type="button" id="hidClose" aria-label="Lukk">×</button></div>
      <form id="hidForm">
        <div class="hid-field"><label for="hidTechnical">Teknisk vare</label><input id="hidTechnical" type="text" autocomplete="off" placeholder="Søk i Teknisk navn / Matvaretabellen"><div class="hid-suggestions" id="hidSuggestions"></div></div>
        <div class="hid-field"><label for="hidName">Varenavn</label><input id="hidName" type="text" autocomplete="off" required><div class="hid-warning" id="hidDuplicate"></div></div>
        <div class="hid-field"><label for="hidOwner">Vareliste</label><select id="hidOwner"></select></div>
        <div class="hid-field"><label for="hidType">Varetype/butikk</label><select id="hidType"></select></div>
        <div class="hid-field" id="hidWebField"><label for="hidWeb">Web-link</label><input id="hidWeb" type="url" inputmode="url" autocomplete="url" placeholder="https://..."><div class="hid-help">Obligatorisk for varer i Netthandel.</div></div>
        <div class="hid-field"><label>Bilde av vare</label><input class="hid-file" id="hidImage" type="file" accept="image/*"><div class="hid-preview" id="hidPreview"><img id="hidPreviewImg" alt="Forhåndsvisning"><button class="hid-button" type="button" id="hidClearImage">Fjern bilde</button></div><div class="hid-image-actions"><label class="hid-button" for="hidImage">📷 Velg bilde lokalt</label><button class="hid-button" type="button" id="hidGoogle">🔎 Velg bilde i Google</button></div></div>
        <label class="hid-check" id="hidStandardRow"><input id="hidStandard" type="checkbox">Standard vare</label>
        <label class="hid-check"><input id="hidShouldBuy" type="checkbox" checked>Skal handles nå</label>
        <div class="hid-actions"><button class="hid-button" type="button" id="hidCancel">Avbryt</button><button class="hid-button primary" type="submit" id="hidSave">Lagre vare</button></div>
      </form></div>`;
    document.body.appendChild(modal);
    // Bevisst ingen klikk-handler på bakgrunnen: popupen skal ikke lukkes ved klikk utenfor.
    $("hidClose").addEventListener("click",close); $("hidCancel").addEventListener("click",close);
    $("hidTechnical").addEventListener("input",()=>{state.sourceItemId=0;state.sourceSuggestionId=0;clearImage();renderSuggestions();});
    $("hidTechnical").addEventListener("focus",()=>{ensureSuggestions();renderSuggestions();});
    $("hidTechnical").addEventListener("blur",()=>setTimeout(hideSuggestions,180));
    $("hidName").addEventListener("input",updateDuplicate);
    $("hidOwner").addEventListener("change",updateDuplicate);
    $("hidType").addEventListener("change",updateWebRequirement);
    $("hidImage").addEventListener("change",handleImage);
    $("hidClearImage").addEventListener("click",clearImage);
    $("hidGoogle").addEventListener("click",openGoogle);
    $("hidForm").addEventListener("submit",submit);
  }

  function unique(values){const out=[],seen=new Set();(values||[]).forEach(v=>{const t=clean(v);const k=key(t);if(t&&!seen.has(k)){seen.add(k);out.push(t);}});return out;}
  function populate(){
    const owners=unique(getOwners()); if(!owners.length)owners.push("Felles");
    $("hidOwner").innerHTML=owners.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
    const owner=defaultOwner(); if(owners.some(v=>key(v)===key(owner))) $("hidOwner").value=owners.find(v=>key(v)===key(owner));
    const types=unique(getTypes()); if(!types.length)types.push("Annet");
    $("hidType").innerHTML=types.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
    const preferred=clean(config().getDefaultType&&config().getDefaultType()); if(preferred&&types.some(v=>key(v)===key(preferred)))$("hidType").value=types.find(v=>key(v)===key(preferred));
    const allowed=canSetStandard(); $("hidStandard").disabled=!allowed; $("hidStandardRow").style.opacity=allowed?"1":".45"; $("hidStandardRow").title=allowed?"":"Bare administrator kan sette standardvare";
  }

  function open(){
    injectModal(); $("hidForm").reset(); state.sourceItemId=0;state.sourceSuggestionId=0;clearImage();hideSuggestions();populate();$("hidShouldBuy").checked=config().defaultShouldBuy!==false;updateWebRequirement();updateDuplicate();$("handlelisteItemDialog").classList.add("open");setTimeout(()=>$("hidTechnical").focus(),60);ensureSuggestions();
  }
  function close(){const m=$("handlelisteItemDialog");if(m)m.classList.remove("open");hideSuggestions();state.sourceItemId=0;state.sourceSuggestionId=0;}

  function technicalName(item){return clean(item&&(item.technicalName||item.technical_name||item["Teknisk navn"]||item.technical));}
  async function ensureSuggestions(){if(state.suggestionsLoaded)return state.suggestions;try{const d=await fetchJson(`${apiBase()}/shopping/item-suggestions`);state.suggestions=Array.isArray(d.suggestions)?d.suggestions:[];}catch(e){state.suggestions=[];}state.suggestionsLoaded=true;renderSuggestions();return state.suggestions;}
  function combined(){const out=[],seen=new Set();state.suggestions.forEach(i=>{const k="s:"+(i.id||key(technicalName(i)));if(!seen.has(k)){seen.add(k);out.push(Object.assign({},i,{_source:"suggestion"}));}});getItems().forEach(i=>{const k="i:"+(i.id||key(i.name));if(!seen.has(k)){seen.add(k);out.push(Object.assign({},i,{_source:"item"}));}});return out;}
  function renderSuggestions(){const q=key($("hidTechnical")&&$("hidTechnical").value);if(q.length<2){hideSuggestions();return;}const list=combined().filter(i=>key(technicalName(i)).includes(q)).sort((a,b)=>{const aa=key(technicalName(a)),bb=key(technicalName(b));return (aa.startsWith(q)?0:1)-(bb.startsWith(q)?0:1)||technicalName(a).localeCompare(technicalName(b),"no");}).slice(0,15);if(!list.length){hideSuggestions();return;}$("hidSuggestions").innerHTML=list.map((i,n)=>`<button type="button" class="hid-suggestion" data-index="${n}">${esc(technicalName(i)||i.name)}<small>${esc([i.name,i.type,i.owner].filter(Boolean).join(" · "))}</small></button>`).join("");$("hidSuggestions").classList.add("open");Array.from($("hidSuggestions").querySelectorAll("button")).forEach((b,n)=>b.addEventListener("mousedown",e=>{e.preventDefault();selectSuggestion(list[n]);}));}
  function hideSuggestions(){const b=$("hidSuggestions");if(b){b.classList.remove("open");b.innerHTML="";}}
  function selectSuggestion(item){const t=technicalName(item)||clean(item.name);$("hidTechnical").value=t;$("hidName").value=t;if(item.owner&&Array.from($("hidOwner").options).some(o=>key(o.value)===key(item.owner)))$("hidOwner").value=Array.from($("hidOwner").options).find(o=>key(o.value)===key(item.owner)).value;if(item.type&&Array.from($("hidType").options).some(o=>key(o.value)===key(item.type)))$("hidType").value=Array.from($("hidType").options).find(o=>key(o.value)===key(item.type)).value;$("hidWeb").value=clean(item.webUrl);$("hidStandard").checked=!!item.standardItem&&canSetStandard();state.sourceItemId=item._source==="item"?Number(item.id||0):0;state.sourceSuggestionId=item._source==="suggestion"?Number(item.id||0):0;const url=clean(item.thumbnailImageUrl||item.imageUrl||(item.image&&item.image.url));if(url){state.imageDataUrl="";state.imageFileName="";$("hidPreviewImg").src=url;$("hidPreview").classList.add("visible");}hideSuggestions();updateWebRequirement();updateDuplicate();}

  function duplicate(){const name=key($("hidName").value),owner=key($("hidOwner").value);return getItems().find(i=>key(i.name)===name&&key(i.owner||"Felles")===owner);}
  function updateDuplicate(){const d=duplicate();$("hidDuplicate").textContent=d?`Varen finnes allerede i ${$("hidOwner").value}.`:"";}
  function updateWebRequirement(){const net=key($("hidType").value)==="netthandel";$("hidWeb").required=net;$("hidWebField").style.display=net?"flex":"none";}
  function resizeImage(file,max=1200,quality=.82){return new Promise((resolve,reject)=>{if(!file||!/^image\//i.test(file.type||"")){reject(new Error("Velg en bildefil."));return;}const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*s));c.height=Math.max(1,Math.round(img.height*s));const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",quality));};img.onerror=()=>reject(new Error("Kunne ikke lese bildet."));img.src=r.result;};r.onerror=()=>reject(new Error("Kunne ikke lese bildet."));r.readAsDataURL(file);});}
  async function handleImage(e){const f=e.target.files&&e.target.files[0];if(!f){clearImage();return;}try{state.imageDataUrl=await resizeImage(f);state.imageFileName=f.name||"varebilde.jpg";$("hidPreviewImg").src=state.imageDataUrl;$("hidPreview").classList.add("visible");}catch(err){alert(err.message||String(err));clearImage();}}
  function clearImage(){state.imageDataUrl="";state.imageFileName="";if($("hidImage"))$("hidImage").value="";if($("hidPreview"))$("hidPreview").classList.remove("visible");if($("hidPreviewImg"))$("hidPreviewImg").removeAttribute("src");}
  function openGoogle(){const q=clean($("hidTechnical").value)||clean($("hidName").value);if(!q){alert("Skriv eller velg en vare først.");return;}window.open("https://www.google.com/search?tbm=isch&q="+encodeURIComponent(q+" matvare hvit bakgrunn"),"_blank","noopener,noreferrer");}

  async function submit(e){e.preventDefault();const name=clean($("hidName").value);if(!name){alert("Skriv inn varenavn.");return;}const d=duplicate();if(d&&!confirm(`Varen "${d.name}" finnes allerede i ${$("hidOwner").value}. Vil du likevel opprette en ny vare?`))return;const type=clean($("hidType").value)||"Annet";const body={name,owner:$("hidOwner").value,type,standardItem:!!$("hidStandard").checked,shouldBuy:!!$("hidShouldBuy").checked,sourceItemId:state.sourceItemId||undefined,sourceSuggestionId:state.sourceSuggestionId||undefined,webUrl:clean($("hidWeb").value),shoppingArea:resolveArea(type)};if(state.imageDataUrl){body.imageDataUrl=state.imageDataUrl;body.imageFileName=state.imageFileName||`${name}.jpg`;}const btn=$("hidSave");btn.disabled=true;try{await fetchJson(`${apiBase()}/shopping/item-create`,{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(body)});close();if(config().onSaved)await config().onSaved(name);else setHostStatus("Varen er lagt til.","success");}catch(err){setHostStatus(`Kunne ikke lagre varen.<br><br>${esc(err.message)}`,"error");}finally{btn.disabled=false;}}

  function configure(next){state.config=Object.assign({},state.config,next||{});injectModal();}
  window.HandlelisteItemDialog={configure,open,close};
  document.addEventListener("DOMContentLoaded",injectModal);
})();
