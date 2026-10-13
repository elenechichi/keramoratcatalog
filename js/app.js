(function () {
  "use strict";

  var state = { category: "all", categories: [], products: [], settings: {} };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var gridEl = $("tile-grid");
  var filtersEl = $("filters");
  var emptyEl = $("empty-state");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ================= INTRO =================
  function finishIntro() {
    document.body.classList.add("loaded");
    document.body.classList.remove("is-loading");
  }
  var introSeen = false;
  try { introSeen = sessionStorage.getItem("ka-intro") === "1"; sessionStorage.setItem("ka-intro", "1"); } catch (e) {}
  if (reduceMotion || introSeen) { $("intro").style.display = "none"; finishIntro(); }
  else setTimeout(finishIntro, 1500);

  // ================= PRICING =================
  function num(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }
  function tiers() {
    return {
      t1: num(state.settings.price_tier1, 850),
      t2: num(state.settings.price_tier2, 1250),
      wall: num(state.settings.price_wall, 150),
      extraBasin: num(state.settings.price_extra_basin, 350),
      wallExtra: num(state.settings.price_wall_extra_basin, 50)
    };
  }
  function priceForCm(cm) {
    var t = tiers();
    if (!cm || cm <= 0) return null;
    if (cm <= 120) return t.t1;
    if (cm <= 160) return t.t2;
    return null;
  }
  function catOf(id) { return state.categories.filter(function (x) { return x.id === id; })[0] || {}; }
  function catPrice(id) { var c = catOf(id); return c.price ? num(c.price, null) : null; }
  function isFixedCat(id) { return !!catPrice(id); }
  function basinsOf(catId) { return Math.max(1, num(catOf(catId).basins, 1)); }
  function minCmOf(catId) { return num(catOf(catId).min_cm, 0); }
  // price for a category + length (single source of truth for tiles, panel, calculator, form)
  function priceFor(catId, cm) {
    var fixed = catPrice(catId);
    if (fixed) return fixed;
    var base = priceForCm(cm);
    if (!base) return null;
    return base + (basinsOf(catId) - 1) * tiers().extraBasin;
  }
  function mountFor(catId) {
    if (isFixedCat(catId)) return null;
    var t = tiers();
    return t.wall + (basinsOf(catId) - 1) * t.wallExtra;
  }
  function priceOf(p) { return p.price ? p.price : priceFor(p.category, p.length_cm); }
  function rangeText(cm) {
    return cm <= 120 ? "კედლის გასწვრივ სიგრძეში 1.2 მეტრამდე" : "კედლის გასწვრივ სიგრძეში 1.2-დან 1.6 მეტრამდე";
  }
  function sizeText(p) {
    if (!p.length_cm) return p.size || "ინდივიდუალური ზომა";
    var parts = [p.length_cm, p.depth_cm, p.height_cm].filter(Boolean);
    return "≈ " + parts.join(" × ") + " სმ";
  }
  function fmt(n) { return String(n); }

  // ================= HELPERS =================
  function imagesOf(p) { return (p.images && p.images.length) ? p.images : []; }
  function coverOf(p) { return imagesOf(p)[0] || "assets/logo-mark.svg"; }
  function categoryLabel(id) {
    var c = state.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : "";
  }
  function countFor(id) {
    return id === "all" ? state.products.length : state.products.filter(function (p) { return p.category === id; }).length;
  }

  // ================= SPLIT TITLES =================
  $$(".split-title").forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w"><span style="--i:' + i + '">' + esc(w) + "</span></span>";
    }).join(" ");
  });

  // ================= REVEAL ON SCROLL =================
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }) : null;

  function observe(el) { if (io) io.observe(el); else el.classList.add("in"); }
  $$(".reveal, .split-title, .section-head").forEach(observe);

  // ================= COUNTERS =================
  function countUp(el) {
    var target = num(el.dataset.count, 0), suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, dur = 1600;
    function step(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(target * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function startCounters() {
    $$(".hero-stat .num").forEach(function (el) { setTimeout(function () { countUp(el); }, reduceMotion ? 0 : 900); });
  }

  // ================= FILTERS =================
  function moveInk() {
    var active = filtersEl.querySelector('[aria-pressed="true"]');
    var ink = $("filter-ink");
    if (!active || !ink) return;
    ink.style.width = active.offsetWidth + "px";
    ink.style.height = active.offsetHeight + "px";
    ink.style.transform = "translate(" + active.offsetLeft + "px," + active.offsetTop + "px)";
  }

  function renderFilters() {
    var all = [{ id: "all", label: "ყველა" }].concat(state.categories.filter(function (c) { return countFor(c.id) > 0; }));
    $$(".filter-btn", filtersEl).forEach(function (b) { b.remove(); });
    all.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(state.category === cat.id));
      btn.innerHTML = esc(cat.label) + '<span class="count">' + countFor(cat.id) + "</span>";
      btn.addEventListener("click", function () { setCategory(cat.id); });
      filtersEl.appendChild(btn);
    });
    requestAnimationFrame(moveInk);
  }
  window.addEventListener("resize", moveInk);

  function setCategory(id) {
    if (id === state.category) return;
    state.category = id;
    $$(".filter-btn", filtersEl).forEach(function (b, i) {
      var cats = ["all"].concat(state.categories.filter(function (c) { return countFor(c.id) > 0; }).map(function (c) { return c.id; }));
      b.setAttribute("aria-pressed", String(cats[i] === id));
    });
    moveInk();
    var tiles = $$(".tile", gridEl);
    if (reduceMotion || !tiles.length) { renderGrid(); return; }
    tiles.forEach(function (t) { t.classList.add("out"); });
    setTimeout(renderGrid, 260);
  }

  // ================= GRID =================
  var arrowSvg = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function renderGrid() {
    var list = state.category === "all" ? state.products
      : state.products.filter(function (p) { return p.category === state.category; });
    gridEl.innerHTML = "";
    emptyEl.hidden = list.length !== 0;

    list.forEach(function (p, i) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.style.setProperty("--d", (i % 3) * 0.1 + "s");
      var price = priceOf(p);
      tile.setAttribute("aria-label", p.name + " — " + sizeText(p) + (price ? " — " + price + " ლარი" : ""));
      var n = imagesOf(p).length;
      tile.innerHTML =
        '<div class="tile-media">' +
          (p.washer ? '<span class="tile-badge">სარეცხ მანქანაზე</span>' : "") +
          (n > 1 ? '<span class="tile-count"><svg viewBox="0 0 24 24"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/></svg>' + n + "</span>" : "") +
          '<img src="' + esc(coverOf(p)) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          (price
            ? '<span class="tile-price"><small>ფასი</small>' + fmt(price) + " ₾</span>"
            : '<span class="tile-price custom">ფასი შეთანხმებით</span>') +
          '<span class="tile-view">' + arrowSvg + "</span>" +
        "</div>" +
        '<div class="tile-body">' +
          '<p class="tile-collection">' + esc(categoryLabel(p.category)) + "</p>" +
          '<h3 class="tile-name">' + esc(p.name) + "</h3>" +
          '<p class="tile-meta"><span class="size">' + esc(sizeText(p)) + "</span>" + (p.material ? "<span>" + esc(p.material) + "</span>" : "") + "</p>" +
        "</div>";
      var img = tile.querySelector("img");
      if (img.complete) img.classList.add("loaded"); else img.addEventListener("load", function () { img.classList.add("loaded"); });
      tile.addEventListener("click", function () { openPanel(p); });
      if (finePointer && !reduceMotion) addTilt(tile);
      gridEl.appendChild(tile);
      observe(tile);
    });
  }

  function addTilt(el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.transform = "rotateY(" + ((x - .5) * 10) + "deg) rotateX(" + ((.5 - y) * 10) + "deg) translateY(-6px)";
      var m = el.querySelector(".tile-media");
      m.style.setProperty("--gx", x * 100 + "%");
      m.style.setProperty("--gy", y * 100 + "%");
    });
    el.addEventListener("pointerleave", function () {
      el.classList.remove("tilting");
      el.style.transform = "";
    });
  }

  // ================= HERO MOSAIC =================
  function renderMosaic() {
    var withImg = state.products.filter(function (p) { return imagesOf(p).length; });
    var pool = withImg.filter(function (p) { return p.featured; }).concat(withImg.filter(function (p) { return !p.featured; }));
    $$("#hero-mosaic .m img").forEach(function (img, i) { if (pool[i]) img.src = coverOf(pool[i]); });
  }

  if (finePointer && !reduceMotion) {
    var hero = $("hero"), layers = $$("[data-depth]", hero), raf = null, mx = 0, my = 0;
    hero.addEventListener("pointermove", function (e) {
      mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        layers.forEach(function (l) {
          var d = num(l.dataset.depth, 10);
          l.style.translate = (-mx * d) + "px " + (-my * d) + "px";
        });
      });
    });
  }

  // ================= MAGNETIC BUTTONS =================
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .18) + "px," + ((e.clientY - r.top - r.height / 2) * .3) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  // ================= SCROLL EFFECTS =================
  var progress = $("scroll-progress"), header = $("site-header");
  var washerImg = document.querySelector(".washer-feature-media img");
  var navLinks = $$('.main-nav a[href^="#"]:not(.btn)');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    header.classList.toggle("scrolled", y > 10);
    if (washerImg && !reduceMotion) {
      var r = washerImg.parentNode.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var k = (r.top + r.height) / (window.innerHeight + r.height);
        washerImg.style.transform = "translateY(" + (-(1 - k) * 20) + "%)";
      }
    }
    var current = null;
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s && s.getBoundingClientRect().top < window.innerHeight * .4) current = a;
    });
    navLinks.forEach(function (a) { a.classList.toggle("active", a === current); });
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ================= GALLERY / PANEL =================
  var panel = $("product-panel"), overlay = $("panel-overlay"), panelClose = $("panel-close");
  var lastFocused = null, gal = { images: [], index: 0, name: "" };

  function showImage(i) {
    var n = gal.images.length;
    if (!n) return;
    gal.index = (i + n) % n;
    var img = $("panel-img");
    img.classList.remove("loaded");
    img.onload = function () { img.classList.add("loaded"); };
    img.src = gal.images[gal.index];
    if (img.complete) img.classList.add("loaded");
    img.alt = gal.name + " — ფოტო " + (gal.index + 1);
    $("g-counter").textContent = n > 1 ? (gal.index + 1) + " / " + n : "";
    $("g-prev").hidden = $("g-next").hidden = n < 2;
    $$(".thumb", $("gallery-thumbs")).forEach(function (t, k) {
      t.setAttribute("aria-current", String(k === gal.index));
      if (k === gal.index) t.scrollIntoView({ block: "nearest", inline: "center" });
    });
    if (!$("lightbox").hidden) showLightbox();
  }

  function renderThumbs() {
    var wrap = $("gallery-thumbs");
    wrap.innerHTML = "";
    wrap.hidden = gal.images.length < 2;
    gal.images.forEach(function (src, k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "thumb";
      b.setAttribute("aria-label", "ფოტო " + (k + 1));
      b.innerHTML = '<img src="' + esc(src) + '" alt="" loading="lazy">';
      b.addEventListener("click", function () { showImage(k); });
      wrap.appendChild(b);
    });
  }

  function openPanel(p) {
    gal = { images: imagesOf(p).length ? imagesOf(p) : [coverOf(p)], index: 0, name: p.name };
    renderThumbs();
    showImage(0);
    $("panel-collection").textContent = categoryLabel(p.category);
    $("panel-title").textContent = p.name;
    $("panel-size").textContent = sizeText(p) + (p.size && p.length_cm ? " · " + p.size : "");
    $("panel-material").textContent = p.material || "—";
    $("panel-color").textContent = p.color || "—";
    $("panel-note").textContent = p.note || "";
    $("panel-note").hidden = !p.note;

    var price = priceOf(p), pp = $("panel-price"), mount = mountFor(p.category), nb = basinsOf(p.category);
    pp.classList.toggle("custom", !price);
    pp.innerHTML = price
      ? '<div class="pp-main">' + fmt(price) + "<span> ₾</span></div>" +
        (isFixedCat(p.category) && !p.price
          ? '<div class="pp-side">' + esc(categoryLabel(p.category)) + "<br>ფიქსირებული ფასი, ნებისმიერი ზომა</div>"
          : '<div class="pp-side">' + (p.length_cm ? rangeText(p.length_cm) : "") + (nb > 1 ? " · " + nb + " ვანა" : "") +
            "<br>მიტანა და კედელზე კაპიტალურად მიყენება <b>+" + mount + " ₾</b></div>")
      : '<div class="pp-main">ფასი შეთანხმებით</div><div class="pp-side">კედლის გასწვრივ 1.6 მ-ზე მეტი ან<br>ინდივიდუალური დიზაინი</div>';

    $("panel-whatsapp").href = "https://wa.me/" + waNumber() + "?text=" +
      encodeURIComponent("გამარჯობა! მაინტერესებს მოდელი „" + p.name + "“ (keramoart.com.ge)");
    $("panel-inquire").onclick = function () {
      closePanel();
      setTimeout(function () {
        $("f-product").value = p.name;
        if (p.length_cm) $("f-size").value = p.length_cm;
        if (categoryLabel(p.category)) $("f-type").value = categoryLabel(p.category);
      }, 350);
    };

    lastFocused = document.activeElement;
    panel.classList.add("open"); overlay.classList.add("open"); document.body.classList.add("panel-open");
    panel.setAttribute("aria-hidden", "false");
    panel.scrollTop = 0;
    panelClose.focus();
    document.body.style.overflow = "hidden";
  }

  function closePanel() {
    panel.classList.remove("open"); overlay.classList.remove("open"); document.body.classList.remove("panel-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  $("g-prev").addEventListener("click", function () { showImage(gal.index - 1); });
  $("g-next").addEventListener("click", function () { showImage(gal.index + 1); });
  $("g-zoom").addEventListener("click", openLightbox);
  $("panel-img").addEventListener("click", openLightbox);
  panelClose.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  function swipe(el) {
    var x0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) showImage(gal.index + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
  swipe(document.querySelector(".gallery-main"));
  swipe($("lightbox"));

  function showLightbox() {
    $("lb-img").src = gal.images[gal.index];
    $("lb-img").alt = gal.name;
    $("lb-counter").textContent = gal.images.length > 1 ? (gal.index + 1) + " / " + gal.images.length : "";
    $("lb-prev").hidden = $("lb-next").hidden = gal.images.length < 2;
  }
  function openLightbox() { $("lightbox").hidden = false; showLightbox(); $("lb-close").focus(); }
  function closeLightbox() { $("lightbox").hidden = true; }
  $("lb-close").addEventListener("click", closeLightbox);
  $("lb-prev").addEventListener("click", function () { showImage(gal.index - 1); });
  $("lb-next").addEventListener("click", function () { showImage(gal.index + 1); });
  $("lightbox").addEventListener("click", function (e) { if (e.target.id === "lightbox") closeLightbox(); });

  document.addEventListener("keydown", function (e) {
    var lb = !$("lightbox").hidden, po = panel.classList.contains("open");
    if (e.key === "Escape") { if (lb) closeLightbox(); else if (po) closePanel(); }
    if ((lb || po) && e.key === "ArrowRight") showImage(gal.index + 1);
    if ((lb || po) && e.key === "ArrowLeft") showImage(gal.index - 1);
  });

  // ================= CALCULATOR =================
  var calcLen = $("calc-len"), calcWall = $("calc-wall"), lastTotal = null, calcMode = null;
  function calcCats() { return state.categories.filter(function (c) { return c.id !== "custom"; }); }
  function renderCalcModes() {
    var cats = calcCats();
    if (!calcMode && cats[0]) calcMode = cats[0].id;
    $("calc-modes").innerHTML = cats.map(function (c) {
      return '<button type="button" data-mode="' + esc(c.id) + '" aria-pressed="' + (c.id === calcMode) + '">' + esc(c.label) + "</button>";
    }).join("");
  }
  $("calc-modes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mode]"); if (!b) return;
    calcMode = b.dataset.mode;
    $$("#calc-modes button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    updateCalc();
  });
  function bumpTo(el, val) {
    if (val === lastTotal) return;
    animateNumber(el, lastTotal || val, val);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
    lastTotal = val;
  }
  function updateCalc() {
    var totalEl = $("calc-total"), wrap = totalEl.parentNode;
    var fixed = catPrice(calcMode);
    $("calc").classList.toggle("fixed", !!fixed);
    if (fixed) {
      wrap.classList.remove("custom");
      $("calc-currency").textContent = " ₾";
      $("calc-note").textContent = categoryLabel(calcMode) + " — ფიქსირებული ფასი, ნებისმიერი ზომა";
      bumpTo(totalEl, fixed);
      return;
    }
    // length limits per type (e.g. double basin from 120 cm, washer-adapted from 90 cm)
    var min = Math.max(40, minCmOf(calcMode));
    calcLen.min = min;
    if (num(calcLen.value, 100) < min) calcLen.value = min;
    $("calc-min").textContent = min;
    $$(".calc-scale > span").forEach(function (sp, k) {
      if (k === 1 || k === 2) {
        var v = k === 1 ? 120 : 160;
        sp.style.left = ((v - min) / (calcLen.max - min) * 100) + "%";
        sp.style.visibility = v <= min ? "hidden" : "visible";
      }
    });
    var cm = num(calcLen.value, 100);
    var pct = (cm - min) / (calcLen.max - min) * 100;
    calcLen.style.setProperty("--p", pct + "%");
    $("calc-len-out").textContent = cm;
    var w = 22 + pct * 0.72;
    $("cv-sink").style.width = w + "%";
    $("cv-ruler").style.width = w + "%";
    $("cv-ruler-label").textContent = cm + " სმ";
    $("cv-sink").classList.toggle("double", basinsOf(calcMode) > 1);
    var mount = mountFor(calcMode);
    $("calc-wall-price").textContent = mount;
    document.querySelector(".calc-visual").classList.toggle("wall", calcWall.checked);

    var base = priceFor(calcMode, cm);
    if (base) {
      wrap.classList.remove("custom");
      $("calc-currency").textContent = " ₾";
      var nb = basinsOf(calcMode);
      $("calc-note").textContent = rangeText(cm) + (nb > 1 ? " · " + nb + " ვანა (+" + tiers().extraBasin * (nb - 1) + " ₾)" : "") +
        (calcWall.checked ? " · მიტანა და მიყენება" : "");
      bumpTo(totalEl, base + (calcWall.checked ? mount : 0));
    } else {
      wrap.classList.add("custom");
      totalEl.textContent = "შეთანხმებით";
      $("calc-currency").textContent = "";
      $("calc-note").textContent = "კედლის გასწვრივ 1.6 მეტრზე მეტი — ფასს ინდივიდუალურად გეტყვით";
      lastTotal = null;
    }
  }
  function animateNumber(el, from, to) {
    if (reduceMotion || from === to) { el.textContent = fmt(to); return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / 450);
      el.textContent = fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  calcLen.addEventListener("input", updateCalc);
  calcWall.addEventListener("change", updateCalc);
  $("calc-cta").addEventListener("click", function () {
    setTimeout(function () {
      if (calcMode) $("f-type").value = categoryLabel(calcMode);
      if (isFixedCat(calcMode)) return;
      $("f-size").value = calcLen.value;
      var msg = $("f-message");
      if (calcWall.checked && msg.value.indexOf("მიყენება") === -1) msg.value = (msg.value ? msg.value + "\n" : "") + "მჭირდება მიტანა და კედელზე მიყენებაც.";
    }, 400);
  });

  // ================= CONTACTS =================
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function waNumber() {
    var d = digits(state.settings.whatsapp || state.settings.phone);
    if (d.length === 9) d = "995" + d;
    return d;
  }
  function applySettings() {
    var s = state.settings, tel = "+" + waNumber(), t = tiers();
    $("c-phone").textContent = s.phone; $("c-phone").href = "tel:" + tel;
    $("qc-call").href = $("fab-call").href = "tel:" + tel;
    $("c-email").textContent = s.email; $("c-email").href = "mailto:" + s.email;
    $("c-facebook").href = s.facebook;
    $("c-hours").textContent = s.hours;
    if (s.area) $("c-area").textContent = s.area;
    $("qc-whatsapp").href = $("mbar-wa").href = "https://wa.me/" + waNumber();
    $("qc-viber").href = "viber://chat?number=%2B" + waNumber();
    $$('[data-price="tier1"]').forEach(function (e) { e.textContent = fmt(t.t1); });
    $$('[data-price="tier2"]').forEach(function (e) { e.textContent = fmt(t.t2); });
    $$('[data-price="wall"]').forEach(function (e) { e.textContent = fmt(t.wall); });
    $$("[data-cat-price]").forEach(function (e) { var v = catPrice(e.dataset.catPrice); if (v) e.textContent = fmt(v); });
    $$('[data-price="double1"]').forEach(function (e) { e.textContent = fmt(t.t1 + t.extraBasin); });
    $$('[data-price="double2"]').forEach(function (e) { e.textContent = fmt(t.t2 + t.extraBasin); });
    $$('[data-price="extra"]').forEach(function (e) { e.textContent = fmt(t.extraBasin); });
    $$('[data-price="wall2"]').forEach(function (e) { e.textContent = fmt(t.wall + t.wallExtra); });
    $$(".mbar-main b").forEach(function (e) { e.textContent = fmt(t.t1) + " ₾-დან"; });
    $$(".hp-value b, .price-badge b").forEach(function (e) { e.textContent = e.closest(".price-badge") ? fmt(t.t1) + " ₾" : fmt(t.t1); });
  }
  function fillTypeSelect() {
    var sel = $("f-type");
    sel.innerHTML = '<option value="">აირჩიეთ ტიპი</option>';
    state.categories.concat([{ label: "ჯერ არ ვიცი, მჭირდება რჩევა" }]).forEach(function (c) {
      var o = document.createElement("option"); o.value = o.textContent = c.label; sel.appendChild(o);
    });
  }

  // ================= FORM (real sending) =================
  // 1) e-mail via FormSubmit (first message asks the inbox to click "Activate" once)
  // 2) copy into Supabase "leads" table so it shows in the admin panel
  var form = $("inquiry-form");
  function sendEmail(data) {
    var to = state.settings.email || "keramoartcollection@gmail.com";
    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.assign({
        _subject: "🛁 ახალი მოთხოვნა საიტიდან — " + data["სახელი"] + (data["მოდელი"] ? " (" + data["მოდელი"] + ")" : ""),
        _template: "table",
        _captcha: "false"
      }, data))
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || ("HTTP " + r.status));
      return j;
    }); });
  }
  function saveLead(row) {
    var cfg = window.KERAMO_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return Promise.reject(new Error("no-db"));
    return fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/leads", {
      method: "POST",
      headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row)
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form._honey.value) return;
    var name = form.name.value.trim(), phone = form.phone.value.trim();
    $("form-error").hidden = !!(name && phone);
    $("form-fail").hidden = true;
    if (!name || !phone) return;
    var product = form.product.value.trim(), size = form.size.value.trim();
    var cm = num(size, 0);
    var typeCat = state.categories.filter(function (c) { return c.label === form.type.value; })[0];
    var est = typeCat ? priceFor(typeCat.id, cm) : priceForCm(cm);
    var data = { "სახელი": name, "ტელეფონი": phone };
    if (form.type.value) data["ტიპი"] = form.type.value;
    if (form.city.value) data["ქალაქი"] = form.city.value;
    if (product) data["მოდელი"] = product;
    if (size) data["სიგრძე"] = size + " სმ" + (est ? " (სავარაუდო ფასი " + est + " ₾)" : "");
    if (form.message.value.trim()) data["შეტყობინება"] = form.message.value.trim();
    var row = { name: name, phone: phone, type: form.type.value || null, city: form.city.value || null,
      product: product || null, size_cm: cm || null, est_price: est || null, message: form.message.value.trim() || null };

    var btn = $("form-submit");
    btn.classList.add("loading"); btn.disabled = true;

    var results = [sendEmail(data), saveLead(row)].map(function (p) {
      return p.then(function () { return true; }, function (err) { console.warn(err); return false; });
    });
    Promise.all(results).then(function (ok) {
      btn.classList.remove("loading"); btn.disabled = false;
      if (ok[0] || ok[1]) {
        var box = document.createElement("div");
        box.className = "form-success";
        box.innerHTML = '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/><path d="M24 41l11 11 21-23"/></svg>' +
          "<h3>მოთხოვნა გაიგზავნა!</h3><p>მადლობა, " + esc(name) + ". დაგიკავშირდებით უმოკლეს დროში" +
          " ნომერზე " + esc(phone) + ".<br>ვმუშაობთ 24/7.</p>" +
          '<button type="button" class="btn btn-ghost" id="form-again"><span>ახალი მოთხოვნა</span></button>';
        form.hidden = true;
        form.parentNode.insertBefore(box, form.nextSibling);
        $("form-again").addEventListener("click", function () { box.remove(); form.reset(); form.hidden = false; });
      } else {
        var wa = "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\n"));
        $("form-fail").innerHTML = "გაგზავნა ვერ მოხერხდა (ინტერნეტის პრობლემა). გთხოვთ, <a href=\"" + wa + "\" target=\"_blank\" rel=\"noopener\">გამოგვიგზავნეთ WhatsApp-ით</a> ან დაგვირეკეთ: <a href=\"tel:+" + waNumber() + "\">" + esc(state.settings.phone) + "</a>";
        $("form-fail").hidden = false;
      }
    });
  });

  // ================= MISC =================
  $("ped-jump").addEventListener("click", function (e) {
    e.preventDefault();
    setCategory("pedestal-taper");
    $("catalog").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  $("washer-cta").addEventListener("click", function () {
    var w = state.products.filter(function (p) { return p.washer; })[0];
    setCategory(w ? w.category : "all");
    $("catalog").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  var navToggle = $("nav-toggle");
  navToggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  $$("#main-nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  $("year").textContent = new Date().getFullYear();


  // ================= MOBILE =================
  var mq = window.matchMedia("(max-width: 980px)");

  // hero: on phones the mosaic becomes an auto-playing slideshow
  var slideTimer = null;
  function setupHeroSlides() {
    var slides = $$("#hero-mosaic .m");
    clearInterval(slideTimer);
    slides.forEach(function (sl) { sl.classList.remove("active", "leaving"); });
    if (!mq.matches || reduceMotion || slides.length < 2) return;
    var i = 0;
    slides[0].classList.add("active");
    var dots = $("hero-dots");
    if (dots) dots.innerHTML = slides.map(function (_, k) { return "<i" + (k === 0 ? ' class="on"' : "") + "></i>"; }).join("");
    slideTimer = setInterval(function () {
      var cur = slides[i]; i = (i + 1) % slides.length;
      cur.classList.remove("active"); cur.classList.add("leaving");
      setTimeout(function () { cur.classList.remove("leaving"); }, 1200);
      slides[i].classList.add("active");
      if (dots) $$("i", dots).forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }, 3600);
  }
  if (mq.addEventListener) mq.addEventListener("change", setupHeroSlides);

  // bottom bar: hide while scrolling down, show when scrolling up / near contact
  var mbar = $("mbar"), lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    if (!mq.matches) return;
    var y = window.scrollY, down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 300) mbar.classList.add("hide");
    if (up || y < 300) mbar.classList.remove("hide");
    lastY = y;
  }, { passive: true });

  // panel as bottom sheet: swipe down on the handle/top to close
  (function () {
    var y0 = null, dy = 0;
    panel.addEventListener("touchstart", function (e) {
      if (!mq.matches || panel.scrollTop > 0) { y0 = null; return; }
      y0 = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    panel.addEventListener("touchmove", function (e) {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy > 0) panel.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    panel.addEventListener("touchend", function () {
      if (y0 === null) return;
      panel.style.transform = "";
      if (dy > 110) closePanel();
      y0 = null;
    });
  })();


  // ================= HERO EXTRAS =================
  (function rotator() {
    var words = $$("#rot-words b"); if (words.length < 2 || reduceMotion) return;
    var i = 0;
    setInterval(function () {
      var cur = words[i]; i = (i + 1) % words.length;
      cur.classList.remove("on"); cur.classList.add("out");
      setTimeout(function () { cur.classList.remove("out"); }, 700);
      words[i].classList.add("on");
    }, 2400);
  })();

  if (finePointer && !reduceMotion) {
    var heroEl = $("hero"), spot = $("hero-spot");
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      spot.style.setProperty("--mx", (e.clientX - r.left) + "px");
      spot.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  }

  // desktop: mosaic tiles cycle through other project photos
  var swapTimer = null;
  function setupMosaicSwap() {
    clearInterval(swapTimer);
    if (mq.matches || reduceMotion) return;
    var pool = state.products.filter(function (p) { return imagesOf(p).length; }).map(coverOf);
    var tiles = $$("#hero-mosaic .m");
    if (pool.length <= tiles.length) return;
    var next = tiles.length, t = 0;
    swapTimer = setInterval(function () {
      var tile = tiles[t % tiles.length]; t++;
      var src = pool[next % pool.length]; next++;
      var img = new Image();
      img.className = "swap"; img.alt = ""; img.src = src;
      img.onload = function () {
        tile.appendChild(img);
        requestAnimationFrame(function () { requestAnimationFrame(function () { img.classList.add("show"); }); });
        setTimeout(function () {
          var base = tile.querySelector("img:not(.swap)");
          if (base) base.src = src;
          img.remove();
        }, 1300);
      };
    }, 3200);
  }

  // ================= BOOT =================
  window.loadKeramoData().then(function (data) {
    state.categories = data.categories;
    state.products = data.products;
    state.settings = data.settings;
    $("stat-products").dataset.count = state.products.length;
    $("stat-categories").dataset.count = state.categories.filter(function (c) { return countFor(c.id) > 0; }).length;
    applySettings();
    fillTypeSelect();
    renderMosaic();
    setupHeroSlides();
    setupMosaicSwap();
    renderFilters();
    renderGrid();
    renderCalcModes();
    updateCalc();
    if (document.body.classList.contains("loaded")) startCounters();
    else setTimeout(startCounters, 1500);
  });
})();
