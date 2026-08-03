/* ================================================================
   Induction Portal, Frontend Interactions
   ================================================================ */

(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ---------- Sticky header shadow on scroll ---------- */
  const header = $(".site-header");
  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  on(window, "scroll", setHeaderState, { passive: true });
  setHeaderState();

  /* ---------- Mobile nav ---------- */
  const navToggle = $(".nav-toggle");
  const mobilePanel = $(".mobile-panel");
  on(navToggle, "click", () => {
    navToggle.classList.toggle("is-open");
    mobilePanel.classList.toggle("is-open");
    const expanded = navToggle.classList.contains("is-open");
    navToggle.setAttribute("aria-expanded", String(expanded));
  });
  // Close on link click (but ignore dropdown triggers, those need to expand the sub-menu)
  $$(".mobile-panel a, .mobile-panel .nav-trigger").forEach((a) =>
    on(a, "click", (e) => {
      if (a.classList.contains("nav-trigger")) return;
      navToggle?.classList.remove("is-open");
      mobilePanel?.classList.remove("is-open");
    })
  );

  /* ---------- Dropdown menus ----------
     Desktop: CSS handles hover.
     Mobile: clicking the trigger toggles accordion via .is-open.
     Closing one closes the others to keep the panel tidy. */
  // Covers nav-list dropdowns AND the Login portal chooser in .nav-cta
  $$(".mobile-panel .has-dropdown > .nav-trigger").forEach((trigger) => {
    on(trigger, "click", (e) => {
      // Only intercept when nav is in mobile mode (matches the panel media query).
      if (window.matchMedia("(max-width: 960px)").matches) {
        e.preventDefault();
        const parent = trigger.closest(".has-dropdown");
        if (!parent) return;
        const wasOpen = parent.classList.contains("is-open");
        // Collapse all then open the chosen one (if it wasn't open)
        $$(".mobile-panel .has-dropdown").forEach(p => p.classList.remove("is-open"));
        if (!wasOpen) parent.classList.add("is-open");
      }
    });
  });
  // Close dropdowns when clicking outside on desktop
  on(document, "click", (e) => {
    if (!e.target.closest(".has-dropdown")) {
      $$(".mobile-panel .has-dropdown.is-open").forEach(p => p.classList.remove("is-open"));
    }
  });

  /* ---------- Active link highlighting ---------- */
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$(".nav-list a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === here || (here === "" && href === "index.html")) {
      a.classList.add("is-active");
    }
  });

  /* ---------- Scroll reveal ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$("[data-count]");
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = parseInt(el.dataset.duration || "1600", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = prefix + value.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && counters.length) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target);
            co.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- Tabs ---------- */
  $$(".tabs").forEach((tabsEl) => {
    const tabs = $$(".tab", tabsEl);
    const container = tabsEl.parentElement;
    const panels = $$(".tab-panel", container);
    tabs.forEach((t, i) =>
      on(t, "click", () => {
        tabs.forEach((x) => x.classList.remove("is-active"));
        panels.forEach((p) => p.classList.remove("is-active"));
        t.classList.add("is-active");
        const id = t.dataset.tab;
        const panel = id ? container.querySelector(`#${id}`) : panels[i];
        panel && panel.classList.add("is-active");
      })
    );
  });

  /* ---------- Accordion ---------- */
  $$(".acc-item").forEach((item) => {
    const trigger = $(".acc-trigger", item);
    const panel = $(".acc-panel", item);
    on(trigger, "click", () => {
      const isOpen = item.classList.toggle("is-open");
      panel.style.maxHeight = isOpen ? panel.scrollHeight + 40 + "px" : "0px";
    });
  });

  /* ---------- Pricing toggle ---------- */
  const priceToggle = $(".price-toggle");
  if (priceToggle) {
    const buttons = $$("button", priceToggle);
    buttons.forEach((btn) =>
      on(btn, "click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const mode = btn.dataset.mode; // 'monthly' | 'annual'
        $$(".price-tag[data-monthly]").forEach((tag) => {
          const m = tag.dataset.monthly;
          const a = tag.dataset.annual;
          const cur = mode === "annual" ? a : m;
          tag.innerHTML = `£${cur}<small>/${mode === "annual" ? "user / yr" : "user / mo"}</small>`;
        });
      })
    );
  }

  /* ---------- Start free trial CTA ----------
     Every `[data-trial]` element now sends the user straight to the live app
     registration URL. The modal markup is left in place for fallback use but
     is no longer opened by default. */
  const TRIAL_URL = "https://app.inductionportal.co.uk/user/registration/steptwo";
  $$("[data-trial]").forEach((el) => on(el, "click", (e) => {
    e.preventDefault();
    // Capture a soft lead locally so the admin queue still picks them up,
    // then redirect. Open in same tab so the journey is clearly a trial signup.
    try {
      const existing = localStorage.getItem("ip_trial_intent_at");
      if (!existing) localStorage.setItem("ip_trial_intent_at", String(Date.now()));
    } catch(err){}
    window.location.href = TRIAL_URL;
  }));
  // Legacy modal close handlers (kept harmless if the modal element exists)
  const modal = $("#trial-modal");
  const closeModal = () => modal && modal.classList.remove("is-open");
  $$("#trial-modal .close, #trial-modal [data-close]").forEach((el) => on(el, "click", closeModal));
  on(modal, "click", (e) => { if (e.target === modal) closeModal(); });
  on(document, "keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- Form fake submit handlers ---------- */
  $$("form[data-form]").forEach((form) => {
    on(form, "submit", (e) => {
      e.preventDefault();
      const status = $(".form-status", form);
      const btn = $("button[type='submit']", form);
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
      setTimeout(() => {
        // === Unified trial signup ===
        // If this is the trial form, also start the Training Hub trial so a single signup
        // unlocks BOTH the screening software AND the training catalogue.
        if (form.matches("[data-trial-form]")) {
          try {
            const lead = {
              name: form.querySelector("#t-name")?.value || "",
              company: form.querySelector("#t-company")?.value || "",
              email: form.querySelector("#t-email")?.value || "",
              phone: form.querySelector("#t-phone")?.value || "",
              sector: form.querySelector("#t-sector")?.value || "",
              source: "website-trial",
              at: Date.now()
            };
            localStorage.setItem("ip_lead", JSON.stringify(lead));
            if (!localStorage.getItem("ip_trial_started_at")) {
              localStorage.setItem("ip_trial_started_at", String(Date.now()));
            }
            localStorage.setItem("ip_screening_trial", "1");
            // TODO: replace with real CRM/backend POST
            // fetch("/api/leads", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(lead) });
            if (status) {
              status.innerHTML = '✅ Trial active. Our team will email you shortly. <br/>Meanwhile, <a href="training/index.html" style="color:var(--c-blue-500);font-weight:700">jump into your free training hub →</a>';
              status.style.color = "var(--c-accent-d)";
            }
          } catch(err) {
            if (status) status.textContent = "Thanks, we'll be in touch within one business day.";
          }
        } else {
          if (status) {
            status.textContent = "Thanks, we'll be in touch within one business day.";
            status.style.color = "var(--c-accent-d)";
          }
        }
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        // Only reset non-trial forms (we want the trial form to show the success state)
        if (!form.matches("[data-trial-form]")) form.reset();
      }, 900);
    });
  });

  /* ---------- Year stamp ---------- */
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
