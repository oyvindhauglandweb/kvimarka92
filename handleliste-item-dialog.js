var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function () {
    "use strict";
    var state = { config: {}, suggestions: [], suggestionsLoaded: false, imageDataUrl: "", imageFileName: "", sourceItemId: 0, sourceSuggestionId: 0, standardPermission: null };
    var $ = function (id) { return document.getElementById(id); };
    var esc = function (value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); };
    var clean = function (value) { return String(value || "").trim(); };
    var key = function (value) { return clean(value).replace(/\s+/g, " ").toLowerCase(); };
    function config() { return state.config || {}; }
    function apiBase() { return clean(config().apiBase || window.API_BASE || "https://api-kvimarka92.carstereogarage.com"); }
    function getItems() { try {
        return (config().getItems && config().getItems()) || [];
    }
    catch (e) {
        return [];
    } }
    function getOwners() { try {
        return (config().getOwners && config().getOwners()) || ["Felles"];
    }
    catch (e) {
        return ["Felles"];
    } }
    function getTypes() { try {
        return (config().getTypes && config().getTypes()) || [];
    }
    catch (e) {
        return [];
    } }
    function defaultOwner() { try {
        return clean(config().getDefaultOwner && config().getDefaultOwner()) || "Felles";
    }
    catch (e) {
        return "Felles";
    } }
    function resolveArea(type) { try {
        return clean(config().resolveShoppingArea && config().resolveShoppingArea(type)) || type;
    }
    catch (e) {
        return type;
    } }
    function canSetStandard() {
        if (state.standardPermission === true)
            return true;
        try {
            return !!(config().canSetStandard && config().canSetStandard());
        }
        catch (e) {
            return false;
        }
    }
    function permissionText(value) { return clean(value).toLowerCase(); }
    function userCanSetStandard(user) {
        var _a, _b;
        var u = (user && user.currentUser) || user || {};
        var family = u.family || {};
        var role = permissionText(u.role || u.globalRole || u.userRole);
        var handlelisteRole = permissionText(u.handlelisteRole || u.handleliste_role || u.shoppingRole || ((_a = u.handleliste) === null || _a === void 0 ? void 0 : _a.role));
        var handlelisteAccess = permissionText(u.handlelisteAccess || u.handleliste_access || u.shoppingAccess || ((_b = u.handleliste) === null || _b === void 0 ? void 0 : _b.access));
        var memberRole = permissionText(family.memberRole || family.role || u.memberRole || u.familyMemberRole);
        return !!(u.isFamilyAdmin || u.familyAdmin || family.isFamilyAdmin) ||
            ["administrator", "admin", "supervisor"].includes(role) ||
            ["administrator", "admin", "family admin", "family_admin"].includes(handlelisteRole) ||
            handlelisteAccess === "admin" ||
            ["family admin", "family_admin", "administrator", "admin", "owner"].includes(memberRole);
    }
    function refreshStandardPermission() {
        return __awaiter(this, void 0, void 0, function () {
            var user, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetchJson("".concat(apiBase(), "/whoami"), { cache: "no-store" })];
                    case 1:
                        user = _a.sent();
                        state.standardPermission = userCanSetStandard(user);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        state.standardPermission = null;
                        return [3 /*break*/, 3];
                    case 3:
                        applyStandardPermission();
                        return [2 /*return*/, canSetStandard()];
                }
            });
        });
    }
    function applyStandardPermission() {
        var input = $("hidStandard"), row = $("hidStandardRow");
        if (!input || !row)
            return;
        var allowed = canSetStandard();
        input.disabled = !allowed;
        row.style.opacity = allowed ? "1" : ".45";
        row.title = allowed ? "" : "Bare administrator kan sette standardvare";
    }
    function setHostStatus(message, type) { try {
        if (config().setStatus)
            config().setStatus(message, type);
    }
    catch (e) { } }
    function fetchJson(url, options) {
        return __awaiter(this, void 0, void 0, function () {
            var res, text, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(url, Object.assign({ credentials: "include" }, options || {}))];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        data = null;
                        try {
                            data = text ? JSON.parse(text) : null;
                        }
                        catch (e) { }
                        if (!res.ok || (data && data.error))
                            throw new Error((data && (data.detail || data.error || data.message)) || text || "HTTP ".concat(res.status));
                        return [2 /*return*/, data || {}];
                }
            });
        });
    }
    function injectStyle() {
        if ($("handlelisteItemDialogStyle"))
            return;
        var style = document.createElement("style");
        style.id = "handlelisteItemDialogStyle";
        style.textContent = "\n      .hid-modal{position:fixed;top:0;right:0;bottom:0;left:0;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.72);z-index:10050}\n      .hid-modal.open{display:flex}.hid-card{width:100%;max-width:560px;box-sizing:border-box;max-height:92vh;overflow:auto;background:var(--card,#202020);color:var(--text,#fff);border:1px solid var(--border,#555);border-radius:16px;padding:18px;box-shadow:0 20px 70px rgba(0,0,0,.55)}\n      .hid-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.hid-title{font-size:24px;font-weight:800}.hid-close{width:42px;height:42px;border-radius:10px;border:1px solid var(--border,#555);background:var(--button,#303030);color:inherit;font-size:24px;font-weight:800}\n      .hid-field{display:flex;flex-direction:column;gap:6px;margin:11px 0;position:relative}.hid-field label{font-weight:800}.hid-field input,.hid-field select{width:100%;min-height:42px;border:1px solid var(--border,#555);border-radius:9px;background:var(--button,#292929);color:inherit;padding:8px 11px;font:inherit;box-sizing:border-box}\n      .hid-help{font-size:12px;color:var(--muted,#bbb)}.hid-check{display:flex;align-items:center;gap:10px;margin:10px 0;font-weight:700}.hid-check input{width:20px;height:20px}.hid-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}\n      .hid-button{border:0;border-radius:9px;padding:10px 14px;background:var(--button,#303030);color:inherit;font-weight:800}.hid-button.primary{background:var(--primary,#2f7185);color:#fff}.hid-button:disabled{opacity:.55}\n      .hid-suggestions{display:none;position:absolute;left:0;right:0;top:100%;max-height:260px;overflow:auto;background:var(--card,#202020);border:1px solid var(--border,#555);border-radius:9px;z-index:4;box-shadow:0 12px 30px rgba(0,0,0,.45)}.hid-suggestions.open{display:block}.hid-suggestion{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--border,#444);background:transparent;color:inherit;padding:9px 11px}.hid-suggestion:hover{background:rgba(255,255,255,.07)}.hid-suggestion small{display:block;color:var(--muted,#aaa);margin-top:2px}\n      .hid-warning{font-size:12px;color:#ffb4b4;min-height:0}.hid-preview{display:none;gap:10px;align-items:center;margin:8px 0}.hid-preview.visible{display:flex}.hid-preview img{width:88px;height:88px;object-fit:contain;background:#fff;border-radius:9px}.hid-image-actions{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.hid-image-actions .hid-button{align-self:flex-start}.hid-image-help{max-width:430px;font-size:12px;line-height:1.35;color:var(--muted,#bbb)}.hid-file{position:absolute;left:-10000px;width:1px;height:1px;opacity:0}\n      @media(max-width:600px){.hid-card{padding:16px}.hid-title{font-size:22px}.hid-actions{justify-content:stretch}.hid-actions .hid-button{flex:1}}\n    ";
        document.head.appendChild(style);
    }
    function injectModal() {
        if ($("handlelisteItemDialog"))
            return;
        injectStyle();
        var modal = document.createElement("div");
        modal.id = "handlelisteItemDialog";
        modal.className = "hid-modal";
        modal.innerHTML = "<div class=\"hid-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"hidTitle\" onclick=\"event.stopPropagation()\">\n      <div class=\"hid-head\"><div class=\"hid-title\" id=\"hidTitle\">Legg til ny vare</div><button class=\"hid-close\" type=\"button\" id=\"hidClose\" aria-label=\"Lukk\">\u00D7</button></div>\n      <form id=\"hidForm\">\n        <div class=\"hid-field\"><label for=\"hidTechnical\">Teknisk vare</label><input id=\"hidTechnical\" type=\"text\" autocomplete=\"off\" placeholder=\"S\u00F8k i Teknisk navn / Matvaretabellen\"><div class=\"hid-suggestions\" id=\"hidSuggestions\"></div></div>\n        <div class=\"hid-field\"><label for=\"hidName\">Varenavn</label><input id=\"hidName\" type=\"text\" autocomplete=\"off\" required><div class=\"hid-warning\" id=\"hidDuplicate\"></div></div>\n        <div class=\"hid-field\"><label for=\"hidOwner\">Vareliste</label><select id=\"hidOwner\"></select></div>\n        <div class=\"hid-field\"><label for=\"hidType\">Varetype/butikk</label><select id=\"hidType\"></select></div>\n        <div class=\"hid-field\" id=\"hidWebField\"><label for=\"hidWeb\">Web-link</label><input id=\"hidWeb\" type=\"url\" inputmode=\"url\" autocomplete=\"url\" placeholder=\"https://...\"><div class=\"hid-help\">Obligatorisk for varer i Netthandel.</div></div>\n        <div class=\"hid-field\"><label>Bilde av vare</label><input class=\"hid-file\" id=\"hidImage\" type=\"file\" accept=\"image/*\"><div class=\"hid-preview\" id=\"hidPreview\"><img id=\"hidPreviewImg\" alt=\"Forh\u00E5ndsvisning\"><button class=\"hid-button\" type=\"button\" id=\"hidClearImage\">Fjern bilde</button></div><div class=\"hid-image-actions\"><label class=\"hid-button\" for=\"hidImage\">\uD83D\uDCF7 Velg bilde lokalt</label><button class=\"hid-button\" type=\"button\" id=\"hidGoogle\">\uD83D\uDD0E Finn bilde i Google</button><div class=\"hid-image-help\">Lagre bildet p\u00E5 enheten og velg deretter \u00ABVelg bilde lokalt\u00BB.</div></div></div>\n        <label class=\"hid-check\" id=\"hidStandardRow\"><input id=\"hidStandard\" type=\"checkbox\">Standard vare</label>\n        <label class=\"hid-check\"><input id=\"hidShouldBuy\" type=\"checkbox\" checked>Skal handles n\u00E5</label>\n        <div class=\"hid-actions\"><button class=\"hid-button\" type=\"button\" id=\"hidCancel\">Avbryt</button><button class=\"hid-button primary\" type=\"submit\" id=\"hidSave\">Lagre vare</button></div>\n      </form></div>";
        document.body.appendChild(modal);
        // Bevisst ingen klikk-handler på bakgrunnen: popupen skal ikke lukkes ved klikk utenfor.
        $("hidClose").addEventListener("click", close);
        $("hidCancel").addEventListener("click", close);
        $("hidTechnical").addEventListener("input", function () { state.sourceItemId = 0; state.sourceSuggestionId = 0; clearImage(); renderSuggestions(); });
        $("hidTechnical").addEventListener("focus", function () { ensureSuggestions(); renderSuggestions(); });
        $("hidTechnical").addEventListener("blur", function () { return setTimeout(hideSuggestions, 180); });
        $("hidName").addEventListener("input", updateDuplicate);
        $("hidOwner").addEventListener("change", updateDuplicate);
        $("hidType").addEventListener("change", updateWebRequirement);
        $("hidImage").addEventListener("change", handleImage);
        $("hidClearImage").addEventListener("click", clearImage);
        $("hidGoogle").addEventListener("click", openGoogle);
        $("hidForm").addEventListener("submit", submit);
    }
    function unique(values) { var out = [], seen = new Set(); (values || []).forEach(function (v) { var t = clean(v); var k = key(t); if (t && !seen.has(k)) {
        seen.add(k);
        out.push(t);
    } }); return out; }
    function populate() {
        var owners = unique(getOwners());
        if (!owners.length)
            owners.push("Felles");
        $("hidOwner").innerHTML = owners.map(function (v) { return "<option value=\"".concat(esc(v), "\">").concat(esc(v), "</option>"); }).join("");
        var owner = defaultOwner();
        if (owners.some(function (v) { return key(v) === key(owner); }))
            $("hidOwner").value = owners.find(function (v) { return key(v) === key(owner); });
        var types = unique(getTypes());
        if (!types.length)
            types.push("Annet");
        $("hidType").innerHTML = types.map(function (v) { return "<option value=\"".concat(esc(v), "\">").concat(esc(v), "</option>"); }).join("");
        var preferred = clean(config().getDefaultType && config().getDefaultType());
        if (preferred && types.some(function (v) { return key(v) === key(preferred); }))
            $("hidType").value = types.find(function (v) { return key(v) === key(preferred); });
        applyStandardPermission();
    }
    function open() {
        injectModal();
        var form = $("hidForm");
        if (!form || !$("handlelisteItemDialog")) {
            setHostStatus("Kunne ikke åpne vinduet for ny vare.", "error");
            return;
        }
        form.reset();
        state.sourceItemId = 0;
        state.sourceSuggestionId = 0;
        clearImage();
        hideSuggestions();
        populate();
        $("hidShouldBuy").checked = config().defaultShouldBuy !== false;
        updateWebRequirement();
        updateDuplicate();
        $("handlelisteItemDialog").classList.add("open");
        setTimeout(function () {
            var input = $("hidTechnical");
            if (input) input.focus();
        }, 60);
        ensureSuggestions();
        refreshStandardPermission();
    }
    function close() { var m = $("handlelisteItemDialog"); if (m)
        m.classList.remove("open"); hideSuggestions(); state.sourceItemId = 0; state.sourceSuggestionId = 0; }
    function technicalName(item) { return clean(item && (item.technicalName || item.technical_name || item["Teknisk navn"] || item.technical)); }
    function ensureSuggestions() {
        return __awaiter(this, void 0, void 0, function () { var d, e_2; return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (state.suggestionsLoaded)
                        return [2 /*return*/, state.suggestions];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchJson("".concat(apiBase(), "/shopping/item-suggestions"))];
                case 2:
                    d = _a.sent();
                    state.suggestions = Array.isArray(d.suggestions) ? d.suggestions : [];
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    state.suggestions = [];
                    return [3 /*break*/, 4];
                case 4:
                    state.suggestionsLoaded = true;
                    renderSuggestions();
                    return [2 /*return*/, state.suggestions];
            }
        }); });
    }
    function combined() { var out = [], seen = new Set(); state.suggestions.forEach(function (i) { var k = "s:" + (i.id || key(technicalName(i))); if (!seen.has(k)) {
        seen.add(k);
        out.push(Object.assign({}, i, { _source: "suggestion" }));
    } }); getItems().forEach(function (i) { var k = "i:" + (i.id || key(i.name)); if (!seen.has(k)) {
        seen.add(k);
        out.push(Object.assign({}, i, { _source: "item" }));
    } }); return out; }
    function renderSuggestions() { var q = key($("hidTechnical") && $("hidTechnical").value); if (q.length < 2) {
        hideSuggestions();
        return;
    } var list = combined().filter(function (i) { return key(technicalName(i)).includes(q); }).sort(function (a, b) { var aa = key(technicalName(a)), bb = key(technicalName(b)); return (aa.startsWith(q) ? 0 : 1) - (bb.startsWith(q) ? 0 : 1) || technicalName(a).localeCompare(technicalName(b), "no"); }).slice(0, 15); if (!list.length) {
        hideSuggestions();
        return;
    } $("hidSuggestions").innerHTML = list.map(function (i, n) { return "<button type=\"button\" class=\"hid-suggestion\" data-index=\"".concat(n, "\">").concat(esc(technicalName(i) || i.name), "<small>").concat(esc([i.name, i.type, i.owner].filter(Boolean).join(" · ")), "</small></button>"); }).join(""); $("hidSuggestions").classList.add("open"); Array.from($("hidSuggestions").querySelectorAll("button")).forEach(function (b, n) { return b.addEventListener("mousedown", function (e) { e.preventDefault(); selectSuggestion(list[n]); }); }); }
    function hideSuggestions() { var b = $("hidSuggestions"); if (b) {
        b.classList.remove("open");
        b.innerHTML = "";
    } }
    function selectSuggestion(item) { var t = technicalName(item) || clean(item.name); $("hidTechnical").value = t; $("hidName").value = t; if (item.owner && Array.from($("hidOwner").options).some(function (o) { return key(o.value) === key(item.owner); }))
        $("hidOwner").value = Array.from($("hidOwner").options).find(function (o) { return key(o.value) === key(item.owner); }).value; if (item.type && Array.from($("hidType").options).some(function (o) { return key(o.value) === key(item.type); }))
        $("hidType").value = Array.from($("hidType").options).find(function (o) { return key(o.value) === key(item.type); }).value; $("hidWeb").value = clean(item.webUrl); $("hidStandard").checked = !!item.standardItem && canSetStandard(); state.sourceItemId = item._source === "item" ? Number(item.id || 0) : 0; state.sourceSuggestionId = item._source === "suggestion" ? Number(item.id || 0) : 0; var url = clean(item.thumbnailImageUrl || item.imageUrl || (item.image && item.image.url)); if (url) {
        state.imageDataUrl = "";
        state.imageFileName = "";
        $("hidPreviewImg").src = url;
        $("hidPreview").classList.add("visible");
    } hideSuggestions(); updateWebRequirement(); updateDuplicate(); }
    function duplicate() { var name = key($("hidName").value), owner = key($("hidOwner").value); return getItems().find(function (i) { return key(i.name) === name && key(i.owner || "Felles") === owner; }); }
    function updateDuplicate() { var d = duplicate(); $("hidDuplicate").textContent = d ? "Varen finnes allerede i ".concat($("hidOwner").value, ".") : ""; }
    function updateWebRequirement() {
        var net = key($("hidType").value) === "netthandel";
        $("hidWeb").required = net;
        $("hidWebField").style.display = "flex";
        var help = $("hidWebField").querySelector(".hid-help");
        if (help)
            help.textContent = net ? "Obligatorisk for varer i Netthandel." : "Valgfritt. Brukes for lenke til varen på nett.";
    }
    function resizeImage(file, max, quality) {
        if (max === void 0) { max = 1200; }
        if (quality === void 0) { quality = .82; }
        return new Promise(function (resolve, reject) { if (!file || !/^image\//i.test(file.type || "")) {
            reject(new Error("Velg en bildefil."));
            return;
        } var r = new FileReader(); r.onload = function () { var img = new Image(); img.onload = function () { var s = Math.min(1, max / Math.max(img.width, img.height)); var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s)); var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", quality)); }; img.onerror = function () { return reject(new Error("Kunne ikke lese bildet.")); }; img.src = r.result; }; r.onerror = function () { return reject(new Error("Kunne ikke lese bildet.")); }; r.readAsDataURL(file); });
    }
    function handleImage(e) {
        return __awaiter(this, void 0, void 0, function () { var f, _a, err_1; return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    f = e.target.files && e.target.files[0];
                    if (!f) {
                        clearImage();
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = state;
                    return [4 /*yield*/, resizeImage(f)];
                case 2:
                    _a.imageDataUrl = _b.sent();
                    state.imageFileName = f.name || "varebilde.jpg";
                    $("hidPreviewImg").src = state.imageDataUrl;
                    $("hidPreview").classList.add("visible");
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    alert(err_1.message || String(err_1));
                    clearImage();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        }); });
    }
    function clearImage() { state.imageDataUrl = ""; state.imageFileName = ""; if ($("hidImage"))
        $("hidImage").value = ""; if ($("hidPreview"))
        $("hidPreview").classList.remove("visible"); if ($("hidPreviewImg"))
        $("hidPreviewImg").removeAttribute("src"); }
    function openGoogle() { var q = clean($("hidTechnical").value) || clean($("hidName").value); if (!q) {
        alert("Skriv eller velg en vare først.");
        return;
    } window.open("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q + " matvare hvit bakgrunn"), "_blank", "noopener,noreferrer"); }
    function submit(e) {
        return __awaiter(this, void 0, void 0, function () { var name, d, type, body, btn, err_2; return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    name = clean($("hidName").value);
                    if (!name) {
                        alert("Skriv inn varenavn.");
                        return [2 /*return*/];
                    }
                    d = duplicate();
                    if (d && !confirm("Varen \"".concat(d.name, "\" finnes allerede i ").concat($("hidOwner").value, ". Vil du likevel opprette en ny vare?")))
                        return [2 /*return*/];
                    type = clean($("hidType").value) || "Annet";
                    body = { name: name, owner: $("hidOwner").value, type: type, standardItem: !!$("hidStandard").checked, shouldBuy: !!$("hidShouldBuy").checked, sourceItemId: state.sourceItemId || undefined, sourceSuggestionId: state.sourceSuggestionId || undefined, webUrl: clean($("hidWeb").value), shoppingArea: resolveArea(type) };
                    if (state.imageDataUrl) {
                        body.imageDataUrl = state.imageDataUrl;
                        body.imageFileName = state.imageFileName || "".concat(name, ".jpg");
                    }
                    btn = $("hidSave");
                    btn.disabled = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetchJson("".concat(apiBase(), "/shopping/item-create"), { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(body) })];
                case 2:
                    _a.sent();
                    close();
                    if (!config().onSaved) return [3 /*break*/, 4];
                    return [4 /*yield*/, config().onSaved(name)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    setHostStatus("Varen er lagt til.", "success");
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    err_2 = _a.sent();
                    setHostStatus("Kunne ikke lagre varen.<br><br>".concat(esc(err_2.message)), "error");
                    return [3 /*break*/, 8];
                case 7:
                    btn.disabled = false;
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        }); });
    }
    function configure(next) { state.config = Object.assign({}, state.config, next || {}); injectModal(); }
    window.HandlelisteItemDialog = { configure: configure, open: open, close: close };
    document.addEventListener("DOMContentLoaded", injectModal);
})();
