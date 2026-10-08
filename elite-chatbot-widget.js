/*!
 * Elite Airsoft - Widget de chatbot embebible
 * Uso (pegar antes de </body> en cualquier página, sin importar el dominio):
 *
 *   <script src="elite-chatbot-widget.js"
 *           data-webhook="https://TU-INSTANCIA.app.n8n.cloud/webhook/elite-chatbot"
 *           defer></script>
 *
 * Opciones por atributo: data-title, data-subtitle, data-accent, data-position ("right" | "left").
 * Requiere que el nodo Webhook de n8n tenga Allowed Origins (CORS) y el flujo esté publicado.
 */
(function () {
  "use strict";
  if (window.__eliteChatbotLoaded) return;
  window.__eliteChatbotLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();
  var cfg = {
    webhook: (script && script.getAttribute("data-webhook")) || window.ELITE_CHATBOT_WEBHOOK || "",
    title: (script && script.getAttribute("data-title")) || "Elite Airsoft",
    subtitle: (script && script.getAttribute("data-subtitle")) || "Asistente virtual",
    accent: (script && script.getAttribute("data-accent")) || "#e8631a",
    position: (script && script.getAttribute("data-position")) === "left" ? "left" : "right"
  };

  var GREETING = "Hola, soy el asistente de Elite Airsoft. Puedo ayudarte con precios, sedes, edades, cumpleaños y reservas. ¿En qué te puedo ayudar?";
  var CHIPS = ["Precios de Airsoft", "Precios de Hidrogel", "Quiero reservar", "Cumpleaños", "Hablar con una persona"];

  function store(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; }
  }
  function uid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  }
  var sessionId = store("elite_chat_sid") || uid();
  store("elite_chat_sid", sessionId);

  var host = document.createElement("div");
  host.id = "elite-chatbot-host";
  host.style.cssText = "position:fixed;z-index:2147483000;bottom:0;" + cfg.position + ":0;";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var css = "\
:host{all:initial}\
*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}\
.fab{position:fixed;bottom:20px;" + cfg.position + ":20px;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:" + cfg.accent + ";color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:transform .15s}\
.fab:hover{transform:scale(1.06)}\
.fab svg{width:28px;height:28px;fill:#fff}\
.panel{position:fixed;bottom:92px;" + cfg.position + ":20px;width:380px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100dvh - 120px);background:#14170f;color:#e9ecdf;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.45);display:none;flex-direction:column;overflow:hidden;border:1px solid #2b3020}\
.panel.open{display:flex}\
.head{background:linear-gradient(135deg,#232a17,#1a1f11);padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:3px solid " + cfg.accent + "}\
.head .t{font-weight:700;font-size:16px;letter-spacing:.3px;text-transform:uppercase}\
.head .s{font-size:12px;color:#aab392}\
.head .grow{flex:1}\
.icon-btn{background:none;border:0;color:#aab392;cursor:pointer;font-size:13px;padding:6px 8px;border-radius:6px}\
.icon-btn:hover{color:#fff;background:rgba(255,255,255,.08)}\
.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}\
.m{max-width:86%;padding:9px 13px;border-radius:14px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}\
.m.bot{align-self:flex-start;background:#222818;border:1px solid #2e3522;border-bottom-left-radius:4px}\
.m.user{align-self:flex-end;background:" + cfg.accent + ";color:#fff;border-bottom-right-radius:4px}\
.m.err{align-self:flex-start;background:#3a1a16;color:#ffb4a8;border:1px solid #5a2a22;border-bottom-left-radius:4px}\
.m a{color:#ffb27a;text-decoration:underline}\
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}\
.chip{background:transparent;border:1px solid " + cfg.accent + ";color:#ffd1ad;border-radius:999px;padding:6px 11px;font-size:12.5px;cursor:pointer}\
.chip:hover{background:" + cfg.accent + ";color:#fff}\
.dots{display:inline-flex;gap:4px;padding:2px 0}\
.dots i{width:7px;height:7px;border-radius:50%;background:#8b9576;animation:b 1s infinite}\
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}\
@keyframes b{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}\
form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #2b3020;background:#181c11}\
textarea{flex:1;resize:none;border:1px solid #333b25;background:#0f120a;color:#e9ecdf;border-radius:12px;padding:9px 12px;font-size:14.5px;max-height:110px;outline:none;font-family:inherit}\
textarea:focus{border-color:" + cfg.accent + "}\
.send{background:" + cfg.accent + ";color:#fff;border:0;border-radius:12px;padding:0 16px;font-weight:600;cursor:pointer;font-size:14px}\
.send:disabled{opacity:.5;cursor:not-allowed}\
.foot{font-size:10.5px;text-align:center;color:#6f7860;padding:0 0 6px;background:#181c11}\
@media(max-width:480px){.panel{width:calc(100vw - 16px);" + cfg.position + ":8px;bottom:84px;height:calc(100dvh - 100px)}}";

  root.innerHTML = "<style>" + css + "</style>\
<button class='fab' aria-label='Abrir chat'><svg viewBox='0 0 24 24'><path d='M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'/></svg></button>\
<section class='panel' role='dialog' aria-label='Chat de Elite Airsoft'>\
 <div class='head'><div><div class='t'></div><div class='s'></div></div><div class='grow'></div>\
  <button class='icon-btn' data-act='reset' title='Nueva conversación'>Nueva</button>\
  <button class='icon-btn' data-act='close' title='Cerrar'>&#10005;</button></div>\
 <div class='log' aria-live='polite'></div>\
 <form><textarea rows='1' placeholder='Escribe tu pregunta...' maxlength='1000'></textarea><button class='send' type='submit'>Enviar</button></form>\
 <div class='foot'>Las respuestas son informativas. La disponibilidad la confirma el equipo por WhatsApp.</div>\
</section>";

  var $ = function (s) { return root.querySelector(s); };
  var fab = $(".fab"), panel = $(".panel"), log = $(".log"), form = $("form"),
      input = $("textarea"), sendBtn = $(".send");
  $(".t").textContent = cfg.title;
  $(".s").textContent = cfg.subtitle;

  function linkify(el, text) {
    el.textContent = "";
    var re = /(https?:\/\/[^\s)]+)/g, last = 0, m;
    while ((m = re.exec(text)) !== null) {
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var url = m[1].replace(/[.,;]+$/, "");
      var a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = url;
      el.appendChild(a);
      last = m.index + m[1].length - (m[1].length - url.length);
      re.lastIndex = last;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }
  function clean(t) {
    return String(t).replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s*/gm, "").replace(/^\s*[-*]\s+/gm, "- ");
  }
  function add(text, cls) {
    var d = document.createElement("div");
    d.className = "m " + cls;
    if (cls === "bot") linkify(d, clean(text)); else d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function addChips() {
    var w = document.createElement("div");
    w.className = "chips";
    CHIPS.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c;
      b.addEventListener("click", function () { w.remove(); ask(c); });
      w.appendChild(b);
    });
    log.appendChild(w);
  }
  function start() {
    log.innerHTML = "";
    add(GREETING, "bot");
    addChips();
  }

  var busy = false;
  async function ask(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    var chips = log.querySelector(".chips"); if (chips) chips.remove();
    add(text, "user");
    busy = true; sendBtn.disabled = true;
    var b = document.createElement("div");
    b.className = "m bot"; b.innerHTML = "<span class='dots'><i></i><i></i><i></i></span>";
    log.appendChild(b); log.scrollTop = log.scrollHeight;
    try {
      if (!cfg.webhook) throw new Error("Falta configurar data-webhook en el script del chatbot.");
      var ctrl = new AbortController();
      var to = setTimeout(function () { ctrl.abort(); }, 60000);
      var res = await fetch(cfg.webhook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId, chatInput: text }), signal: ctrl.signal
      });
      clearTimeout(to);
      if (!res.ok) throw new Error("El servicio respondió con el código " + res.status + ".");
      var data = await res.json();
      var out = Array.isArray(data) ? data[0] : data;
      var answer = (out && (out.output || out.text || out.response)) || "No pude generar una respuesta. Intenta de nuevo.";
      b.className = "m bot"; linkify(b, clean(answer));
    } catch (e) {
      b.className = "m err";
      b.textContent = e.name === "AbortError" ? "La respuesta tardó demasiado. Intenta de nuevo."
        : (e.message && e.message.indexOf("Failed to fetch") > -1) ? "No se pudo conectar con el asistente. Intenta de nuevo en unos minutos."
        : (e.message || "Ocurrió un error.");
    } finally {
      busy = false; sendBtn.disabled = false; log.scrollTop = log.scrollHeight; input.focus();
    }
  }

  function toggle(open) {
    var willOpen = open === undefined ? !panel.classList.contains("open") : open;
    panel.classList.toggle("open", willOpen);
    if (willOpen) { if (!log.children.length) start(); setTimeout(function () { input.focus(); }, 50); }
  }
  fab.addEventListener("click", function () { toggle(); });
  root.querySelector("[data-act=close]").addEventListener("click", function () { toggle(false); });
  root.querySelector("[data-act=reset]").addEventListener("click", function () {
    sessionId = uid(); store("elite_chat_sid", sessionId); start();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); var t = input.value; input.value = ""; input.style.height = "auto"; ask(t); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 110) + "px"; });

  window.EliteChatbot = { open: function () { toggle(true); }, close: function () { toggle(false); } };
})();
