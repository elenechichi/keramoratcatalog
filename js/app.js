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
  // "bath" | "kitchen" — column `section`, or inferred from an id that starts with "kitchen"
  function sectionOf(catId) { var c = catOf(catId); return c.section || (/^kitchen/.test(catId || "") ? "kitchen" : "bath"); }
  function isKitchen(p) { return sectionOf(p.category) === "kitchen"; }
  function bathProducts() { return state.products.filter(function (p) { return !isKitchen(p); }); }
  function kitchenProducts() { return state.products.filter(isKitchen); }
  function bathCats() { return state.categories.filter(function (c) { return sectionOf(c.id) !== "kitchen"; }); }
  function kitchenCats() { return state.categories.filter(function (c) { return sectionOf(c.id) === "kitchen"; }); }
  function catPrice(id) { var c = catOf(id); return c.price ? num(c.price, null) : null; }
  function isFixedCat(id) { return !!catPrice(id); }
  function basinsOf(catId) { return Math.max(1, num(catOf(catId).basins, 1)); }
  function minCmOf(catId) { return num(catOf(catId).min_cm, 0); }
  // price for a category + length (single source of truth for tiles, panel, calculator, form)
  function priceFor(catId, cm) {
    var fixed = catPrice(catId);
    if (fixed) return fixed;
    if (sectionOf(catId) === "kitchen") return null; // kitchen: manual price per project, or on request
    var base = priceForCm(cm);
    if (!base) return null;
    return base + (basinsOf(catId) - 1) * tiers().extraBasin;
  }
  function mountFor(catId) {
    if (isFixedCat(catId) || sectionOf(catId) === "kitchen") return null;
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
    return id === "all" ? bathProducts().length : state.products.filter(function (p) { return p.category === id; }).length;
  }
  function filterCats() { return bathCats().filter(function (c) { return countFor(c.id) > 0; }); }

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
  $$(".reveal, .split-title, .section-head, .kg, .k-collage").forEach(observe);

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
    var all = [{ id: "all", label: "ყველა" }].concat(filterCats());
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
      var cats = ["all"].concat(filterCats().map(function (c) { return c.id; }));
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
    var list = state.category === "all" ? bathProducts()
      : state.products.filter(function (p) { return p.category === state.category; });
    gridEl.innerHTML = "";
    emptyEl.hidden = list.length !== 0;
    list.forEach(function (p, i) { gridEl.appendChild(makeTile(p, i)); });
  }

  function renderKitchenGrid() {
    var list = kitchenProducts(), grid = $("kitchen-grid");
    grid.innerHTML = "";
    grid.hidden = !list.length;
    $("kitchen-empty").hidden = true;
    $("k-projects").hidden = !list.length; // shown only once real kitchen projects are added in admin
    list.forEach(function (p, i) { grid.appendChild(makeTile(p, i)); });
  }

  function makeTile(p, i) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.style.setProperty("--d", (i % 3) * 0.1 + "s");
      var price = priceOf(p);
      tile.setAttribute("aria-label", p.name + ", " + sizeText(p) + (price ? ", " + price + " ლარი" : ""));
      var n = imagesOf(p).length;
      tile.innerHTML =
        '<div class="tile-media">' +
          '<span class="tile-curtain" aria-hidden="true"></span>' +
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
      tile.setAttribute("data-cursor", "ნახვა");
      if (finePointer && !reduceMotion) addTilt(tile);
      observe(tile);
      return tile;
  }

  function addTilt(el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.transform = "rotateY(" + ((x - .5) * 6) + "deg) rotateX(" + ((.5 - y) * 6) + "deg) translateY(-6px)";
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
    img.alt = gal.name + ", ფოტო " + (gal.index + 1);
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
      : isKitchen(p)
        ? '<div class="pp-main">ფასი შეთანხმებით</div><div class="pp-side">სამზარეულოს ზედაპირი<br>ფასი ინდივიდუალურად, მოთხოვნით</div>'
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
  function calcCats() { return bathCats().filter(function (c) { return c.id !== "custom"; }); }
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
      $("calc-note").textContent = categoryLabel(calcMode) + ": ფიქსირებული ფასი, ნებისმიერი ზომა";
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
      $("calc-note").textContent = "კედლის გასწვრივ 1.6 მეტრზე მეტი. ფასს ინდივიდუალურად გეტყვით";
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
    sel.innerHTML = '<option value="">აირჩიეთ</option>';
    [["აბაზანის ნიჟარა", bathCats()], ["სამზარეულოს ზედაპირი", kitchenCats()]].forEach(function (g) {
      if (!g[1].length) return;
      var og = document.createElement("optgroup"); og.label = g[0];
      g[1].forEach(function (c) { var o = document.createElement("option"); o.value = o.textContent = c.label; og.appendChild(o); });
      sel.appendChild(og);
    });
    var o = document.createElement("option"); o.value = o.textContent = "ჯერ არ ვიცი, მჭირდება რჩევა"; sel.appendChild(o);
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
        _subject: (/სამზარეულო/.test(data["ტიპი"] || "") ? "🍳" : "🛁") + " ახალი მოთხოვნა საიტიდან: " + data["სახელი"] + (data["მოდელი"] ? " (" + data["მოდელი"] + ")" : ""),
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
    if (!tiles.length || pool.length <= tiles.length) return;
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

  // ================= MATERIALS (procedural stone, SVG filters) =================
  var MATS = [
    { id: "nero",       name: "Nero Marquina", desc: "შავი, ოქროსფერი ძარღვებით",       base: "#181615", tone: "#2e2a26", vein: "#cfa96f", s: .95, vf: "0.0055 0.011", cf: "0.004 0.006", seed: 7 },
    { id: "calacatta",  name: "Calacatta Oro", desc: "თეთრი, ნაცრისფერ-ოქროსფერი ძარღვებით", base: "#f2eee7", tone: "#ddd4c6", vein: "#8f8170", s: .8, vf: "0.005 0.013", cf: "0.003 0.005", seed: 11 },
    { id: "travertino", name: "Travertino",    desc: "თბილი ქვიშისფერი, ჰორიზონტალური ფენებით", base: "#d6c09d", tone: "#bfa47c", vein: "#efe0c4", s: .55, vf: "0.0015 0.045", cf: "0.002 0.03", seed: 3 },
    { id: "cemento",    name: "Cemento",       desc: "მატი ნაცრისფერი, ბეტონის ეფექტი",   base: "#8c8985", tone: "#6f6b66", vein: "#a8a49e", s: .22, vf: "0.02 0.02", cf: "0.012 0.012", seed: 5 },
    { id: "verde",      name: "Verde Alpi",    desc: "ღრმა მწვანე, თეთრი ძარღვებით",       base: "#1c372f", tone: "#2a4d42", vein: "#e4dccb", s: .85, vf: "0.006 0.01", cf: "0.004 0.006", seed: 19 }
  ];
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function marbleFilter(m) {
    var t = rgb(m.tone), v = rgb(m.vein), k = (22 * m.s).toFixed(2);
    return '<filter id="mat-' + m.id + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="' + m.cf + '" numOctaves="3" seed="' + m.seed + '" result="c"/>' +
      '<feColorMatrix in="c" type="matrix" values="0 0 0 0 ' + t[0] + ' 0 0 0 0 ' + t[1] + ' 0 0 0 0 ' + t[2] + ' 1.4 0 0 0 -.45" result="tone"/>' +
      '<feTurbulence type="turbulence" baseFrequency="' + m.vf + '" numOctaves="4" seed="' + (m.seed + 1) + '" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 ' + v[0] + ' 0 0 0 0 ' + v[1] + ' 0 0 0 0 ' + v[2] + ' -' + k + ' 0 0 0 ' + m.s + '" result="veins"/>' +
      '<feGaussianBlur in="veins" stdDeviation="3" result="g0"/>' +
      '<feComponentTransfer in="g0" result="glow"><feFuncA type="linear" slope=".45"/></feComponentTransfer>' +
      '<feFlood flood-color="' + m.base + '" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="tone"/><feMergeNode in="glow"/><feMergeNode in="veins"/></feMerge>' +
    "</filter>";
  }
  $("mat-defs").innerHTML = MATS.map(marbleFilter).join("");
  function matById(id) { return MATS.filter(function (m) { return m.id === id; })[0] || MATS[0]; }

  // ================= KITCHEN STUDIO =================
  var studio = { shape: "straight", mat: "nero", len: 320, edge: "სწორი", sink: true, splash: false };
  var SVGNS = "http://www.w3.org/2000/svg";
  var SHAPE_CAT = { straight: "kitchen-straight", corner: "kitchen-corner", u: "kitchen-u", island: "kitchen-island" };
  var SHAPE_NAME = { straight: "სწორი", corner: "კუთხის", u: "U-ფორმის", island: "კუნძულით" };

  function geometry(shape, T) {
    var D = 62, polys = [], sink, hob, dims = [], walls = [];
    if (shape === "corner") {
      var a = Math.round(T * .58), b = Math.max(D + 60, T - a + D);
      polys.push([[0, 0], [a, 0], [a, b], [a - D, b], [a - D, D], [0, D]]);
      sink = [a * .3, (D - 40) / 2]; hob = [a - D + 6, D + (b - D) * .45, "v"];
      dims.push({ x1: 0, y1: 0, x2: a, y2: 0, side: "top", v: a }, { x1: a, y1: 0, x2: a, y2: b, side: "right", v: b });
      walls.push([[0, 0], [a, 0], [a, b]]);
    } else if (shape === "u") {
      var top = Math.max(2 * D + 70, Math.round(T * .42)), leg = Math.max(D + 50, Math.round((T - top) / 2) + D);
      polys.push([[0, 0], [top, 0], [top, leg], [top - D, leg], [top - D, D], [D, D], [D, leg], [0, leg]]);
      sink = [top / 2 - 25, (D - 40) / 2]; hob = [top - D + 6, D + (leg - D) * .4, "v"];
      dims.push({ x1: 0, y1: 0, x2: top, y2: 0, side: "top", v: top }, { x1: top, y1: 0, x2: top, y2: leg, side: "right", v: leg });
      walls.push([[0, leg], [0, 0], [top, 0], [top, leg]]);
    } else if (shape === "island") {
      var w = Math.round(T * .6), iw = Math.max(90, T - w), ih = 90, iy = D + 105, ix = (w - iw) / 2;
      polys.push([[0, 0], [w, 0], [w, D], [0, D]]);
      polys.push([[ix, iy], [ix + iw, iy], [ix + iw, iy + ih], [ix, iy + ih]]);
      sink = [w * .28, (D - 40) / 2]; hob = [ix + iw / 2 - 30, iy + (ih - 52) / 2, "h"];
      dims.push({ x1: 0, y1: 0, x2: w, y2: 0, side: "top", v: w }, { x1: ix, y1: iy + ih, x2: ix + iw, y2: iy + ih, side: "bottom", v: iw });
      walls.push([[0, 0], [w, 0]]);
    } else {
      polys.push([[0, 0], [T, 0], [T, D], [0, D]]);
      sink = [T * .26, (D - 40) / 2]; hob = [T * .62, (D - 52) / 2, "h"];
      dims.push({ x1: 0, y1: 0, x2: T, y2: 0, side: "top", v: T });
      walls.push([[0, 0], [T, 0]]);
    }
    var xs = [], ys = [];
    polys.forEach(function (p) { p.forEach(function (q) { xs.push(q[0]); ys.push(q[1]); }); });
    return { polys: polys, sink: sink, hob: hob, dims: dims, walls: walls, w: Math.max.apply(0, xs), h: Math.max.apply(0, ys) };
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function renderStage(animate) {
    var svg = $("stage-svg"), g = geometry(studio.shape, studio.len);
    var k = Math.min(520 / g.w, 290 / g.h, 2.4), ox = (640 - g.w * k) / 2, oy = (440 - g.h * k) / 2 + 12;
    function P(pt) { return (ox + pt[0] * k).toFixed(1) + "," + (oy + pt[1] * k).toFixed(1); }
    function path(poly) { return "M" + poly.map(P).join(" L") + " Z"; }
    svg.innerHTML = "";
    svg.classList.toggle("animate", !!animate && !reduceMotion);
    var defs = el("defs", {}, svg);
    var clip = el("clipPath", { id: "slab-clip" }, defs);
    g.polys.forEach(function (p) { el("path", { d: path(p) }, clip); });
    var sheen = el("linearGradient", { id: "slab-sheen", x1: "0", y1: "0", x2: "1", y2: ".3" }, defs);
    el("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0" }, sheen);
    el("stop", { offset: ".5", "stop-color": "#fff", "stop-opacity": ".22" }, sheen);
    el("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, sheen);

    // shadow + edge thickness
    g.polys.forEach(function (p) { el("path", { d: path(p), class: "slab-shadow" }, svg); });
    g.polys.forEach(function (p) { el("path", { d: path(p), class: "slab-edge", transform: "translate(0 7)" }, svg); });
    // backsplash (wall panel)
    if (studio.splash) g.walls.forEach(function (wl) {
      el("polyline", { points: wl.map(function (q) { return P(q); }).join(" "), class: "slab-splash", transform: "translate(0 -5)" }, svg);
    });
    // stone surface
    var fill = el("g", { "clip-path": "url(#slab-clip)", class: "slab-fill" }, svg);
    el("rect", { x: 0, y: 0, width: 640, height: 440, filter: "url(#mat-" + studio.mat + ")", id: "slab-mat" }, fill);
    el("rect", { x: -640, y: 0, width: 640, height: 440, fill: "url(#slab-sheen)", class: "slab-sheen" }, fill);
    g.polys.forEach(function (p) { el("path", { d: path(p), class: "slab-outline", pathLength: "1" }, svg); });

    // sink
    if (studio.sink && g.sink) {
      var sx = ox + g.sink[0] * k, sy = oy + g.sink[1] * k;
      var sg = el("g", { class: "slab-sink" }, svg);
      el("rect", { x: sx, y: sy, width: 50 * k, height: 40 * k, rx: 7 * k }, sg);
      el("circle", { cx: sx + 25 * k, cy: sy + 20 * k, r: 2.2 * k, class: "drain" }, sg);
      el("circle", { cx: sx + 25 * k, cy: oy + 4 * k, r: 2.6 * k, class: "tap" }, sg);
    }
    // cooktop
    if (g.hob) {
      var hx = ox + g.hob[0] * k, hy = oy + g.hob[1] * k, vert = g.hob[2] === "v";
      var hw = (vert ? 50 : 60) * k, hh = (vert ? 60 : 52) * k;
      var hg = el("g", { class: "slab-hob" }, svg);
      el("rect", { x: hx, y: hy, width: hw, height: hh, rx: 3 * k }, hg);
      [[.28, .3, 9], [.72, .3, 7], [.28, .72, 7], [.72, .72, 9]].forEach(function (c) {
        el("circle", { cx: hx + hw * c[0], cy: hy + hh * c[1], r: c[2] * k * .75 }, hg);
      });
    }
    // dimensions
    g.dims.forEach(function (d) {
      var dg = el("g", { class: "slab-dim" }, svg), off = 20;
      var x1 = ox + d.x1 * k, y1 = oy + d.y1 * k, x2 = ox + d.x2 * k, y2 = oy + d.y2 * k;
      if (d.side === "top") { y1 -= off; y2 -= off; }
      if (d.side === "bottom") { y1 += off + 6; y2 += off + 6; }
      if (d.side === "right") { x1 += off; x2 += off; }
      el("line", { x1: x1, y1: y1, x2: x2, y2: y2, pathLength: "1" }, dg);
      var horiz = d.side !== "right";
      [[x1, y1], [x2, y2]].forEach(function (q) {
        el("line", horiz ? { x1: q[0], y1: q[1] - 5, x2: q[0], y2: q[1] + 5 } : { x1: q[0] - 5, y1: q[1], x2: q[0] + 5, y2: q[1] }, dg);
      });
      var t = el("text", horiz
        ? { x: (x1 + x2) / 2, y: y1 - 7, "text-anchor": "middle" }
        : { x: x1 + 9, y: (y1 + y2) / 2 + 4, "text-anchor": "start" }, dg);
      t.textContent = Math.round(d.v) + " სმ";
    });
    updateStudioText();
  }

  function updateStudioText() {
    var m = matById(studio.mat);
    $("stage-mat-name").textContent = m.name;
    $("stage-mat-desc").textContent = m.desc;
    $("st-mat-label").textContent = m.name;
    $("st-len-out").textContent = (studio.len / 100).toFixed(1);
    $("st-len").style.setProperty("--p", ((studio.len / 100 - 1.2) / (8 - 1.2) * 100) + "%");
    var perM = num(state.settings.price_kitchen_m, 0), priceEl = $("st-price");
    if (perM > 0) {
      priceEl.innerHTML = "≈ " + fmt(Math.round(studio.len / 100 * perM)) + " <span>₾-დან</span>";
      $("st-price-note").textContent = perM + " ₾ გრძივ მეტრზე · საბოლოო ფასი დგინდება აზომვის შემდეგ.";
    } else {
      priceEl.textContent = "მოთხოვნით";
      $("st-price-note").textContent = "გამოგვიგზავნეთ თქვენი კონფიგურაცია და ფასს ინდივიდუალურად გეტყვით. კონსულტაცია უფასოა.";
    }
  }

  function renderMatSwatches() {
    $("st-mats").innerHTML = MATS.map(function (m) {
      return '<button type="button" data-mat="' + m.id + '" aria-pressed="' + (m.id === studio.mat) + '" aria-label="' + esc(m.name) + '" title="' + esc(m.name) + '">' +
        '<svg viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" filter="url(#mat-' + m.id + ')"/></svg></button>';
    }).join("");
  }

  function pressIn(groupId, btn) {
    $$("#" + groupId + " button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
  }
  $("st-shapes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-shape]"); if (!b) return;
    studio.shape = b.dataset.shape; pressIn("st-shapes", b);
    if (studio.shape === "u" && studio.len < 380) { studio.len = 420; $("st-len").value = 4.2; }
    if (studio.shape === "island" && studio.len < 340) { studio.len = 420; $("st-len").value = 4.2; }
    renderStage(true);
  });
  $("st-mats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mat]"); if (!b) return;
    studio.mat = b.dataset.mat; pressIn("st-mats", b);
    var r = $("slab-mat");
    if (!r || reduceMotion) return renderStage(false);
    var stage = $("studio-stage");
    stage.classList.remove("mat-swap"); void stage.offsetWidth; stage.classList.add("mat-swap");
    setTimeout(function () { r.setAttribute("filter", "url(#mat-" + studio.mat + ")"); updateStudioText(); }, 220);
  });
  $("st-edges").addEventListener("click", function (e) {
    var b = e.target.closest("[data-edge]"); if (!b) return;
    studio.edge = b.dataset.edge; pressIn("st-edges", b);
    $("studio-stage").dataset.edge = b.dataset.edge;
  });
  $("st-len").addEventListener("input", function () { studio.len = Math.round(parseFloat(this.value) * 100); renderStage(false); });
  $("st-sink").addEventListener("change", function () { studio.sink = this.checked; renderStage(false); });
  $("st-splash").addEventListener("change", function () { studio.splash = this.checked; renderStage(false); });

  function fillKitchenForm(lines) {
    setTimeout(function () {
      var lbl = categoryLabel(SHAPE_CAT[studio.shape]);
      if (lbl) $("f-type").value = lbl;
      $("f-size").value = studio.len;
      $("f-product").value = matById(studio.mat).name;
      if (lines) $("f-message").value = lines;
    }, 400);
  }
  $("st-cta").addEventListener("click", function () {
    fillKitchenForm(
      "სამზარეულოს ზედაპირი\n" +
      "ფორმა: " + SHAPE_NAME[studio.shape] + "\n" +
      "მასალა: " + matById(studio.mat).name + "\n" +
      "საერთო სიგრძე: ≈ " + studio.len + " სმ\n" +
      "კიდე: " + studio.edge + "\n" +
      "ჩაშენებული ნიჟარა: " + (studio.sink ? "კი" : "არა") + "\n" +
      "კედლის პანელი: " + (studio.splash ? "კი" : "არა"));
  });
  $("k-empty-cta").addEventListener("click", function () { fillKitchenForm(null); });

  // stage: draw when it scrolls into view, subtle tilt on desktop
  var stageIO = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { renderStage(true); stageIO.disconnect(); }
  }, { threshold: .35 }) : null;
  if (finePointer && !reduceMotion) {
    var stageEl = $("studio-stage"), tiltEl = $("stage-tilt");
    stageEl.addEventListener("pointermove", function (e) {
      var r = stageEl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tiltEl.style.transform = "rotateX(" + (32 - y * 8) + "deg) rotateZ(" + (x * -6) + "deg)";
    });
    stageEl.addEventListener("pointerleave", function () { tiltEl.style.transform = ""; });
  }

  // ================= CUSTOM CURSOR (desktop) =================
  if (finePointer && !reduceMotion) {
    var cur = $("cursor"), dot = $("cursor-dot"), curLabel = $("cursor-label");
    var cx = -100, cy = -100, tx = -100, ty = -100, curOn = false;
    document.body.classList.add("has-cursor");
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
      if (!curOn) { curOn = true; cx = tx; cy = ty; document.body.classList.add("cursor-on"); requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { document.body.classList.remove("cursor-on"); curOn = false; });
    function follow() {
      if (!curOn) return;
      cx += (tx - cx) * .18; cy += (ty - cy) * .18;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(follow);
    }
    document.addEventListener("pointerover", function (e) {
      var big = e.target.closest("[data-cursor]"), link = e.target.closest("a, button, input, label, select");
      cur.classList.toggle("big", !!big);
      cur.classList.toggle("link", !big && !!link);
      curLabel.textContent = big ? big.dataset.cursor : "";
    });
  }

  // ================= HERO VIDEO =================
  // muted, looping background; paused when off-screen or when the visitor prefers reduced motion
  (function () {
    var v = $("hero-video"); if (!v) return;
    v.muted = true;
    if (reduceMotion) { v.removeAttribute("autoplay"); v.pause(); return; }
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    v.addEventListener("canplay", function () { v.classList.add("ready"); }, { once: true });
    if (v.readyState >= 3) v.classList.add("ready");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) play(); else v.pause(); }, { threshold: 0.05 }).observe(v);
    } else play();
  })();

  // ================= SCROLL-LINKED EFFECTS =================
  // 1) about text lights up word by word  2) showcase photo expands to full screen
  // 3) order-process line fills and steps light up
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  var scrubEl = $("scrub-text"), scrubWords = [], scrubLast = -1;
  (function splitWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
      if (ch.nodeType === 3) {
        var frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span"); s.className = "sw"; s.textContent = part;
          frag.appendChild(s); scrubWords.push(s);
        });
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1) splitWords(ch);
    });
  })(scrubEl);

  var scSection = $("showcase"), scFrame = $("showcase-frame"), scImg = scFrame.querySelector("img"), scCopy = $("showcase-copy");
  var procList = $("process-list"), procFill = $("process-fill"), procItems = $$(".process-item", procList);

  function scrollFx() {
    var vh = window.innerHeight, r, p;

    // 1) word highlight
    r = scrubEl.getBoundingClientRect();
    p = reduceMotion ? 1 : clamp01((vh * .88 - r.top) / (vh * .55));
    var n = Math.round(p * scrubWords.length);
    if (n !== scrubLast) {
      scrubWords.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      scrubLast = n;
    }

    // 2) showcase expand
    r = scSection.getBoundingClientRect();
    p = reduceMotion ? 1 : clamp01(-r.top / Math.max(1, r.height - vh));
    var k = clamp01(p / .55), e = 1 - Math.pow(1 - k, 3), inv = 1 - e;
    var side = mq.matches ? 6 : 24, top = mq.matches ? 18 : 14;
    scFrame.style.clipPath = "inset(" + (top * inv) + "% " + (side * inv) + "% " + (top * inv) + "% " + (side * inv) + "% round " + (24 * inv) + "px)";
    scImg.style.transform = "scale(" + (1.28 - .28 * e) + ")";
    var q = clamp01((p - .42) / .28);
    scFrame.style.setProperty("--q", q);
    scCopy.style.opacity = q;
    scCopy.style.transform = "translateY(" + ((1 - q) * 40) + "px)";
    scCopy.style.pointerEvents = q > .5 ? "auto" : "none";
    scSection.classList.toggle("sc-done", p > .04);

    // 3) process timeline
    r = procList.getBoundingClientRect();
    p = reduceMotion ? 1 : clamp01((vh * .8 - r.top) / (r.height + vh * .2));
    procFill.style.transform = "scaleX(" + p + ")";
    procItems.forEach(function (it, i) { it.classList.toggle("lit", p >= (i + .5) / procItems.length - .12); });
  }
  // kitchen ideas gallery → lightbox
  var kgButtons = $$("#k-gallery-grid .kg");
  var kgImages = kgButtons.map(function (b) { return b.querySelector("img").getAttribute("src"); });
  kgButtons.forEach(function (b, i) {
    b.addEventListener("click", function () {
      gal = { images: kgImages, index: i, name: b.querySelector("span").textContent };
      renderThumbs(); showImage(i); openLightbox();
    });
  });

  // kitchen collage: gentle opposite-direction parallax
  var collage = $$(".k-collage .kc");
  function collageFx() {
    if (reduceMotion || mq.matches || !collage.length) return;
    var r = collage[0].parentNode.getBoundingClientRect(), mid = r.top + r.height / 2 - window.innerHeight / 2;
    collage.forEach(function (c) { c.style.transform = "translateY(" + (mid * parseFloat(c.dataset.speed)) + "px)"; });
  }
  window.addEventListener("scroll", function () { requestAnimationFrame(collageFx); }, { passive: true });

  var fxTick = false;
  function fxRequest() { if (!fxTick) { fxTick = true; requestAnimationFrame(function () { fxTick = false; scrollFx(); }); } }
  window.addEventListener("scroll", fxRequest, { passive: true });
  window.addEventListener("resize", fxRequest);
  scrollFx();

  // ================= BOOT =================
  window.loadKeramoData().then(function (data) {
    state.categories = data.categories;
    state.products = data.products;
    state.settings = data.settings;
    $("stat-products").dataset.count = state.products.length;
    $("stat-categories").dataset.count = state.categories.filter(function (c) { return countFor(c.id) > 0; }).length;
    $("world-bath-count").textContent = bathProducts().length;
    applySettings();
    fillTypeSelect();
    renderMosaic();
    setupHeroSlides();
    setupMosaicSwap();
    renderFilters();
    renderGrid();
    renderKitchenGrid();
    renderMatSwatches();
    renderStage(false);
    if (stageIO) stageIO.observe($("studio-stage"));
    renderCalcModes();
    updateCalc();
    if (document.body.classList.contains("loaded")) startCounters();
    else setTimeout(startCounters, 1500);
  });
})();
