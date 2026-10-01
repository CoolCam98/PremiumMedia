(() => {
  /* =========================================================
     PRICING CONFIG — edit prices here.
     Every price array lines up with TIERS (smallest home first).
     A null price means "custom quote" at that size.
  ========================================================= */
  const TIERS = [
    { max: 1000, label: "Up to 1,000 sq ft", photos: "15–20" },
    { max: 2000, label: "1,001 – 2,000 sq ft", photos: "30–35" },
    { max: 3000, label: "2,001 – 3,000 sq ft", photos: "45–50" },
    { max: 4000, label: "3,001 – 4,000 sq ft", photos: "60–65" },
    { max: 5000, label: "4,001 – 5,000 sq ft", photos: "75–80" },
  ];
  const QUOTE_ABOVE = 5000; // homes larger than this are priced by quote

  const flat = (n) => [n, n, n, n, n];

  // group: services in the same group replace each other (pick one).
  // perPhoto / perUnit: priced per item, with a quantity stepper.
  const SERVICE_GROUPS = [
    {
      title: "Photography",
      items: [
        { id: "hdr", name: "HDR Photography", desc: "Hand-blended HDR interior and exterior photos", prices: [150, 170, 190, 210, 245], group: "photo", photoCount: true },
      ],
    },
    {
      title: "Drone",
      items: [
        { id: "aerial5", name: "5 Aerial Photos", desc: "Includes property pins and boundary outlines", prices: flat(110), group: "aerial" },
        { id: "aerialVideo", name: "Aerial-Only Video (30 sec)", desc: "Branded and MLS-compliant versions", prices: flat(200) },
      ],
    },
    {
      title: "Video",
      items: [
        { id: "walkthrough", name: "Video Walkthrough (45 sec)", desc: "One-take vertical or horizontal video for social media", prices: [130, 130, 130, null, null] },
        { id: "video", name: "Listing Video", desc: "Fast-paced edit with drone shots, branded and unbranded versions", prices: [275, 275, 305, 330, 385] },
        { id: "cinematic", name: "Cinematic Video", desc: "60–120 sec golden-hour film plus a social teaser, agent on camera included", prices: [null, null, 600, 650, 725] },
        { id: "agentCam", name: "Agent-on-Camera Add-On", desc: "Scripting help, coaching, and synced captions", prices: flat(75) },
      ],
    },
    {
      title: "3D Tour",
      items: [
        { id: "zillow", name: "Zillow 3D Home Tour", desc: "Gets the 3D Tour badge and priority placement on Zillow", prices: flat(175) },
      ],
    },
    {
      title: "Extras",
      items: [
        { id: "amenities", name: "Community Amenities", desc: "6–8 photos or video of the pool, clubhouse, gates and more", prices: flat(125) },
        { id: "website", name: "Property Website & Marketing Kit", desc: "Listing website, flyers, and social media graphics", prices: flat(200) },
      ],
    },
  ];

  // Package-only items: included in packages but not sold à la carte.
  // Their prices are only used to work out the "Save" amount on each package.
  const PACKAGE_ONLY = [
    { id: "fp", name: "Basic 2D Floor Plan", prices: flat(50) },
    { id: "twilight", name: "Virtual Twilight", prices: flat(10) },
  ];

  // includes: service id → quantity. The "Save" line compares against these à la carte prices.
  const PACKAGES = [
    {
      name: "Base",
      tagline: "The industry standard: photos, drone, floor plan, and twilight.",
      prices: [235, 235, 260, 280, 320],
      includes: { hdr: 1, aerial5: 1, fp: 1, twilight: 1 },
      features: ["photos", "5 Aerial Photos", "Basic 2D Floor Plan", "Virtual Twilight (1 photo)", "Blue Sky Guarantee", "-Listing Video", "-Zillow 3D Home Tour"],
    },
    {
      name: "Plus Video",
      tagline: "Everything in Base plus a listing video, ready for the MLS and Instagram.",
      prices: [400, 440, 480, 520, 555],
      includes: { hdr: 1, aerial5: 1, fp: 1, twilight: 1, video: 1 },
      features: ["photos", "5 Aerial Photos", "Basic 2D Floor Plan", "Virtual Twilight (1 photo)", "Blue Sky Guarantee", "Listing Video", "-Zillow 3D Home Tour"],
      featured: true,
    },
    {
      name: "Premium Video",
      tagline: "The complete suite, with a Zillow 3D tour for priority placement.",
      prices: [525, 565, 605, 695, 730],
      includes: { hdr: 1, aerial5: 1, fp: 1, twilight: 1, video: 1, zillow: 1 },
      features: ["photos", "5 Aerial Photos", "Basic 2D Floor Plan", "Virtual Twilight (1 photo)", "Blue Sky Guarantee", "Listing Video", "Zillow 3D Home Tour"],
    },
  ];

  /* ========================================================= */

  // Every home-size slider on the page stays in sync with the others.
  const ranges = [...document.querySelectorAll("[data-sqft-range]")];
  const outputs = document.querySelectorAll("[data-sqft-output]");
  const tierLabels = document.querySelectorAll("[data-tier-label]");
  const range = ranges[0];
  const packagesEl = document.querySelector("[data-packages]");
  const alacarteEl = document.querySelector("[data-alacarte]");
  const totalEl = document.querySelector("[data-custom-total]");
  const noteEl = document.querySelector("[data-custom-note]");
  const customBook = document.querySelector("[data-custom-book]");
  const selectionField = document.querySelector("[data-selection-field]");
  const selectedSummary = document.querySelector("[data-selected-summary]");
  const selectedList = document.querySelector("[data-selected-list]");
  const selectedTotal = document.querySelector("[data-selected-total]");
  if (!range || !packagesEl || !alacarteEl) return;

  const SERVICES = SERVICE_GROUPS.flatMap((g) => g.items);
  const byId = Object.fromEntries([...SERVICES, ...PACKAGE_ONLY].map((s) => [s.id, s]));
  const qty = Object.fromEntries(SERVICES.map((s) => [s.id, 0]));
  let selectedPkg = null; // index into PACKAGES, or null

  const money = (n) => "$" + n.toLocaleString("en-US");
  const sqft = () => Number(range.value);
  const isQuote = () => sqft() > QUOTE_ABOVE;
  const fmtSqft = (n) => (n > QUOTE_ABOVE ? "5,000+ sq ft" : n.toLocaleString("en-US") + " sq ft");
  const tierIndex = (n) => {
    const i = TIERS.findIndex((t) => n <= t.max);
    return i === -1 ? TIERS.length - 1 : i;
  };

  // ---- Package cards ----
  const renderPackages = () => {
    packagesEl.innerHTML = PACKAGES.map((p, pi) => {
      const rows = p.features.map((f) => {
        const out = f.startsWith("-");
        const label = f === "photos" ? `<span data-photo-count>Approx. ${TIERS[0].photos}</span> HDR Photos` : out ? f.slice(1) : f;
        return `<li class="${out ? "is-out" : "is-in"}"><span class="visually-hidden">${out ? "Not included:" : "Included:"}</span>${label}</li>`;
      }).join("");
      return `
        <article class="re-package${p.featured ? " re-package--featured" : ""}">
          ${p.featured ? '<p class="re-package__badge">Most Popular</p>' : ""}
          <h3>${p.name}</h3>
          <p class="re-package__tagline">${p.tagline}</p>
          <p class="re-package__price"><span data-pkg-price="${pi}"></span></p>
          <p class="re-package__save" data-pkg-save="${pi}"></p>
          <ul class="re-package__list" id="pkg-list-${pi}">${rows}</ul>
          <button type="button" class="re-package__more" data-pkg-more aria-expanded="false" aria-controls="pkg-list-0 pkg-list-1 pkg-list-2">Show more</button>
          <a href="#book" class="btn ${p.featured ? "btn-primary" : "btn-outline"} re-package__cta" data-pkg-book="${pi}">Book<span class="re-package__cta-name"> ${p.name}</span></a>
        </article>`;
    }).join("");

    // Phones: the feature lists start collapsed. One tap expands all three
    // so the side-by-side cards stay level.
    packagesEl.querySelectorAll("[data-pkg-more]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const open = packagesEl.classList.toggle("is-expanded");
        packagesEl.querySelectorAll("[data-pkg-more]").forEach((b) => {
          b.textContent = open ? "Show less" : "Show more";
          b.setAttribute("aria-expanded", String(open));
        });
      });
    });

    // One package at a time; à la carte picks can be added on top.
    packagesEl.querySelectorAll("[data-pkg-book]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedPkg = Number(btn.dataset.pkgBook);
        update();
      });
    });
  };

  // ---- À la carte list ----
  const renderAlacarte = () => {
    alacarteEl.innerHTML = SERVICE_GROUPS.map((g) => `
      <li class="re-group">
        <p class="re-group__title">${g.title}${g.note ? ` <span>${g.note}</span>` : ""}</p>
        <ul class="re-group__items">
          ${g.items.map((s) => `
            <li class="re-item" data-item="${s.id}">
              <label class="re-item__main">
                <input type="checkbox" id="svc-${s.id}" data-check="${s.id}" />
                <span class="re-item__text"><strong>${s.name}</strong><small data-item-desc="${s.id}">${s.desc}</small></span>
              </label>
              ${s.perUnit ? `
                <span class="re-qty">
                  <button type="button" data-dec="${s.id}" aria-label="Fewer: ${s.name}">&minus;</button>
                  <span data-qty="${s.id}" aria-live="polite">0</span>
                  <button type="button" data-inc="${s.id}" aria-label="More: ${s.name}">+</button>
                </span>` : ""}
              <span class="re-item__price" data-item-price="${s.id}"></span>
            </li>`).join("")}
        </ul>
      </li>`).join("");

    const select = (id, n) => {
      const s = byId[id];
      if (n > 0 && s.group) {
        SERVICES.forEach((o) => {
          if (o.group === s.group && o.id !== id) qty[o.id] = 0;
        });
      }
      qty[id] = n;
    };

    alacarteEl.addEventListener("change", (e) => {
      const id = e.target.dataset.check;
      if (!id) return;
      select(id, e.target.checked ? Math.max(1, qty[id]) : 0);
      update();
    });
    alacarteEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.inc) select(btn.dataset.inc, Math.min(50, qty[btn.dataset.inc] + 1));
      if (btn.dataset.dec) select(btn.dataset.dec, Math.max(0, qty[btn.dataset.dec] - 1));
      update();
    });
  };

  const alacarteSum = (includes, t) =>
    Object.entries(includes).reduce((sum, [id, n]) => sum + byId[id].prices[t] * n, 0);

  // ---- Update everything for the current slider value ----
  const update = () => {
    const n = sqft();
    const t = tierIndex(n);
    const quote = isQuote();

    const tierText = quote ? "Over 5,000 sq ft (custom quote)" : `${TIERS[t].label} · approx. ${TIERS[t].photos} photos`;
    outputs.forEach((el) => (el.textContent = fmtSqft(n)));
    tierLabels.forEach((el) => (el.textContent = tierText));
    ranges.forEach((r) => {
      r.value = n;
      r.style.setProperty("--fill", ((n - r.min) / (r.max - r.min)) * 100 + "%");
    });

    packagesEl.querySelectorAll("[data-photo-count]").forEach((el) => {
      el.textContent = quote ? "80+" : `Approx. ${TIERS[t].photos}`;
    });
    PACKAGES.forEach((p, pi) => {
      const priceEl = packagesEl.querySelector(`[data-pkg-price="${pi}"]`);
      const saveEl = packagesEl.querySelector(`[data-pkg-save="${pi}"]`);
      priceEl.classList.toggle("is-quote", quote);
      if (quote) {
        priceEl.textContent = "Custom quote";
        saveEl.textContent = "Call us for homes over 5,000 sq ft";
        return;
      }
      priceEl.textContent = money(p.prices[t]);
      const save = alacarteSum(p.includes, t) - p.prices[t];
      saveEl.innerHTML = save > 0 ? `Save ${money(save)}<span class="re-package__save-more"> vs. booking separately</span>` : "";
    });

    let total = 0;
    let needsQuote = quote;
    const picked = [];
    SERVICES.forEach((s) => {
      const count = qty[s.id];
      const price = quote ? null : s.prices[t];
      const row = alacarteEl.querySelector(`[data-item="${s.id}"]`);
      row.classList.toggle("is-selected", count > 0);
      alacarteEl.querySelector(`[data-check="${s.id}"]`).checked = count > 0;
      const qEl = alacarteEl.querySelector(`[data-qty="${s.id}"]`);
      if (qEl) qEl.textContent = count;
      const desc = alacarteEl.querySelector(`[data-item-desc="${s.id}"]`);
      desc.textContent = s.photoCount && !quote ? `${s.desc} · approx. ${TIERS[t].photos} photos` : s.desc;
      alacarteEl.querySelector(`[data-item-price="${s.id}"]`).textContent =
        price === null ? "Quote" : money(price) + (s.perUnit ? `/${s.perUnit}` : "");
      if (count > 0) {
        if (price === null) needsQuote = true;
        else total += price * count;
        picked.push(s.perUnit ? `${s.name} x${count}` : s.name);
      }
    });

    if (!picked.length) {
      totalEl.textContent = money(0);
      noteEl.textContent = "Select services to see your total.";
    } else if (needsQuote) {
      totalEl.textContent = quote ? "Custom quote" : money(total) + "+";
      noteEl.textContent = quote
        ? "Homes over 5,000 sq ft are priced by quote."
        : "One of your picks isn't offered at this size, so we'll send a custom quote for it.";
    } else {
      totalEl.textContent = money(total);
      noteEl.textContent = `${picked.length} service${picked.length > 1 ? "s" : ""} for ${fmtSqft(n)}`;
    }

    renderSelection(t, quote);
  };

  // ---- "Selected services" dropdown on the booking form ----
  // Mirrors the package and à la carte picks. Unticking a line here
  // removes it from the calculator too.
  const renderSelection = (t, quote) => {
    packagesEl.querySelectorAll(".re-package").forEach((card, pi) => {
      card.classList.toggle("is-selected", pi === selectedPkg);
    });
    if (!selectedList) return;

    const lines = [];
    if (selectedPkg !== null) {
      const p = PACKAGES[selectedPkg];
      lines.push({ key: "pkg", name: `${p.name} Package`, price: quote ? null : p.prices[t] });
    }
    SERVICES.forEach((s) => {
      const count = qty[s.id];
      if (!count) return;
      const price = quote || s.prices[t] === null ? null : s.prices[t] * count;
      lines.push({ key: s.id, name: s.perUnit ? `${s.name} x${count}` : s.name, price });
    });

    const priceText = (p) => (p === null ? "Quote" : money(p));
    const sum = lines.reduce((acc, l) => acc + (l.price || 0), 0);
    const anyQuote = lines.some((l) => l.price === null);
    const totalText = anyQuote ? (sum ? money(sum) + " + quote" : "Custom quote") : money(sum);

    selectedList.innerHTML = lines.length
      ? lines.map((l) => `
          <li>
            <label>
              <input type="checkbox" checked data-unselect="${l.key}" />
              <span>${l.name}</span>
              <span class="re-selected__price">${priceText(l.price)}</span>
            </label>
          </li>`).join("")
      : '<li class="re-selected__empty">Pick a package or tick services in the price calculator above.</li>';

    selectedSummary.textContent = lines.length
      ? lines.length === 1 ? lines[0].name : `${lines.length} services selected`
      : "No services selected yet";
    selectedTotal.textContent = lines.length ? `Home size: ${fmtSqft(sqft())} · Estimated total: ${totalText}` : "";

    if (selectionField) {
      selectionField.value = lines.length
        ? `${lines.map((l) => `${l.name} (${priceText(l.price)})`).join("; ")}; Home size: ${fmtSqft(sqft())}; Estimated total: ${totalText}`
        : "";
    }
  };

  if (selectedList) {
    selectedList.addEventListener("change", (e) => {
      const key = e.target.dataset.unselect;
      if (!key) return;
      if (key === "pkg") selectedPkg = null;
      else qty[key] = 0;
      update();
    });
  }

  renderPackages();
  renderAlacarte();
  ranges.forEach((r) =>
    r.addEventListener("input", () => {
      range.value = r.value;
      update();
    })
  );
  update();
})();
