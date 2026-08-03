/* =================================================================
   Induction Portal — Premium interactions (additive, landing page)
   Loaded AFTER main.js. Adds: scroll-progress bar, hero aurora,
   pointer-driven 3D tilt on the hero dashboard, and a subtle
   "magnetic" pull on the primary hero CTA. All effects are guarded
   by prefers-reduced-motion and fail safe if elements are absent.
   ================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  /* ---- Scroll progress bar ---- */
  var bar = document.createElement("div");
  bar.id = "ip-progress";
  document.body.appendChild(bar);
  var ticking = false;
  function updateProgress() {
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 1;
    var pct = Math.min(100, Math.max(0, (h.scrollTop || window.scrollY) / max * 100));
    bar.style.width = pct + "%";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---- Hero aurora (decorative depth layer) ---- */
  var hero = document.querySelector(".hero");
  if (hero && !reduce && !hero.querySelector(".ip-aurora")) {
    var aurora = document.createElement("div");
    aurora.className = "ip-aurora";
    aurora.setAttribute("aria-hidden", "true");
    hero.insertBefore(aurora, hero.firstChild);
  }

  /* ---- 3D tilt on the hero dashboard mock ---- */
  var visual = document.querySelector(".hero-visual");
  var dash = visual && visual.querySelector(".dash");
  if (visual && dash && !reduce && fine) {
    var raf = null, tx = 0, ty = 0;
    function apply() {
      dash.style.transform = "rotateY(" + tx + "deg) rotateX(" + ty + "deg)";
      raf = null;
    }
    visual.addEventListener("mousemove", function (e) {
      var r = visual.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      var py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 9;          // max ~4.5deg each way
      ty = -py * 7;
      visual.classList.add("is-tilting");
      if (!raf) raf = requestAnimationFrame(apply);
    });
    visual.addEventListener("mouseleave", function () {
      tx = 0; ty = 0;
      visual.classList.remove("is-tilting");
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* ---- Subtle magnetic pull on the primary hero CTA ---- */
  if (!reduce && fine) {
    var cta = document.querySelector(".hero-cta .btn--primary");
    if (cta) {
      var craf = null, cx = 0, cy = 0;
      function moveCta() { cta.style.transform = "translate(" + cx + "px," + cy + "px)"; craf = null; }
      cta.addEventListener("mousemove", function (e) {
        var r = cta.getBoundingClientRect();
        cx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        cy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        if (!craf) craf = requestAnimationFrame(moveCta);
      });
      cta.addEventListener("mouseleave", function () {
        cx = 0; cy = 0; if (!craf) craf = requestAnimationFrame(moveCta);
      });
    }
  }

  /* ---- Rotating hero headline word ---- */
  var rot = document.querySelector(".ip-rotator[data-words]");
  if (rot && !reduce) {
    var words = rot.getAttribute("data-words").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (words.length > 1) {
      var span = document.createElement("span");
      span.className = "ip-word";
      span.textContent = rot.textContent.trim();
      rot.textContent = "";
      rot.appendChild(span);
      var wi = words.indexOf(span.textContent);
      if (wi < 0) wi = 0;
      setInterval(function () {
        rot.classList.add("is-swapping");
        setTimeout(function () {
          wi = (wi + 1) % words.length;
          span.textContent = words[wi];
          rot.classList.remove("is-swapping");
        }, 400);
      }, 2600);
    }
  }

  /* ---- Trusted-by marquee: duplicate the row for a seamless loop ---- */
  var track = document.querySelector("[data-marquee]");
  if (track && !reduce && track.children.length) {
    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
    track.classList.add("is-marquee");
  }

  /* ---- Live dashboard: a check clears every few seconds ---- */
  var dashEl = document.querySelector(".hero-visual .dash");
  if (dashEl && !reduce) {
    var rows = Array.prototype.slice.call(dashEl.querySelectorAll(".dash-row"));
    var clearedStat = dashEl.querySelector(".dash-stat b[data-count='1893']");
    var clearedVal = 1893;
    var idx = 0;
    setInterval(function () {
      var row = rows[idx % rows.length];
      idx++;
      var pill = row && row.querySelector(".pill");
      if (!pill) return;
      var original = pill.textContent;
      var originalCls = pill.className;
      // Only animate rows that aren't already a permanent "Cleared/Verified"
      if (/pending|flag/.test(originalCls)) {
        pill.classList.add("ip-verifying");
        pill.textContent = "Verifying…";
        setTimeout(function () {
          pill.className = "pill ok";
          pill.textContent = "Cleared";
          row.classList.add("ip-live-hit");
          if (clearedStat) {
            clearedVal += 1;
            clearedStat.textContent = clearedVal.toLocaleString("en-GB");
          }
          setTimeout(function () {
            row.classList.remove("ip-live-hit");
            pill.className = originalCls;   // reset so the loop can replay
            pill.textContent = original;
          }, 2600);
        }, 1100);
      }
    }, 4200);
  }

  /* ---- Animated "how it works" walkthrough ---- */
  var process = document.querySelector(".process");
  if (process) {
    var steps = Array.prototype.slice.call(process.querySelectorAll(".step"));
    if (steps.length) {
      process.classList.add("ip-steps");
      // Sequentially "light up" each card in time with its badge popping in.
      function lightUp() {
        steps.forEach(function (step, i) {
          setTimeout(function () {
            step.classList.add("ip-lit");
            setTimeout(function () { step.classList.remove("ip-lit"); }, 900);
          }, 150 + i * 330);
        });
      }
      if (reduce) {
        process.classList.add("is-in");           // show final state, no motion
      } else if ("IntersectionObserver" in window) {
        var pObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              process.classList.add("is-in");
              lightUp();
              pObs.disconnect();
            }
          });
        }, { threshold: 0.35 });
        pObs.observe(process);
      } else {
        process.classList.add("is-in");
      }
    }
  }

  /* ---- Testimonials carousel ---- */
  var testis = document.querySelector(".testimonials");
  if (testis) {
    var quotes = Array.prototype.slice.call(testis.querySelectorAll(".quote"));
    if (quotes.length > 1) {
      testis.classList.add("ip-carousel");
      // In a horizontal carousel the off-screen slides never trip main.js's
      // vertical scroll-reveal observer, so reveal them all up front.
      quotes.forEach(function (q) { q.classList.add("is-in"); });

      // Build controls: prev / dots / next
      var ctrl = document.createElement("div");
      ctrl.className = "ip-carousel-ctrl";
      var prev = document.createElement("button");
      prev.type = "button"; prev.setAttribute("aria-label", "Previous testimonial"); prev.innerHTML = "&#8249;";
      var dots = document.createElement("div");
      dots.className = "ip-carousel-dots"; dots.setAttribute("role", "tablist");
      var next = document.createElement("button");
      next.type = "button"; next.setAttribute("aria-label", "Next testimonial"); next.innerHTML = "&#8250;";
      ctrl.appendChild(prev); ctrl.appendChild(dots); ctrl.appendChild(next);
      testis.parentNode.insertBefore(ctrl, testis.nextSibling);

      var dotEls = quotes.map(function (_, i) {
        var d = document.createElement("i");
        d.setAttribute("role", "tab");
        d.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        if (i === 0) d.className = "is-active";
        dots.appendChild(d);
        return d;
      });

      var current = 0, timer = null;
      function goTo(i, smooth) {
        current = (i + quotes.length) % quotes.length;
        var q = quotes[current];
        testis.scrollTo({ left: q.offsetLeft - (testis.clientWidth - q.clientWidth) / 2,
                          behavior: (smooth === false || reduce) ? "auto" : "smooth" });
        dotEls.forEach(function (d, j) { d.className = (j === current) ? "is-active" : ""; });
      }
      function nextSlide() { goTo(current + 1); }
      function prevSlide() { goTo(current - 1); }

      next.addEventListener("click", function () { nextSlide(); restart(); });
      prev.addEventListener("click", function () { prevSlide(); restart(); });
      dotEls.forEach(function (d, i) { d.addEventListener("click", function () { goTo(i); restart(); }); });

      // Keep the active dot in sync when the user scroll-swipes manually
      var sTick = false;
      testis.addEventListener("scroll", function () {
        if (sTick) return; sTick = true;
        requestAnimationFrame(function () {
          var mid = testis.scrollLeft + testis.clientWidth / 2;
          var best = 0, bestD = Infinity;
          quotes.forEach(function (q, i) {
            var c = q.offsetLeft + q.clientWidth / 2;
            var dd = Math.abs(c - mid);
            if (dd < bestD) { bestD = dd; best = i; }
          });
          if (best !== current) {
            current = best;
            dotEls.forEach(function (d, j) { d.className = (j === current) ? "is-active" : ""; });
          }
          sTick = false;
        });
      }, { passive: true });

      function start() { if (!reduce) timer = setInterval(nextSlide, 6000); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function restart() { stop(); start(); }
      testis.addEventListener("mouseenter", stop);
      testis.addEventListener("mouseleave", start);
      testis.addEventListener("focusin", stop);
      // Pause the autoplay when the section is off-screen
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
        }, { threshold: 0.2 }).observe(testis);
      } else {
        start();
      }
    }
  }
})();
