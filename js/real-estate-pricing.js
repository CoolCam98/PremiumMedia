(() => {
  /* =========================================================
     PRICING CONFIG — edit prices here.
     Each price array lines up with TIERS (smallest home first).
  ========================================================= */
  const TIERS = [
    { max: 1500, label: "Up to 1,500 sq ft" },
    { max: 2500, label: "1,501 – 2,500 sq ft" },
    { max: 3500, label: "2,501 – 3,500 sq ft" },
    { max: 5000, label: "3,501 – 5,000 sq ft" },
    { max: 5999, label: "5,001 – 5,999 sq ft" },
  ];
  const QUOTE_AT = 6000; // slider value at/above this shows "custom quote"
  const MINIMUM_ORDER = 99;

  // perPhoto: true → priced per edited photo, with a quantity stepper.
  const SERVICES = [
    { id: "photos", name: "HDR Photography", desc: "Interior + exterior, Blue Sky Guarantee", prices: [139, 169, 209, 259, 319] },
    { id: "drone", name: "Drone Photos", desc: "Aerial stills of the home and lot", prices: [99, 99, 99, 99, 99] },
    { id: "droneVideo", name: "Drone Video", desc: "Aerial clips, add to any video", prices: [149, 149, 149, 149, 149] },
    { id: "video", name: "Listing Video", desc: "Walkthrough video with music", prices: [299, 329, 369, 419, 479] },
    { id: "tour", name: "3D Virtual Tour", desc: "Interactive walkthrough", prices: [149, 179, 219, 269, 329] },
    { id: "floorplan", name: "2D Floor Plan", desc: "Labeled rooms and dimensions", prices: [69, 89, 109, 139, 169] },
    { id: "twilight", name: "Virtual Twilight", desc: "Per photo", prices: [29, 29, 29, 29, 29], perPhoto: true },
    { id: "staging", name: "Virtual Staging", desc: "Per photo", prices: [35, 35, 35, 35, 35], perPhoto: true },
  ];

  const PACKAGES = [
    {
      name: "Essentials",
      tagline: "Clean, bright photos to get the listing live.",
      prices: [149, 179, 219, 269, 329],
      includes: { photos: 1, twilight: 1 },
    },
    {
      name: "Signature",
      tagline: "The package most agents book.",
      prices: [279, 319, 369, 429, 499],
      includes: { photos: 1, drone: 1, floorplan: 1, twilight: 1 },
      featured: true,
    },
    {
      name: "Premier",
      tagline: "Everything, for listings that need to stand out.",
      prices: [699, 759, 839, 939, 1059],
      includes: { photos: 1, drone: 1, droneVideo: 1, video: 1, tour: 1, floorplan: 1, twilight: 1 },
    },
  ];

  /* ========================================================= */

  const range = document.getElementById("sqft-range");
  const output = document.getElementById("sqft-output");
  const tierLabel = document.querySelector("[data-tier-label]");
  const packagesEl = document.querySelector("[data-packages]");
  const alacarteEl = document.querySelector("[data-alacarte]");
  const totalEl = document.querySelector("[data-custom-total]");
  const noteEl = document.querySelector("[data-custom-note]");
  const customBook = document.querySelector("[data-custom-book]");
  const selectionField = document.querySelector("[data-selection-field]");
  if (!range || !packagesEl || !alacarteEl) return;

  const money = (n) => "$" + n.toLocaleString("en-US");
  const fmtSqft = (n) => n.toLocaleString("en-US") + (n >= QUOTE_AT ? "+" : "") + " sq ft";
  const byId = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const qty = Object.fromEntries(SERVICES.map((s) => [s.id, 0]));

  const tierIndex = (sqft) => {
    const i = TIERS.findIndex((t) => sqft <= t.max);
    return i === -1 ? TIERS.length - 1 : i;
  };
  const isQuote = () => Number(range.value) >= QUOTE_AT;

  const setSelection = (text) => {
    if (selectionField) selectionField.value = text;
  };

  const sqftText = () => fmtSqft(Number(range.value));

  // ---- Package cards ----
  const renderPackages = () => {
    packagesEl.innerHTML = PACKAGES.map((p, pi) => {
      const rows = SERVICES.map((s) => {
        const on = Boolean(p.includes[s.id]);
        const label = s.perPhoto && on ? `${s.name} (${p.includes[s.id]} photo)` : s.name;
        return `<li class="${on ? "is-in" : "is-out"}"><span class="visually-hidden">${on ? "Included:" : "Not included:"}</span>${label}</li>`;
      }).join("");
      return `
        <article class="re-package${p.featured ? " re-package--featured" : ""}">
          ${p.featured ? '<p class="re-package__badge">Most Popular</p>' : ""}
          <h3>${p.name}</h3>
          <p class="re-package__tagline">${p.tagline}</p>
          <p class="re-package__price"><span data-pkg-price="${pi}"></span></p>
          <p class="re-package__save" data-pkg-save="${pi}"></p>
          <ul class="re-package__list">${rows}</ul>
          <a href="#book" class="btn ${p.featured ? "btn-primary" : "btn-outline"} re-package__cta" data-pkg-book="${pi}">Book ${p.name}</a>
        </article>`;
    }).join("");

    packagesEl.querySelectorAll("[data-pkg-book]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = PACKAGES[Number(btn.dataset.pkgBook)];
        const price = isQuote() ? "custom quote" : money(p.prices[tierIndex(Number(range.value))]);
        setSelection(`${p.name} package, ${sqftText()} (${price})`);
      });
    });
  };

  // ---- À la carte list ----
  const renderAlacarte = () => {
    alacarteEl.innerHTML = SERVICES.map((s) => `
      <li class="re-item" data-item="${s.id}">
        <label class="re-item__main">
          <input type="checkbox" data-check="${s.id}" />
          <span class="re-item__text"><strong>${s.name}</strong><small>${s.desc}</small></span>
        </label>
        ${s.perPhoto ? `
          <span class="re-qty" aria-label="${s.name} quantity">
            <button type="button" data-dec="${s.id}" aria-label="Fewer ${s.name} photos">&minus;</button>
            <span data-qty="${s.id}">0</span>
            <button type="button" data-inc="${s.id}" aria-label="More ${s.name} photos">+</button>
          </span>` : ""}
        <span class="re-item__price" data-item-price="${s.id}"></span>
      </li>`).join("");

    alacarteEl.addEventListener("change", (e) => {
      const id = e.target.dataset.check;
      if (!id) return;
      qty[id] = e.target.checked ? Math.max(1, qty[id]) : 0;
      update();
    });
    alacarteEl.addEventListener("click", (e) => {
      const inc = e.target.dataset.inc;
      const dec = e.target.dataset.dec;
      if (inc) qty[inc] = Math.min(25, qty[inc] + 1);
      if (dec) qty[dec] = Math.max(0, qty[dec] - 1);
      if (inc || dec) update();
    });
  };

  const alacarteSum = (includes, t) =>
    Object.entries(includes).reduce((sum, [id, n]) => sum + byId[id].prices[t] * n, 0);

  // ---- Update everything for the current slider value ----
  const update = () => {
    const sqft = Number(range.value);
    const t = tierIndex(sqft);
    const quote = isQuote();

    output.textContent = fmtSqft(sqft);
    tierLabel.textContent = quote ? "6,000+ sq ft (custom quote)" : TIERS[t].label;
    const pct = ((sqft - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty("--fill", pct + "%");

    PACKAGES.forEach((p, pi) => {
      const priceEl = packagesEl.querySelector(`[data-pkg-price="${pi}"]`);
      const saveEl = packagesEl.querySelector(`[data-pkg-save="${pi}"]`);
      if (quote) {
        priceEl.textContent = "Custom quote";
        saveEl.textContent = "Call us for large homes";
        return;
      }
      priceEl.textContent = money(p.prices[t]);
      const save = alacarteSum(p.includes, t) - p.prices[t];
      saveEl.textContent = save > 0 ? `Save ${money(save)} vs. à la carte` : "";
    });

    let total = 0;
    const picked = [];
    SERVICES.forEach((s) => {
      const n = qty[s.id];
      const row = alacarteEl.querySelector(`[data-item="${s.id}"]`);
      row.classList.toggle("is-selected", n > 0);
      alacarteEl.querySelector(`[data-check="${s.id}"]`).checked = n > 0;
      const qEl = alacarteEl.querySelector(`[data-qty="${s.id}"]`);
      if (qEl) qEl.textContent = n;
      const priceEl = alacarteEl.querySelector(`[data-item-price="${s.id}"]`);
      priceEl.textContent = quote ? "Quote" : money(s.prices[t]) + (s.perPhoto ? "/photo" : "");
      if (n > 0) {
        total += s.prices[t] * n;
        picked.push(s.perPhoto ? `${s.name} x${n}` : s.name);
      }
    });

    if (quote) {
      totalEl.textContent = "Custom quote";
      noteEl.textContent = "Homes 6,000+ sq ft are priced by quote.";
    } else if (!picked.length) {
      totalEl.textContent = money(0);
      noteEl.textContent = "Select services to see your total.";
    } else if (total < MINIMUM_ORDER) {
      totalEl.textContent = money(MINIMUM_ORDER);
      noteEl.textContent = `Services add up to ${money(total)}. Orders have a ${money(MINIMUM_ORDER)} minimum.`;
      total = MINIMUM_ORDER;
    } else {
      totalEl.textContent = money(total);
      noteEl.textContent = `${picked.length} service${picked.length > 1 ? "s" : ""} for ${sqftText()}`;
    }

    customBook.dataset.summary = picked.length
      ? `Custom: ${picked.join(", ")}, ${sqftText()} (${quote ? "custom quote" : money(total)})`
      : "";
  };

  customBook.addEventListener("click", () => {
    if (customBook.dataset.summary) setSelection(customBook.dataset.summary);
  });

  renderPackages();
  renderAlacarte();
  range.addEventListener("input", update);
  update();
})();
