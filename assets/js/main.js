(function () {
  "use strict";

  /* ---------- Tema oscuro/claro ---------- */
  var THEME_KEY = "iaechavarria-theme";
  var root = document.documentElement;

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* modo privado o bloqueado: sin persistencia */ }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  }

  // El sitio siempre inicia en oscuro salvo que el visitante ya haya elegido claro antes.
  var stored = safeGet(THEME_KEY);
  applyTheme(stored === "light" ? "light" : "dark");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = current === "light" ? "dark" : "light";
    applyTheme(next);
    safeSet(THEME_KEY, next);
  });

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

  /* ---------- Revelado al hacer scroll (uso puntual, no en todo) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
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