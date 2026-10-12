(function () {
  "use strict";

  var cfg = window.KERAMO_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var BUCKET = "products";

  function show(view) {
    ["view-login", "view-reset", "view-config", "view-app"].forEach(function (v) { $(v).hidden = v !== view; });
  }

  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !window.supabase) { show("view-config"); return; }

  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var S = { categories: [], products: [], settings: {}, editing: null, photos: [], removed: [] };

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function imgUrl(u) { return /^(https?:|blob:|data:)/.test(u) ? u : "../" + u; }
  var toastTimer;
  function toast(msg, kind) {
    var t = $("toast");
    t.textContent = msg; t.className = "toast " + (kind || ""); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }
  function fail(err) { console.error(err); toast("შეცდომა: " + (err && err.message ? err.message : err), "err"); }
  function rid() { return Math.random().toString(36).slice(2, 8); }
  function slugify(s) {
    var base = String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
    return (base || "model") + "-" + rid();
  }
  function intOrNull(v) { var n = parseInt(v, 10); return isNaN(n) ? null : n; }
  function tierPrice(cm) {
    var t1 = intOrNull(S.settings.price_tier1) || 850, t2 = intOrNull(S.settings.price_tier2) || 1250;
    if (!cm) return null;
    if (cm <= 120) return t1;
    if (cm <= 160) return t2;
    return null;
  }
  function priceOf(p) { return p.price || tierPrice(p.length_cm); }
  function sizeOf(p) {
    var parts = [p.length_cm, p.depth_cm, p.height_cm].filter(Boolean);
    return parts.length ? parts.join("×") + " სმ" : "ზომა არ არის";
  }
  function catLabel(id) { var c = S.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.label : "—"; }
  function storagePath(url) {
    var marker = "/storage/v1/object/public/" + BUCKET + "/";
    var i = url.indexOf(marker);
    return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
  }

  // ---------- auth ----------
  var recovering = /type=recovery/.test(location.hash);

  sb.auth.onAuthStateChange(function (event, session) {
    if (event === "PASSWORD_RECOVERY") { recovering = true; show("view-reset"); return; }
    if (event === "SIGNED_OUT") { show("view-login"); }
  });

  sb.auth.getSession().then(function (r) {
    if (recovering) { show("view-reset"); return; }
    if (r.data.session) enterApp(); else show("view-login");
  });

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("login-btn"); btn.disabled = true; btn.textContent = "შესვლა...";
    $("login-msg").hidden = true;
    sb.auth.signInWithPassword({ email: $("login-email").value.trim(), password: $("login-password").value })
      .then(function (r) {
        if (r.error) throw r.error;
        return enterApp();
      })
      .catch(function (err) {
        $("login-msg").textContent = /Invalid login/i.test(err.message) ? "ელ.ფოსტა ან პაროლი არასწორია." : err.message;
        $("login-msg").hidden = false;
      })
      .finally(function () { btn.disabled = false; btn.textContent = "შესვლა"; });
  });

  $("forgot-btn").addEventListener("click", function () {
    var email = $("login-email").value.trim();
    if (!email) { $("login-msg").textContent = "ჯერ ჩაწერეთ ელ.ფოსტა."; $("login-msg").hidden = false; return; }
    sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) {
      $("login-msg").textContent = r.error ? r.error.message : "აღდგენის ბმული გამოგზავნილია " + email + "-ზე.";
      $("login-msg").className = "msg" + (r.error ? "" : " ok");
      $("login-msg").hidden = false;
    });
  });

  $("reset-form").addEventListener("submit", function (e) {
    e.preventDefault();
    sb.auth.updateUser({ password: $("reset-password").value }).then(function (r) {
      if (r.error) { $("reset-msg").textContent = r.error.message; $("reset-msg").hidden = false; return; }
      recovering = false;
      history.replaceState(null, "", location.pathname);
      toast("პაროლი შეიცვალა", "ok");
      enterApp();
    });
  });

  $("logout-btn").addEventListener("click", function () { sb.auth.signOut(); });

  function enterApp() {
    return sb.rpc("is_admin").then(function (r) {
      if (r.error) throw r.error;
      if (!r.data) {
        return sb.auth.signOut().then(function () {
          show("view-login");
          $("login-msg").textContent = "ამ ანგარიშს ადმინის უფლება არ აქვს.";
          $("login-msg").hidden = false;
        });
      }
      show("view-app");
      return loadAll();
    }).catch(fail);
  }

  // ---------- tabs ----------
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.setAttribute("aria-selected", String(x === t)); });
      ["products", "categories", "settings"].forEach(function (n) { $("tab-" + n).hidden = n !== t.dataset.tab; });
    });
  });

  // ---------- data ----------
  function loadAll() {
    return Promise.all([
      sb.from("categories").select("*").order("sort"),
      sb.from("products").select("*").order("sort").order("created_at"),
      sb.from("settings").select("*")
    ]).then(function (res) {
      res.forEach(function (r) { if (r.error) throw r.error; });
      S.categories = res[0].data;
      S.products = res[1].data;
      S.settings = {};
      res[2].data.forEach(function (row) { S.settings[row.key] = row.value; });
      renderAll();
    }).catch(fail);
  }

  function renderAll() {
    renderCategoryOptions();
    renderProducts();
    renderCategories();
    renderSettings();
  }

  function renderCategoryOptions() {
    var f = $("p-filter"), cur = f.value;
    f.innerHTML = '<option value="">ყველა კატეგორია</option>' + S.categories.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.label) + "</option>";
    }).join("");
    f.value = cur;
    $("pf-category").innerHTML = '<option value="">— კატეგორიის გარეშე —</option>' + S.categories.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.label) + "</option>";
    }).join("");
  }

  // ---------- products list ----------
  $("p-search").addEventListener("input", renderProducts);
  $("p-filter").addEventListener("change", renderProducts);

  function renderProducts() {
    var q = $("p-search").value.trim().toLowerCase();
    var cat = $("p-filter").value;
    var filtered = !!(q || cat);
    var list = S.products.filter(function (p) {
      return (!cat || p.category === cat) && (!q || (p.name || "").toLowerCase().indexOf(q) !== -1);
    });
    $("p-count").textContent = "(" + S.products.length + ")";
    var el = $("plist");
    if (!list.length) { el.innerHTML = '<p class="empty">პროდუქტები ვერ მოიძებნა.</p>'; return; }
    el.innerHTML = list.map(function (p) {
      var idx = S.products.indexOf(p);
      var cover = p.images && p.images[0] ? '<img src="' + esc(imgUrl(p.images[0])) + '" alt="" loading="lazy">' : '<span class="noimg">ფოტო არ არის</span>';
      return '<div class="prow' + (p.published ? "" : " draft") + '" data-id="' + p.id + '">' +
        '<div class="prow-thumb">' + cover + "</div>" +
        '<div class="prow-main"><strong>' + esc(p.name) + "</strong>" +
          '<span class="muted">' + esc(catLabel(p.category)) + " · " + esc(sizeOf(p)) + ' · <b class="price-tag">' + (priceOf(p) ? priceOf(p) + " ₾" : "შეთანხმებით") + "</b> · " + (p.images ? p.images.length : 0) + " ფოტო" +
          (p.featured ? ' · <b class="tag">ბანერში</b>' : "") + (p.washer ? ' · <b class="tag">სარეცხ მანქ.</b>' : "") + "</span></div>" +
        '<label class="switch" title="საიტზე გამოქვეყნება"><input type="checkbox" data-act="pub"' + (p.published ? " checked" : "") + '><span></span><em>' + (p.published ? "ჩანს" : "დამალულია") + "</em></label>" +
        '<div class="prow-order">' +
          '<button class="icon-btn" data-act="up" title="ზემოთ"' + (filtered || idx === 0 ? " disabled" : "") + ">↑</button>" +
          '<button class="icon-btn" data-act="down" title="ქვემოთ"' + (filtered || idx === S.products.length - 1 ? " disabled" : "") + ">↓</button>" +
        "</div>" +
        '<button class="btn ghost sm" data-act="edit">რედაქტირება</button>' +
      "</div>";
    }).join("");
  }

  $("plist").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn || btn.tagName === "INPUT") return;
    var id = e.target.closest(".prow").dataset.id;
    var p = S.products.filter(function (x) { return x.id === id; })[0];
    if (btn.dataset.act === "edit") openEditor(p);
    if (btn.dataset.act === "up") move(p, -1);
    if (btn.dataset.act === "down") move(p, 1);
  });
  $("plist").addEventListener("change", function (e) {
    if (e.target.dataset.act !== "pub") return;
    var id = e.target.closest(".prow").dataset.id;
    var p = S.products.filter(function (x) { return x.id === id; })[0];
    var val = e.target.checked;
    sb.from("products").update({ published: val }).eq("id", id).then(function (r) {
      if (r.error) return fail(r.error);
      p.published = val; renderProducts();
      toast(val ? "„" + p.name + "“ გამოქვეყნდა" : "„" + p.name + "“ დაიმალა", "ok");
    });
  });

  function move(p, dir) {
    var i = S.products.indexOf(p), j = i + dir;
    if (j < 0 || j >= S.products.length) return;
    S.products.splice(i, 1); S.products.splice(j, 0, p);
    renderProducts();
    persistOrder(S.products, "products");
  }

  function persistOrder(list, table) {
    var jobs = [];
    list.forEach(function (row, k) {
      if (row.sort !== k) { row.sort = k; jobs.push(sb.from(table).update({ sort: k }).eq("id", row.id)); }
    });
    return Promise.all(jobs).then(function (res) {
      var err = res.filter(function (r) { return r.error; })[0];
      if (err) fail(err.error);
    });
  }

  // ---------- editor ----------
  var form = $("product-form");

  $("new-product-btn").addEventListener("click", function () { openEditor(null); });
  $("editor-close").addEventListener("click", closeEditor);
  $("editor-cancel").addEventListener("click", closeEditor);
  $("editor-overlay").addEventListener("click", closeEditor);

  function openEditor(p) {
    S.editing = p;
    S.removed = [];
    S.photos = (p && p.images ? p.images : []).map(function (u) { return { url: u }; });
    $("editor-title").textContent = p ? "რედაქტირება — " + p.name : "ახალი მოდელი";
    form.reset();
    form.name.value = p ? p.name : "";
    form.category.value = p ? (p.category || "") : (S.categories[0] ? S.categories[0].id : "");
    form.material.value = p ? (p.material || "") : "კერამოგრანიტი";
    form.color.value = p ? (p.color || "") : "";
    form.size.value = p ? (p.size || "") : "";
    form.length_cm.value = p && p.length_cm ? p.length_cm : "";
    form.depth_cm.value = p && p.depth_cm ? p.depth_cm : "";
    form.height_cm.value = p && p.height_cm ? p.height_cm : "";
    form.price.value = p && p.price ? p.price : "";
    form.note.value = p ? (p.note || "") : "";
    form.washer.checked = p ? !!p.washer : false;
    form.featured.checked = p ? !!p.featured : false;
    form.published.checked = p ? !!p.published : true;
    $("delete-product-btn").hidden = !p;
    renderPhotos();
    updatePricePreview();
    $("editor-overlay").hidden = false;
    $("editor").classList.add("open");
    $("editor").setAttribute("aria-hidden", "false");
    setTimeout(function () { form.name.focus(); }, 250);
  }

  function closeEditor() {
    S.photos.forEach(function (ph) { if (ph.preview) URL.revokeObjectURL(ph.preview); });
    $("editor").classList.remove("open");
    $("editor").setAttribute("aria-hidden", "true");
    $("editor-overlay").hidden = true;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("editor").classList.contains("open")) closeEditor();
  });

  function updatePricePreview() {
    var cm = intOrNull(form.length_cm.value), manual = intOrNull(form.price.value), auto = tierPrice(cm);
    var wall = intOrNull(S.settings.price_wall) || 150;
    var html;
    if (manual) html = "საიტზე ფასი: <b>" + manual + " ₾</b> (ხელით მითითებული)";
    else if (auto) html = "საიტზე ფასი: <b>" + auto + " ₾</b> — ავტომატურად, " + (cm <= 120 ? "1.2 მ-მდე" : "1.2–1.6 მ") + " · კედელზე მიყენება +" + wall + " ₾";
    else if (cm) html = "1.6 მეტრზე მეტია — საიტზე ეწერება <b>„ფასი შეთანხმებით“</b>, ან მიუთითეთ ფასი ხელით.";
    else html = "მიუთითეთ სიგრძე — ფასი ავტომატურად გამოითვლება.";
    $("price-preview").innerHTML = html;
  }
  form.length_cm.addEventListener("input", updatePricePreview);
  form.price.addEventListener("input", updatePricePreview);

  // photos
  function renderPhotos() {
    var el = $("photos");
    el.innerHTML = S.photos.map(function (ph, k) {
      return '<div class="photo" draggable="true" data-k="' + k + '">' +
        '<img src="' + esc(ph.preview || imgUrl(ph.url)) + '" alt="">' +
        (k === 0 ? '<span class="cover-tag">მთავარი</span>' : "") +
        (ph.file ? '<span class="new-tag">ახალი</span>' : "") +
        '<div class="photo-actions">' +
          '<button type="button" class="icon-btn" data-ph="left" title="მარცხნივ"' + (k === 0 ? " disabled" : "") + ">←</button>" +
          (k !== 0 ? '<button type="button" class="icon-btn" data-ph="cover" title="მთავარ ფოტოდ">★</button>' : "") +
          '<button type="button" class="icon-btn" data-ph="right" title="მარჯვნივ"' + (k === S.photos.length - 1 ? " disabled" : "") + ">→</button>" +
          '<button type="button" class="icon-btn danger" data-ph="del" title="წაშლა">✕</button>' +
        "</div></div>";
    }).join("");
  }

  $("photos").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ph]"); if (!b) return;
    var k = +b.closest(".photo").dataset.k;
    var act = b.dataset.ph;
    if (act === "del") {
      var ph = S.photos.splice(k, 1)[0];
      if (ph.preview) URL.revokeObjectURL(ph.preview);
      if (ph.url) S.removed.push(ph.url);
    } else if (act === "cover") {
      S.photos.unshift(S.photos.splice(k, 1)[0]);
    } else {
      var j = act === "left" ? k - 1 : k + 1;
      var tmp = S.photos[k]; S.photos[k] = S.photos[j]; S.photos[j] = tmp;
    }
    renderPhotos();
  });

  // drag & drop reorder
  var dragK = null;
  $("photos").addEventListener("dragstart", function (e) {
    var p = e.target.closest(".photo"); if (!p) return;
    dragK = +p.dataset.k; e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(dragK));
  });
  $("photos").addEventListener("dragover", function (e) { if (dragK !== null) e.preventDefault(); });
  $("photos").addEventListener("drop", function (e) {
    var p = e.target.closest(".photo"); if (!p || dragK === null) return;
    e.preventDefault();
    var to = +p.dataset.k;
    S.photos.splice(to, 0, S.photos.splice(dragK, 1)[0]);
    dragK = null; renderPhotos();
  });
  $("photos").addEventListener("dragend", function () { dragK = null; });

  function addFiles(files) {
    Array.prototype.forEach.call(files, function (f) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast("მხოლოდ JPG, PNG ან WEBP ფოტოები", "err"); return; }
      S.photos.push({ file: f, preview: URL.createObjectURL(f) });
    });
    renderPhotos();
  }
  $("photo-input").addEventListener("change", function (e) { addFiles(e.target.files); e.target.value = ""; });
  var dz = $("dropzone");
  ["dragenter", "dragover"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { if (dragK === null) { e.preventDefault(); dz.classList.add("over"); } });
  });
  ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove("over"); }); });
  dz.addEventListener("drop", function (e) { if (dragK === null) { e.preventDefault(); addFiles(e.dataTransfer.files); } });

  function compress(file) {
    var MAX = 1800;
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, MAX / Math.max(w, h));
        var c = document.createElement("canvas");
        c.width = Math.round(w * s); c.height = Math.round(h * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { resolve(b || file); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { resolve(file); };
      img.src = URL.createObjectURL(file);
    });
  }

  function uploadPending(folder, onProgress) {
    var pending = S.photos.filter(function (ph) { return ph.file; });
    var done = 0;
    return pending.reduce(function (chain, ph) {
      return chain.then(function () {
        return compress(ph.file).then(function (blob) {
          var path = folder + "/" + Date.now() + "-" + rid() + ".jpg";
          return sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" }).then(function (r) {
            if (r.error) throw r.error;
            ph.url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
            URL.revokeObjectURL(ph.preview);
            delete ph.file; delete ph.preview;
            onProgress(++done, pending.length);
          });
        });
      });
    }, Promise.resolve());
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    if (!name) { form.name.focus(); return; }
    var btn = $("save-product-btn");
    btn.disabled = true;
    var p = S.editing;
    var folder = p ? (p.slug || p.id) : slugify(name);

    uploadPending(folder, function (d, n) { btn.textContent = "ფოტოები " + d + "/" + n + "..."; })
      .then(function () {
        btn.textContent = "ინახება...";
        var row = {
          name: name,
          category: form.category.value || null,
          material: form.material.value.trim() || null,
          color: form.color.value.trim() || null,
          size: form.size.value.trim() || null,
          length_cm: intOrNull(form.length_cm.value),
          depth_cm: intOrNull(form.depth_cm.value),
          height_cm: intOrNull(form.height_cm.value),
          price: intOrNull(form.price.value),
          note: form.note.value.trim() || null,
          washer: form.washer.checked,
          featured: form.featured.checked,
          published: form.published.checked,
          images: S.photos.map(function (ph) { return ph.url; })
        };
        if (p) return sb.from("products").update(row).eq("id", p.id).select().single();
        row.slug = folder;
        row.sort = S.products.length;
        return sb.from("products").insert(row).select().single();
      })
      .then(function (r) {
        if (r.error) throw r.error;
        if (p) S.products[S.products.indexOf(p)] = r.data; else S.products.push(r.data);
        var paths = S.removed.map(storagePath).filter(Boolean);
        if (paths.length) sb.storage.from(BUCKET).remove(paths);
        S.removed = [];
        renderProducts();
        closeEditor();
        toast(p ? "ცვლილებები შენახულია" : "ახალი მოდელი დაემატა", "ok");
      })
      .catch(function (err) { renderPhotos(); fail(err); })
      .finally(function () { btn.disabled = false; btn.textContent = "შენახვა"; });
  });

  $("delete-product-btn").addEventListener("click", function () {
    var p = S.editing; if (!p) return;
    if (!confirm("წავშალო „" + p.name + "“? ეს ქმედება შეუქცევადია.")) return;
    sb.from("products").delete().eq("id", p.id).then(function (r) {
      if (r.error) return fail(r.error);
      var paths = (p.images || []).map(storagePath).filter(Boolean);
      if (paths.length) sb.storage.from(BUCKET).remove(paths);
      S.products.splice(S.products.indexOf(p), 1);
      renderProducts(); closeEditor();
      toast("„" + p.name + "“ წაიშალა", "ok");
    });
  });

  // ---------- categories ----------
  function renderCategories() {
    $("clist").innerHTML = S.categories.map(function (c, k) {
      var n = S.products.filter(function (p) { return p.category === c.id; }).length;
      return '<div class="crow" data-id="' + esc(c.id) + '">' +
        '<input class="clabel" value="' + esc(c.label) + '" aria-label="კატეგორიის სახელი">' +
        '<span class="muted">' + n + " პროდუქტი</span>" +
        '<button class="icon-btn" data-c="up"' + (k === 0 ? " disabled" : "") + ">↑</button>" +
        '<button class="icon-btn" data-c="down"' + (k === S.categories.length - 1 ? " disabled" : "") + ">↓</button>" +
        '<button class="icon-btn danger" data-c="del" title="წაშლა">✕</button>' +
      "</div>";
    }).join("") || '<p class="empty">კატეგორიები არ არის.</p>';
  }

  $("clist").addEventListener("change", function (e) {
    if (!e.target.classList.contains("clabel")) return;
    var id = e.target.closest(".crow").dataset.id;
    var label = e.target.value.trim(); if (!label) return;
    sb.from("categories").update({ label: label }).eq("id", id).then(function (r) {
      if (r.error) return fail(r.error);
      S.categories.filter(function (c) { return c.id === id; })[0].label = label;
      renderCategoryOptions(); renderProducts();
      toast("სახელი შეიცვალა", "ok");
    });
  });

  $("clist").addEventListener("click", function (e) {
    var b = e.target.closest("[data-c]"); if (!b) return;
    var id = b.closest(".crow").dataset.id;
    var c = S.categories.filter(function (x) { return x.id === id; })[0];
    var i = S.categories.indexOf(c);
    if (b.dataset.c === "del") {
      if (!confirm("წავშალო კატეგორია „" + c.label + "“? მისი პროდუქტები დარჩება კატეგორიის გარეშე.")) return;
      sb.from("categories").delete().eq("id", id).then(function (r) {
        if (r.error) return fail(r.error);
        S.categories.splice(i, 1);
        S.products.forEach(function (p) { if (p.category === id) p.category = null; });
        renderAll(); toast("კატეგორია წაიშალა", "ok");
      });
      return;
    }
    var j = b.dataset.c === "up" ? i - 1 : i + 1;
    S.categories.splice(j, 0, S.categories.splice(i, 1)[0]);
    renderCategories(); renderCategoryOptions();
    persistOrder(S.categories, "categories");
  });

  $("cat-add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var label = $("cat-new-label").value.trim(); if (!label) return;
    var row = { id: slugify(label), label: label, sort: S.categories.length };
    sb.from("categories").insert(row).select().single().then(function (r) {
      if (r.error) return fail(r.error);
      S.categories.push(r.data);
      $("cat-new-label").value = "";
      renderAll(); toast("კატეგორია დაემატა", "ok");
    });
  });

  // ---------- settings ----------
  function renderSettings() {
    var f = $("settings-form");
    ["phone", "whatsapp", "email", "facebook", "hours", "price_tier1", "price_tier2", "price_wall"].forEach(function (k) { f[k].value = S.settings[k] || ""; });
  }
  $("settings-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var rows = ["phone", "whatsapp", "email", "facebook", "hours", "price_tier1", "price_tier2", "price_wall"].map(function (k) { return { key: k, value: f[k].value.trim() }; });
    sb.from("settings").upsert(rows).then(function (r) {
      if (r.error) return fail(r.error);
      rows.forEach(function (row) { S.settings[row.key] = row.value; });
      renderProducts();
      toast("შენახულია", "ok");
    });
  });
})();
