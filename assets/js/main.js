(function () {
  "use strict";

  /* ---------- Tema oscuro/claro ---------- */
  var THEME_KEY = "erconnectia-theme";
  var CONSENT_KEY = "erconnectia-consent";
  // Aviso de cookies: APAGADO mientras el sitio solo guarde la preferencia de tema (funcionalidad que el visitante pide al
  // pulsar el botón; no requiere consentimiento). Ponlo en true cuando se añada analítica/marketing (p. ej. GA4):
  // el aviso, el enlace "Preferencias de cookies" del pie y toda la lógica de consentimiento ya están listos.
  var COOKIE_BANNER = false;
  var root = document.documentElement;

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* modo privado o bloqueado: sin persistencia */ }
  }

  function safeRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* sin acceso al almacenamiento */ }
  }
  // La elección sobre cookies es lo único "necesario"; la preferencia de tema solo se guarda si el visitante la permite.
  function readConsent() {
    try { var c = JSON.parse(safeGet(CONSENT_KEY)); return c && c.v === 1 ? c : null; } catch (e) { return null; }
  }
  function prefsAllowed() { if (!COOKIE_BANNER) return true; var c = readConsent(); return !!(c && c.prefs); }
  safeRemove("iaechavarria-theme"); // clave del nombre anterior de la marca

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  }

  // El sitio siempre inicia en oscuro salvo que el visitante ya haya elegido claro antes.
  var stored = prefsAllowed() ? safeGet(THEME_KEY) : null;
  applyTheme(stored === "light" ? "light" : "dark");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = current === "light" ? "dark" : "light";
    applyTheme(next);
    if (prefsAllowed()) safeSet(THEME_KEY, next);
  });

  /* ---------- Aviso de cookies / almacenamiento técnico ---------- */
  (function () {
    if (!COOKIE_BANNER) {
      safeRemove(CONSENT_KEY); // sin aviso no hay elección que recordar
      [].forEach.call(document.querySelectorAll("[data-cookie-prefs]"), function (el) { (el.closest("li") || el).hidden = true; });
      return;
    }
    var isEn = document.documentElement.lang === "en";
    var T = isEn ? {
      label: "Cookie notice",
      title: "Cookies and technical storage",
      text: "We only use the technical storage needed for the site to work and to remember your choice. With your permission, we also save your preferences (light or dark theme). We don't use advertising or tracking cookies.",
      link: "Cookie policy", href: "/en/cookies/",
      accept: "Accept preferences", necessary: "Necessary only"
    } : {
      label: "Aviso de cookies",
      title: "Cookies y almacenamiento técnico",
      text: "Usamos únicamente el almacenamiento técnico necesario para que el sitio funcione y recuerde tu elección. Con tu permiso, también guardamos tus preferencias (tema claro u oscuro). No usamos cookies de publicidad ni de seguimiento.",
      link: "Política de cookies", href: "/cookies/",
      accept: "Aceptar preferencias", necessary: "Solo lo necesario"
    };
    var banner = null, firstBtn = null;

    function build() {
      banner = document.createElement("div");
      banner.className = "cookie-banner";
      banner.id = "cookie-banner";
      banner.setAttribute("role", "region");
      banner.setAttribute("aria-label", T.label);
      banner.hidden = true;
      var title = document.createElement("p");
      title.className = "cb-title";
      title.textContent = T.title;
      var text = document.createElement("p");
      text.className = "cb-text";
      text.appendChild(document.createTextNode(T.text + " "));
      var a = document.createElement("a");
      a.href = T.href;
      a.textContent = T.link;
      text.appendChild(a);
      var actions = document.createElement("div");
      actions.className = "cb-actions";
      firstBtn = document.createElement("button");
      firstBtn.type = "button";
      firstBtn.className = "btn";
      firstBtn.textContent = T.accept;
      firstBtn.addEventListener("click", function () { choose(true); });
      var second = document.createElement("button");
      second.type = "button";
      second.className = "btn btn-ghost";
      second.textContent = T.necessary;
      second.addEventListener("click", function () { choose(false); });
      actions.appendChild(firstBtn);
      actions.appendChild(second);
      banner.appendChild(title);
      banner.appendChild(text);
      banner.appendChild(actions);
      document.body.appendChild(banner);
    }
    function measure() {
      if (banner && !banner.hidden) root.style.setProperty("--cb-h", banner.offsetHeight + "px");
    }
    function show(focus) {
      if (!banner) build();
      banner.hidden = false;
      root.classList.add("has-cookie-banner");
      measure();
      if (focus && firstBtn) firstBtn.focus();
    }
    function hide() {
      if (banner) banner.hidden = true;
      root.classList.remove("has-cookie-banner");
      root.style.removeProperty("--cb-h");
    }
    function choose(prefs) {
      var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      safeSet(CONSENT_KEY, JSON.stringify({ v: 1, prefs: prefs, ts: new Date().toISOString() }));
      if (prefs) safeSet(THEME_KEY, current); else safeRemove(THEME_KEY);
      hide();
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-cookie-prefs]")) show(true);
    });
    window.addEventListener("resize", measure);
    if (!readConsent()) show(false);
  })();

  /* ---------- Menú móvil ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.getElementById("mobile-nav");
  if (navToggle && mobileNav) {
    var closeMobileNav = function () {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMobileNav();
    });
    document.addEventListener("click", function (e) {
      if (!mobileNav.classList.contains("is-open")) return;
      if (mobileNav.contains(e.target) || navToggle.contains(e.target)) return;
      closeMobileNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
    });
  }

  /* ---------- Barra de progreso de scroll ---------- */
  var progress = document.querySelector(".scroll-progress");
  function updateProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    progress.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();


  /* ---------- Titular revelado palabra por palabra ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var label = el.textContent.trim();
    var words = label.split(/\s+/);
    el.setAttribute("aria-label", label);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true" style="--i:' + i + '">' + w + "</span>";
    }).join(" ");
    el.classList.add("is-split");
  });

  /* ---------- Plataforma: pestañas, autoplay y contadores ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var numLocale = document.documentElement.lang === "en" ? "en-US" : "es-CO";

  function countUp(panel) {
    panel.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (reduceMotion) { el.textContent = target.toLocaleString(numLocale); return; }
      var start = null, dur = 1000;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString(numLocale);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  document.querySelectorAll("[data-platform]").forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var stage = root.querySelector(".pstage");
    var list = root.querySelector(".ptabs");
    var current = 0, touched = false, visible = false, timer = null;

    function show(i, focus) {
      current = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tabs[i].offsetLeft - 20, behavior: reduceMotion ? "auto" : "smooth" });
      }
      if (focus) tabs[i].focus();
      if (visible) countUp(panels[i]);
    }

    function stop() { touched = true; if (timer) { clearInterval(timer); timer = null; } }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { stop(); show(i, false); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = n - 1;
        if (next !== null) { e.preventDefault(); stop(); show(next, true); }
      });
    });

    function onVisible() {
      visible = true;
      stage.classList.add("in-view");
      countUp(panels[current]);
      if (!reduceMotion && !touched && !timer) {
        timer = setInterval(function () {
          if (!document.hidden) show((current + 1) % tabs.length, false);
        }, 7500);
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !visible) onVisible();
        });
      }, { threshold: 0.35 }).observe(stage);
    } else {
      onVisible();
    }
  });

  /* ---------- Demo del chat del hero: bucle ES/EN, con audios y agente de IA ---------- */
  var sim = document.getElementById("chat-sim");
  if (sim) {
    var simBody = sim.querySelector(".cs-body");
    var simBtns = [].slice.call(sim.querySelectorAll("[data-lang]"));
    var pageLang = document.documentElement.lang === "en" ? "en" : "es";
    var SIM_UI = {
      es: { pending: "Transcribiendo audio…", done: "Audio entendido" },
      en: { pending: "Transcribing audio…", done: "Audio understood" }
    };
    var SCENES = {
      es: [
        { who: "in", voice: "0:07", text: "Hola, quiero agendar una cita para esta semana" },
        { who: "out", text: "¡Hola! Con gusto te ayudo. Tengo cupo el jueves y el viernes. ¿Prefieres mañana o tarde?" },
        { who: "in", text: "Jueves en la tarde" },
        { who: "out", text: "Listo, quedas agendado el jueves a las 3:00 p.m. La confirmación te llega por aquí mismo." }
      ],
      en: [
        { who: "in", voice: "0:05", text: "Hi! Do you have availability next week?" },
        { who: "out", text: "Hi! Yes — Tuesday or Wednesday. Which works better for you?" },
        { who: "in", text: "Wednesday morning, please" },
        { who: "out", text: "Done! You're booked for Wednesday at 10:00 AM. You'll get a reminder right here." }
      ]
    };
    var simToken = 0, simPaused = false, simVisible = false, simCurrent = pageLang;

    function mk(tag, cls, txt) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (txt) n.textContent = txt;
      return n;
    }
    function icon(id) {
      var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("aria-hidden", "true");
      var u = document.createElementNS("http://www.w3.org/2000/svg", "use");
      u.setAttribute("href", "#" + id);
      s.appendChild(u);
      return s;
    }
    function bubble(step, lang, instant) {
      var b = mk("div", "msg " + step.who + (step.voice ? " voice" : ""));
      b.setAttribute("lang", lang);
      if (step.who === "out") b.appendChild(mk("em", "ai", "IA"));
      if (step.voice) {
        var play = mk("span", "vplay");
        play.appendChild(icon("i-play"));
        var wave = mk("span", "wave");
        for (var i = 0; i < 24; i++) {
          var bar = document.createElement("i");
          bar.style.setProperty("--h", (28 + ((i * 37 + 11) % 62)) + "%");
          bar.style.setProperty("--n", i);
          wave.appendChild(bar);
        }
        b.appendChild(play);
        b.appendChild(wave);
        b.appendChild(mk("span", "vtime", step.voice));
        var vt = mk("div", "vtext");
        vt.appendChild(icon("i-mic"));
        vt.appendChild(mk("span", "vt-label", ""));
        b.appendChild(vt);
        b._vt = vt;
        if (instant) { vt.classList.add("is-shown"); vt.lastChild.textContent = "“" + step.text + "”"; }
      } else {
        b.appendChild(document.createTextNode(step.text));
      }
      return b;
    }
    function typingEl() {
      var t = mk("div", "msg typing");
      t.setAttribute("aria-hidden", "true");
      t.appendChild(document.createElement("i"));
      t.appendChild(document.createElement("i"));
      t.appendChild(document.createElement("i"));
      return t;
    }
    function setLang(l) {
      simBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === l ? "true" : "false"); });
    }
    function wait(ms, my) {
      return new Promise(function (res) {
        var left = ms;
        (function tick() {
          if (my !== simToken) return res(false);
          if (left <= 0) return res(true);
          if (!(simPaused || !simVisible || document.hidden)) left -= 100;
          setTimeout(tick, 100);
        })();
      });
    }
    function renderStatic(lang) {
      simBody.textContent = "";
      SCENES[lang].forEach(function (s) { simBody.appendChild(bubble(s, lang, true)); });
      setLang(lang);
    }
    async function playVoice(b, step, lang, my) {
      b.classList.add("is-playing");
      if (!(await wait(1900, my))) return false;
      b.classList.remove("is-playing");
      var vt = b._vt;
      vt.classList.add("is-shown", "is-pending");
      vt.lastChild.textContent = SIM_UI[lang].pending;
      if (!(await wait(1000, my))) return false;
      vt.classList.remove("is-pending");
      vt.lastChild.textContent = "“" + step.text + "”";
      return wait(1300, my);
    }
    async function runLoop(my) {
      while (my === simToken) {
        simBody.classList.remove("is-fading");
        simBody.textContent = "";
        setLang(simCurrent);
        var steps = SCENES[simCurrent];
        for (var i = 0; i < steps.length; i++) {
          var s = steps[i];
          if (s.who === "out") {
            var ty = typingEl();
            simBody.appendChild(ty);
            if (!(await wait(1100, my))) return;
            ty.remove();
          } else if (i > 0) {
            if (!(await wait(800, my))) return;
          }
          var b = bubble(s, simCurrent, false);
          simBody.appendChild(b);
          if (s.voice) { if (!(await playVoice(b, s, simCurrent, my))) return; }
          else if (!(await wait(900 + s.text.length * 14, my))) return;
        }
        if (!(await wait(3200, my))) return;
        simBody.classList.add("is-fading");
        if (!(await wait(500, my))) return;
        simCurrent = simCurrent === "es" ? "en" : "es";
      }
    }
    var motionOK = !reduceMotion;
    var started = false;

    /* Altura exacta: la conversación completa (la más alta de las dos) siempre cabe, a cualquier ancho */
    function measureScene(lang, w) {
      var probe = mk("div", "cs-body");
      probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;height:auto;overflow:visible;justify-content:flex-start;width:" + w + "px";
      sim.appendChild(probe);
      SCENES[lang].forEach(function (s) { var m = bubble(s, lang, true); m.style.animation = "none"; probe.appendChild(m); });
      var h = probe.offsetHeight;
      probe.remove();
      return h;
    }
    function fitHeight() {
      var w = simBody.clientWidth;
      if (!w) return;
      simBody.style.height = Math.ceil(Math.max(measureScene("es", w), measureScene("en", w)) + 6) + "px";
    }
    var fitTimer;
    window.addEventListener("resize", function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitHeight, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeight);
    fitHeight();

    function startSim(lang) {
      simToken++;
      if (lang) simCurrent = lang;
      if (!motionOK) { renderStatic(simCurrent); return; }
      runLoop(simToken);
    }
    simBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { startSim(btn.getAttribute("data-lang")); });
    });

    /* Pausa para leer: solo con ratón (en pantallas táctiles no hay "salir del puntero", se quedaría congelado) o teclado */
    sim.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") simPaused = true; });
    sim.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") simPaused = false; });
    sim.addEventListener("focusin", function (e) { try { if (e.target.matches(":focus-visible")) simPaused = true; } catch (x) {} });
    sim.addEventListener("focusout", function () { simPaused = false; });

    /* Quien tiene activado "reducir movimiento" ve la conversación completa y puede reproducirla si quiere */
    if (!motionOK) {
      var pb = mk("button", "cs-playbtn", pageLang === "en" ? "Play demo" : "Reproducir demostración");
      pb.type = "button";
      pb.addEventListener("click", function () { motionOK = true; pb.remove(); startSim(); });
      simBody.parentNode.insertBefore(pb, simBody.nextSibling);
    }

    /* Cada vez que el chat entra en pantalla, la demostración arranca desde el audio inicial */
    function onVisible(v) {
      var was = simVisible;
      simVisible = v;
      if (v && !was && (!started || motionOK)) { started = true; startSim(); }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { onVisible(en.isIntersecting); });
      }, { threshold: 0.6 }).observe(simBody);
    } else {
      simVisible = true;
      startSim();
    }
  }

  /* ---------- Revelado al hacer scroll (uso puntual, no en todo) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var target = entry.target;
            target.classList.add("is-visible");
            if (target.querySelector("[data-count]")) countUp(target);
            target.addEventListener("transitionend", function done(ev) {
              if (ev.target !== target || ev.propertyName !== "transform") return;
              target.classList.add("reveal-done");
              target.removeEventListener("transitionend", done);
            });
            io.unobserve(target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();