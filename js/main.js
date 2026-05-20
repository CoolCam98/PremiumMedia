(() => {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  const initMobileNav = () => {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".mobile-menu");
    const panel = document.querySelector(".mobile-menu__panel");
    const closeBtn = document.querySelector(".mobile-menu__close");

    if (!toggle || !menu || !panel || !closeBtn) return;

    const openMenu = () => {
      menu.hidden = false;
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      closeBtn.focus();
    };

    const closeMenu = () => {
      menu.classList.remove("is-open");
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      toggle.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });

    closeBtn.addEventListener("click", closeMenu);

    menu.addEventListener("click", (e) => {
      if (!panel.contains(e.target)) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) closeMenu();
    });

    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });
  };

  const initActiveNav = () => {
    const links = document.querySelectorAll(".nav-links a");
    if (!links.length) return;

    const path = window.location.pathname.split("/").pop() || "index.html";

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  };

  const initLightbox = () => {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const imgs = document.querySelectorAll(".gallery-img");

    if (!lightbox || !lightboxImg || !imgs.length) return;

    let lastFocusedEl = null;

    lightbox.setAttribute("tabindex", "-1");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Image preview");

    const isOpen = () => lightbox.classList.contains("is-open");

    const open = (imgEl) => {
      lastFocusedEl = document.activeElement;

      lightboxImg.src = imgEl.currentSrc || imgEl.src;
      lightboxImg.alt = imgEl.alt || "Expanded image";
      lightbox.classList.add("is-open");

      lightbox.focus();
      document.body.classList.add("lightbox-open");
    };

    const close = () => {
      lightbox.classList.remove("is-open");
      lightboxImg.src = "";
      document.body.classList.remove("lightbox-open");

      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus();
      }
    };

    imgs.forEach((img) => img.addEventListener("click", () => open(img)));

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target === lightboxImg) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });
  };

  const initNavDropdowns = () => {
    // Desktop: click/keyboard toggle on parent caret buttons
    const items = document.querySelectorAll(".nav-item--has-menu");
    items.forEach((item) => {
      const toggle = item.querySelector(".nav-parent__caret-btn");
      if (!toggle) return;
      const setOpen = (open) => {
        item.dataset.open = open ? "true" : "false";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      };
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = item.dataset.open === "true";
        items.forEach((other) => {
          if (other !== item) {
            other.dataset.open = "false";
            const t = other.querySelector(".nav-parent__caret-btn");
            if (t) t.setAttribute("aria-expanded", "false");
          }
        });
        setOpen(!isOpen);
      });
    });
    // Close any open desktop dropdown on outside click or Escape
    document.addEventListener("click", (e) => {
      items.forEach((item) => {
        if (!item.contains(e.target)) {
          item.dataset.open = "false";
          const t = item.querySelector(".nav-parent__caret-btn");
          if (t) t.setAttribute("aria-expanded", "false");
        }
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        items.forEach((item) => {
          item.dataset.open = "false";
          const t = item.querySelector(".nav-parent__caret-btn");
          if (t) t.setAttribute("aria-expanded", "false");
        });
      }
    });

    // Mobile: collapsible groups
    const groups = document.querySelectorAll(".m-group__toggle");
    groups.forEach((toggle) => {
      const submenu = document.getElementById(toggle.getAttribute("aria-controls"));
      if (!submenu) return;
      toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
        submenu.classList.toggle("is-open", !isOpen);
      });
    });
  };

  onReady(() => {
  initMobileNav();
  initActiveNav();
  initNavDropdowns();
  initLightbox();
  initFormValidationStyles();
});

  const initFormValidationStyles = () => {
  document.querySelectorAll(".contact-form").forEach((form) => {
    form.addEventListener("submit", () => {
      form.classList.add("was-validated");
    });
    // Also catch the case where the browser blocks submit due to invalid fields
    form.addEventListener("invalid", () => {
      form.classList.add("was-validated");
    }, true);
  });
};
})();