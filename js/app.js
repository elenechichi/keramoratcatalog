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
      wall: num(state.settings.price_wall, 150)
    };
  }
  function priceForCm(cm) {
    var t = tiers();
    if (!cm || cm <= 0) return null;
    if (cm <= 120) return t.t1;
    if (cm <= 160) return t.t2;
    return null;
  }
  function priceOf(p) { return p.price ? p.price : priceForCm(p.length_cm); }
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

    var price = priceOf(p), t = tiers(), pp = $("panel-price");
    pp.classList.toggle("custom", !price);
    pp.innerHTML = price
      ? '<div class="pp-main">' + fmt(price) + "<span> ₾</span></div>" +
        '<div class="pp-side">' + (p.length_cm ? (p.length_cm <= 120 ? "1.2 მეტრამდე ზომა" : "1.2 – 1.6 მეტრი") : "") +
        "<br>კედელზე მიყენება <b>+" + t.wall + " ₾</b></div>"
      : '<div class="pp-main">ფასი შეთანხმებით</div><div class="pp-side">1.6 მეტრზე მეტი ან<br>ინდივიდუალური დიზაინი</div>';

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
  var calcLen = $("calc-len"), calcWall = $("calc-wall"), lastTotal = null;
  function updateCalc() {
    var cm = num(calcLen.value, 100), t = tiers();
    var base = priceForCm(cm);
    var pct = (cm - calcLen.min) / (calcLen.max - calcLen.min) * 100;
    calcLen.style.setProperty("--p", pct + "%");
    $("calc-len-out").textContent = cm;
    var w = 22 + pct * 0.72;
    $("cv-sink").style.width = w + "%";
    $("cv-ruler").style.width = w + "%";
    $("cv-ruler-label").textContent = cm + " სმ";
    document.querySelector(".calc-visual").classList.toggle("wall", calcWall.checked);

    var totalEl = $("calc-total"), wrap = totalEl.parentNode;
    if (base) {
      var total = base + (calcWall.checked ? t.wall : 0);
      wrap.classList.remove("custom");
      $("calc-currency").textContent = " ₾";
      $("calc-note").textContent = (cm <= 120 ? "1.2 მეტრამდე ნებისმიერი ზომა" : "1.2 – 1.6 მეტრი") +
        (calcWall.checked ? " + კედელზე მიყენება" : "");
      if (total !== lastTotal) {
        animateNumber(totalEl, lastTotal || total, total);
        totalEl.classList.remove("bump"); void totalEl.offsetWidth; totalEl.classList.add("bump");
        lastTotal = total;
      }
    } else {
      wrap.classList.add("custom");
      totalEl.textContent = "შეთანხმებით";
      $("calc-currency").textContent = "";
      $("calc-note").textContent = "1.6 მეტრზე მეტი — ფასს ინდივიდუალურად გეტყვით";
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
      $("f-size").value = calcLen.value;
      var msg = $("f-message");
      if (calcWall.checked && msg.value.indexOf("კედელზე") === -1) msg.value = (msg.value ? msg.value + "\n" : "") + "მჭირდება კედელზე მიყენებაც.";
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
    if (s.area) $("c-area").textContent = s.area + " — აზომვა და მონტაჟი ნებისმიერ ქალაქში";
    $("qc-whatsapp").href = $("mbar-wa").href = "https://wa.me/" + waNumber();
    $("qc-viber").href = "viber://chat?number=%2B" + waNumber();
    $$('[data-price="tier1"]').forEach(function (e) { e.textContent = fmt(t.t1); });
    $$('[data-price="tier2"]').forEach(function (e) { e.textContent = fmt(t.t2); });
    $$('[data-price="wall"]').forEach(function (e) { e.textContent = fmt(t.wall); });
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

  // ================= FORM =================
  var form = $("inquiry-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim(), phone = form.phone.value.trim();
    $("form-error").hidden = !!(name && phone);
    if (!name || !phone) return;
    var product = form.product.value.trim(), size = form.size.value.trim();
    var cm = num(size, 0), est = priceForCm(cm);
    var body = [
      "სახელი: " + name,
      "ტელეფონი: " + phone,
      form.type.value ? "ტიპი: " + form.type.value : null,
      form.city.value ? "ქალაქი: " + form.city.value : null,
      product ? "მოდელი: " + product : null,
      size ? "სიგრძე: " + size + " სმ" + (est ? " (სავარაუდო ფასი " + est + " ₾)" : "") : null,
      "",
      form.message.value.trim()
    ].filter(function (l) { return l !== null; }).join("\n");
    window.location.href = "mailto:" + state.settings.email +
      "?subject=" + encodeURIComponent("მოთხოვნა საიტიდან" + (product ? " — " + product : "")) +
      "&body=" + encodeURIComponent(body);
  });

  // ================= MISC =================
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
    renderFilters();
    renderGrid();
    updateCalc();
    if (document.body.classList.contains("loaded")) startCounters();
    else setTimeout(startCounters, 1500);
  });
})();
