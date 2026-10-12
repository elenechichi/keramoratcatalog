// მონაცემების წყარო: Supabase (თუ კონფიგურირებულია), სხვა შემთხვევაში — js/products.js (სარეზერვო).
(function () {
  "use strict";

  var FALLBACK_SETTINGS = {
    phone: "+995 597 32 32 95",
    email: "keramoartcollection@gmail.com",
    facebook: "https://www.facebook.com/profile.php?id=61551452274576",
    hours: "ყოველდღე, 24 საათი — კვირის ყველა დღე",
    area: "მთელი საქართველო",
    price_tier1: "850",
    price_tier2: "1250",
    price_wall: "150"
  };

  function fallback() {
    return {
      source: "static",
      categories: (window.CATEGORIES || []).slice(),
      products: (window.PRODUCTS || []).map(function (p, i) {
        return {
          id: p.id, slug: p.id, name: p.name, category: p.category,
          material: p.material, color: p.color, size: p.size || null,
          length_cm: p.length_cm, depth_cm: p.depth_cm, height_cm: p.height_cm || null, price: p.price || null,
          washer: !!p.washer, featured: ["notte-01", "pietraserena-01", "calacatta-01"].indexOf(p.id) !== -1,
          note: p.note, images: ["assets/sinks/" + p.id + ".jpg"], sort: i, published: true
        };
      }),
      settings: Object.assign({}, FALLBACK_SETTINGS)
    };
  }

  function rest(cfg, path) {
    return fetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path, {
      headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY }
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  window.loadKeramoData = function () {
    var cfg = window.KERAMO_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return Promise.resolve(fallback());

    return Promise.all([
      rest(cfg, "categories?select=id,label,sort&order=sort.asc"),
      rest(cfg, "products?select=*&published=eq.true&order=sort.asc,created_at.asc"),
      rest(cfg, "settings?select=key,value")
    ]).then(function (res) {
      var settings = Object.assign({}, FALLBACK_SETTINGS);
      res[2].forEach(function (row) { if (row.value) settings[row.key] = row.value; });
      return { source: "supabase", categories: res[0], products: res[1], settings: settings };
    }).catch(function (err) {
      console.warn("Supabase მიუწვდომელია, ვიყენებ სტატიკურ მონაცემებს:", err);
      return fallback();
    });
  };
})();
