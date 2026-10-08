(function () {
  "use strict";

  var state = { category: "all" };

  var filtersEl = document.getElementById("filters");
  var gridEl = document.getElementById("tile-grid");
  var emptyEl = document.getElementById("empty-state");

  function countFor(catId) {
    if (catId === "all") return PRODUCTS.length;
    return PRODUCTS.filter(function (p) { return p.category === catId; }).length;
  }

  function renderFilters() {
    var all = [{ id: "all", label: "ყველა პროექტი" }].concat(CATEGORIES);
    filtersEl.innerHTML = "";
    all.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(state.category === cat.id));
      btn.dataset.cat = cat.id;
      btn.innerHTML = cat.label + ' <span class="count">(' + countFor(cat.id) + ")</span>";
      btn.addEventListener("click", function () {
        state.category = cat.id;
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  function productImg(p) {
    return "assets/sinks/" + p.id + ".jpg";
  }

  function renderGrid() {
    var list = state.category === "all"
      ? PRODUCTS
      : PRODUCTS.filter(function (p) { return p.category === state.category; });

    gridEl.innerHTML = "";
    emptyEl.hidden = list.length !== 0;

    list.forEach(function (p) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.setAttribute("aria-label", p.name + " — " + p.size);
      var badge = p.washer ? '<span class="tile-badge">სარეცხ მანქანაზე მორგებული</span>' : '';
      tile.innerHTML =
        '<div class="tile-media">' + badge + '<img src="' + productImg(p) + '" alt="' + p.name + '" loading="lazy"></div>' +
        '<div class="tile-body">' +
          '<p class="tile-collection">' + categoryLabel(p.category) + '</p>' +
          '<h3 class="tile-name">' + p.name + '</h3>' +
          '<p class="tile-meta">' + p.material + ' · ' + p.size + '</p>' +
        '</div>';
      tile.addEventListener("click", function () { openPanel(p); });
      gridEl.appendChild(tile);
    });
  }

  function categoryLabel(id) {
    var found = CATEGORIES.filter(function (c) { return c.id === id; })[0];
    return found ? found.label : id;
  }

  // ---- product panel ----
  var panel = document.getElementById("product-panel");
  var overlay = document.getElementById("panel-overlay");
  var panelClose = document.getElementById("panel-close");
  var lastFocused = null;

  function openPanel(p) {
    document.getElementById("panel-img").src = productImg(p);
    document.getElementById("panel-img").alt = p.name;
    document.getElementById("panel-collection").textContent = categoryLabel(p.category);
    document.getElementById("panel-title").textContent = p.name;
    document.getElementById("panel-material").textContent = p.material;
    document.getElementById("panel-color").textContent = p.color;
    document.getElementById("panel-size").textContent = p.size;
    document.getElementById("panel-note").textContent = p.note || "";
    document.getElementById("panel-note").hidden = !p.note;

    var inquireLink = document.getElementById("panel-inquire");
    inquireLink.onclick = function () {
      closePanel();
      setTimeout(function () {
        var productField = document.getElementById("f-product");
        if (productField) productField.value = p.name;
      }, 350);
    };

    lastFocused = document.activeElement;
    panel.classList.add("open");
    overlay.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
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

  panelClose.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
  });

  // ---- inquiry form (no backend — opens a prefilled email) ----
  var form = document.getElementById("inquiry-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var product = form.product.value.trim();
    var message = form.message.value.trim();

    var subject = "მოთხოვნა KERAMO ART კატალოგიდან" + (product ? " — " + product : "");
    var bodyLines = [
      "სახელი: " + name,
      "ტელეფონი: " + phone,
      product ? "მოდელი: " + product : null,
      "",
      message
    ].filter(function (line) { return line !== null; });

    var mailto = "mailto:info@keramoart.ge" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(bodyLines.join("\n"));

    window.location.href = mailto;
  });

  // ---- "washer-fit" feature CTA ----
  var washerCta = document.getElementById("washer-cta");
  if (washerCta) {
    washerCta.addEventListener("click", function () {
      state.category = "washer";
      renderFilters();
      renderGrid();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
    });
  }

  // ---- footer year ----
  document.getElementById("year").textContent = new Date().getFullYear();

  renderFilters();
  renderGrid();
})();
