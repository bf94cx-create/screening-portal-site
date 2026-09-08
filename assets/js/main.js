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

  /* ---------- Enquiry forms ----------
     These used to be "fake submit handlers": preventDefault, a 900 ms pause,
     then "Thanks, we'll be in touch within one business day." and form.reset().
     No request was ever made, so EVERY enquiry and trial request typed into the
     website was silently discarded while the visitor was told it had been sent
     (QA campaign, 2026-09-08). The trial form additionally claimed "Trial
     active" and linked to training/index.html, which does not exist on this
     site (404).

     Until a lead backend is chosen, the form hands the enquiry to the visitor's
     own mail client, fully composed, and the on-screen text never claims a
     delivery the page cannot make. The email address and phone number are shown
     so there is always a route that works. */
  const ENQUIRY_TO = "info@screeningportal.co.uk";
  const ENQUIRY_TEL = "020 8575 5544";
  const REGISTRATION_URL = "https://app.inductionportal.co.uk/user/registration/steptwo";

  const fieldValue = (form, id, label) => {
    const el = form.querySelector("#" + id);
    const v = el && typeof el.value === "string" ? el.value.trim() : "";
    return v ? label + ": " + v + "\n" : "";
  };

  $$("form[data-form]").forEach((form) => {
    on(form, "submit", (e) => {
      e.preventDefault();
      const status = $(".form-status", form);
      const btn = $("button[type='submit']", form);
      const isTrial = form.matches("[data-trial-form]") || !!form.closest("#trial-modal");
      const prefix = isTrial ? "t-" : "c-";

      // Required fields, checked here because the form carries novalidate.
      const missing = [];
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), (el) => {
        if (!el.value || !el.value.trim()) {
          const lbl = form.querySelector('label[for="' + el.id + '"]');
          missing.push(lbl ? lbl.textContent.trim() : (el.name || "a required field"));
          el.setAttribute("aria-invalid", "true");
        } else {
          el.removeAttribute("aria-invalid");
        }
      });
      const emailEl = form.querySelector('input[type="email"]');
      const emailBad = emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim());
      if (emailBad) emailEl.setAttribute("aria-invalid", "true");

      if (missing.length || emailBad) {
        if (status) {
          status.textContent = missing.length
            ? "Please complete: " + missing.join(", ") + "."
            : "Please check the email address.";
          status.style.color = "#a3271f";
          status.setAttribute("role", "alert");
        }
        const firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      const body =
        (isTrial ? "Free trial request from screeningportal.co.uk\n\n" : "Enquiry from screeningportal.co.uk\n\n") +
        fieldValue(form, prefix + "name", "Name") +
        fieldValue(form, prefix + "company", "Company") +
        fieldValue(form, prefix + "email", "Email") +
        fieldValue(form, prefix + "phone", "Phone") +
        fieldValue(form, prefix + "sector", "Sector") +
        fieldValue(form, prefix + "size", "Active workers") +
        fieldValue(form, prefix + "msg", "Message") +
        "\nSent from " + window.location.href + "\n";

      const subject = isTrial ? "Free trial request" : "Website enquiry";
      const mailto = "mailto:" + ENQUIRY_TO +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Opening your email…"; }

      try { window.location.href = mailto; } catch (err) { /* no mail client */ }

      if (status) {
        status.style.color = "";
        status.setAttribute("role", "status");
        status.innerHTML =
          "Your email app should open with this enquiry ready to send. " +
          "If nothing opened, email <a href=\"mailto:" + ENQUIRY_TO + "\">" + ENQUIRY_TO + "</a> " +
          "or call <a href=\"tel:02085755544\">" + ENQUIRY_TEL + "</a>." +
          (isTrial
            ? " <br>To start straight away, <a href=\"" + REGISTRATION_URL + "\" target=\"_blank\" rel=\"noopener\">create your account here</a>."
            : "");
      }

      setTimeout(() => {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
      }, 1200);
      // The form is deliberately NOT reset: the visitor may need to copy the
      // details if their mail client did not open.
    });
  });

  /* ---------- Year stamp ---------- */
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
