(function () {
  "use strict";

  var state = { category: "all", categories: [], products: [], settings: {} };

  var $ = function (id) { return document.getElementById(id); };
  var filtersEl = $("filters");
  var gridEl = $("tile-grid");
  var emptyEl = $("empty-state");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function imagesOf(p) { return (p.images && p.images.length) ? p.images : []; }
  function coverOf(p) { return imagesOf(p)[0] || "assets/logo-mark.svg"; }

  function categoryLabel(id) {
    var found = state.categories.filter(function (c) { return c.id === id; })[0];
    return found ? found.label : "";
  }

  function countFor(catId) {
    if (catId === "all") return state.products.length;
    return state.products.filter(function (p) { return p.category === catId; }).length;
  }

  // ---------- filters ----------
  function renderFilters() {
    var all = [{ id: "all", label: "ყველა" }].concat(state.categories.filter(function (c) { return countFor(c.id) > 0; }));
    filtersEl.innerHTML = "";
    all.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(state.category === cat.id));
      btn.innerHTML = esc(cat.label) + ' <span class="count">' + countFor(cat.id) + "</span>";
      btn.addEventListener("click", function () {
        state.category = cat.id;
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  // ---------- grid ----------
  function renderGrid() {
    var list = state.category === "all"
      ? state.products
      : state.products.filter(function (p) { return p.category === state.category; });

    gridEl.innerHTML = "";
    emptyEl.hidden = list.length !== 0;

    list.forEach(function (p, i) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.style.animationDelay = Math.min(i, 12) * 40 + "ms";
      tile.setAttribute("aria-label", p.name + (p.size ? " — " + p.size : ""));
      var n = imagesOf(p).length;
      var badge = p.washer ? '<span class="tile-badge">სარეცხ მანქანაზე მორგებული</span>' : "";
      var count = n > 1 ? '<span class="tile-count"><svg viewBox="0 0 24 24"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/></svg>' + n + "</span>" : "";
      tile.innerHTML =
        '<div class="tile-media">' + badge + count +
          '<img src="' + esc(coverOf(p)) + '" alt="' + esc(p.name) + '" loading="lazy" onload="this.classList.add(\'loaded\')">' +
          '<span class="tile-view">დათვალიერება →</span>' +
        "</div>" +
        '<div class="tile-body">' +
          '<p class="tile-collection">' + esc(categoryLabel(p.category)) + "</p>" +
          '<h3 class="tile-name">' + esc(p.name) + "</h3>" +
          '<p class="tile-meta">' + esc([p.material, p.size].filter(Boolean).join(" · ")) + "</p>" +
        "</div>";
      tile.addEventListener("click", function () { openPanel(p); });
      gridEl.appendChild(tile);
    });
  }

  // ---------- hero mosaic ----------
  function renderMosaic() {
    var featured = state.products.filter(function (p) { return p.featured && imagesOf(p).length; });
    var pool = featured.concat(state.products.filter(function (p) { return !p.featured && imagesOf(p).length; }));
    var slots = document.querySelectorAll("#hero-mosaic .m img");
    for (var i = 0; i < slots.length && i < pool.length; i++) slots[i].src = coverOf(pool[i]);
  }

  // ---------- gallery / panel ----------
  var panel = $("product-panel");
  var overlay = $("panel-overlay");
  var panelClose = $("panel-close");
  var lastFocused = null;
  var gal = { images: [], index: 0, name: "" };

  function showImage(i) {
    var n = gal.images.length;
    if (!n) return;
    gal.index = (i + n) % n;
    var img = $("panel-img");
    img.classList.remove("loaded");
    img.onload = function () { img.classList.add("loaded"); };
    img.src = gal.images[gal.index];
    img.alt = gal.name + " — ფოტო " + (gal.index + 1);
    $("g-counter").textContent = n > 1 ? (gal.index + 1) + " / " + n : "";
    $("g-prev").hidden = $("g-next").hidden = n < 2;
    Array.prototype.forEach.call($("gallery-thumbs").children, function (t, k) {
      t.setAttribute("aria-current", String(k === gal.index));
      if (k === gal.index && t.scrollIntoView) t.scrollIntoView({ block: "nearest", inline: "center" });
    });
    if (!$("lightbox").hidden) showLightbox();
  }

  function renderThumbs() {
    var wrap = $("gallery-thumbs");
    wrap.innerHTML = "";
    wrap.hidden = gal.images.length < 2;
    gal.images.forEach(function (src, k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
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
    $("panel-material").textContent = p.material || "—";
    $("panel-color").textContent = p.color || "—";
    $("panel-size").textContent = p.size || "—";
    $("panel-note").textContent = p.note || "";
    $("panel-note").hidden = !p.note;

    var wa = waNumber();
    $("panel-whatsapp").href = "https://wa.me/" + wa + "?text=" +
      encodeURIComponent("გამარჯობა! მაინტერესებს მოდელი „" + p.name + "“ (keramoart.com.ge)");

    $("panel-inquire").onclick = function () {
      closePanel();
      setTimeout(function () {
        var f = $("f-product"); if (f) f.value = p.name;
        var t = $("f-type"); if (t && categoryLabel(p.category)) t.value = categoryLabel(p.category);
      }, 350);
    };

    lastFocused = document.activeElement;
    panel.classList.add("open");
    overlay.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    panel.scrollTop = 0;
    panelClose.focus();
    document.body.style.overflow = "hidden";
  }

  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("open");
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

  // swipe
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

  // ---------- lightbox ----------
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
    var lbOpen = !$("lightbox").hidden;
    var pOpen = panel.classList.contains("open");
    if (e.key === "Escape") { if (lbOpen) closeLightbox(); else if (pOpen) closePanel(); }
    if ((lbOpen || pOpen) && e.key === "ArrowRight") showImage(gal.index + 1);
    if ((lbOpen || pOpen) && e.key === "ArrowLeft") showImage(gal.index - 1);
  });

  // ---------- contacts ----------
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function waNumber() {
    var d = digits(state.settings.whatsapp || state.settings.phone);
    if (d.length === 9) d = "995" + d;
    return d;
  }

  function applySettings() {
    var s = state.settings;
    var tel = "+" + waNumber();
    $("c-phone").textContent = s.phone; $("c-phone").href = "tel:" + tel;
    $("qc-call").href = "tel:" + tel; $("fab-call").href = "tel:" + tel;
    $("c-email").textContent = s.email; $("c-email").href = "mailto:" + s.email;
    $("c-facebook").href = s.facebook;
    $("c-hours").textContent = s.hours;
    $("qc-whatsapp").href = "https://wa.me/" + waNumber();
    $("qc-viber").href = "viber://chat?number=%2B" + waNumber();
  }

  function fillTypeSelect() {
    var sel = $("f-type");
    sel.innerHTML = '<option value="">აირჩიეთ ტიპი</option>';
    state.categories.forEach(function (c) {
      var o = document.createElement("option"); o.value = o.textContent = c.label; sel.appendChild(o);
    });
    var o = document.createElement("option"); o.value = o.textContent = "ჯერ არ ვიცი, მჭირდება რჩევა"; sel.appendChild(o);
  }

  // ---------- inquiry form (opens prefilled email) ----------
  var form = $("inquiry-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    $("form-error").hidden = !!(name && phone);
    if (!name || !phone) return;
    var product = form.product.value.trim();

    var subject = "მოთხოვნა საიტიდან" + (product ? " — " + product : "");
    var body = [
      "სახელი: " + name,
      "ტელეფონი: " + phone,
      form.type.value ? "ტიპი: " + form.type.value : null,
      form.city.value ? "ქალაქი: " + form.city.value : null,
      product ? "ნიმუში: " + product : null,
      "",
      form.message.value.trim()
    ].filter(function (l) { return l !== null; }).join("\n");

    window.location.href = "mailto:" + state.settings.email +
      "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  // ---------- washer CTA ----------
  $("washer-cta").addEventListener("click", function () {
    var washerCat = state.products.filter(function (p) { return p.washer; })[0];
    state.category = washerCat ? washerCat.category : "all";
    renderFilters();
    renderGrid();
    $("catalog").scrollIntoView({ behavior: "smooth" });
  });

  // ---------- mobile nav ----------
  var navToggle = $("nav-toggle");
  navToggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  Array.prototype.forEach.call(document.querySelectorAll("#main-nav a"), function (a) {
    a.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // ---------- header shadow + reveal ----------
  window.addEventListener("scroll", function () {
    $("site-header").classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { el.classList.add("in"); });
  }

  $("year").textContent = new Date().getFullYear();

  // ---------- boot ----------
  window.loadKeramoData().then(function (data) {
    state.categories = data.categories;
    state.products = data.products;
    state.settings = data.settings;
    $("stat-products").textContent = state.products.length;
    $("stat-categories").textContent = state.categories.filter(function (c) { return countFor(c.id) > 0; }).length;
    applySettings();
    fillTypeSelect();
    renderMosaic();
    renderFilters();
    renderGrid();
  });
})();
