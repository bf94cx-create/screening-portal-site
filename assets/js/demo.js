/* =================================================================
   Induction Portal — product demo scene sequencer (additive)
   Drives the "See it in action" walkthroughs: cycles each demo's
   .ip-scene panels on a per-scene timer, keeps the step chips in
   the copy column highlighted in sync, updates the app chrome
   (SISQS breadcrumb / Training Hub tab bar) per scene, lets
   visitors click a chip to jump, and only plays while on screen.
   Under prefers-reduced-motion it pins the final outcome, static.
   ================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Update the persistent shell around a scene: SISQS breadcrumb text
     and the Training Hub's active bottom tab. */
  function syncChrome(scene) {
    var root = scene.closest ? scene.closest(".ip-demo") : null;
    if (!root) return;
    var crumb = root.querySelector(".vx-crumb");
    var c = scene.getAttribute("data-crumb");
    if (crumb && c) crumb.textContent = c;
    var tabs = root.querySelectorAll(".tp-tab");
    var t = scene.getAttribute("data-tab");
    if (tabs.length && t !== null) {
      var ti = parseInt(t, 10);
      Array.prototype.forEach.call(tabs, function (tab, j) {
        tab.classList.toggle("is-on", j === ti);
      });
    }
  }

  function initDemo(root) {
    var scenes = Array.prototype.slice.call(root.querySelectorAll(".ip-scene"));
    if (!scenes.length) return;
    var row = root.closest(".demo-row");
    var chips = row ? Array.prototype.slice.call(row.querySelectorAll(".ip-demo-steps li")) : [];
    var i = -1, timer = null, playing = false;

    function show(n) {
      i = (n + scenes.length) % scenes.length;
      scenes.forEach(function (s, j) { s.classList.toggle("is-active", j === i); });
      chips.forEach(function (c, j) { c.classList.toggle("is-active", j === i); });
      syncChrome(scenes[i]);
    }
    function durOf(n) {
      return parseInt(scenes[n].getAttribute("data-dur"), 10) || 5000;
    }
    function tick() {
      show(i + 1);
      timer = setTimeout(tick, durOf(i));
    }
    function start() {
      if (playing) return;
      playing = true;
      tick();
    }
    function stop() {
      playing = false;
      if (timer) { clearTimeout(timer); timer = null; }
    }

    if (reduce) {
      // No motion: park on the outcome scene.
      show(scenes.length - 1);
      chips.forEach(function (c, j) {
        c.addEventListener("click", function () { show(j); });
        c.setAttribute("tabindex", "0");
      });
      return;
    }

    show(0);
    chips.forEach(function (c, j) {
      c.setAttribute("tabindex", "0");
      function jump() {
        stop();
        show(j);
        playing = true;
        timer = setTimeout(tick, durOf(i));
      }
      c.addEventListener("click", jump);
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); }
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.25 }).observe(root);
    } else {
      start();
    }
  }

  Array.prototype.slice.call(document.querySelectorAll(".ip-demo")).forEach(initDemo);

  /* ---- Hero takeover: after 5s the dashboard mock plays both tours ----
     Clones each COMPLETE demo (app shell included) into a frame overlaid
     on the hero .dash, crossfades it in, then loops vetting -> training,
     swapping the visible shell and address bar per product. Skipped
     entirely under prefers-reduced-motion (the static dashboard stays). */
  (function heroTour() {
    if (reduce) return;
    var visual = document.querySelector(".hero-visual");
    var dash = visual && visual.querySelector(".dash");
    var srcV = document.getElementById("demo-vetting");
    var srcT = document.getElementById("demo-training");
    if (!visual || !dash || !srcV || !srcT) return;

    var URLS = {
      vetting: "🔒 <b>sisqs.co.uk</b>/vetting/cases",
      training: "🔒 <b>inductionportal.co.uk</b>/training"
    };
    var frame = document.createElement("div");
    frame.className = "demo-frame demo-frame--hero";
    frame.setAttribute("aria-hidden", "true");
    frame.innerHTML =
      '<div class="demo-chrome">' +
        '<span class="cdot r"></span><span class="cdot y"></span><span class="cdot g"></span>' +
        '<span class="demo-url"></span>' +
      '</div>' +
      '<div class="ip-hero-stage"></div>';
    var stage = frame.querySelector(".ip-hero-stage");
    var urlEl = frame.querySelector(".demo-url");

    var clones = {};
    function adopt(src, group) {
      var c = src.cloneNode(true);
      c.removeAttribute("id");
      Array.prototype.forEach.call(c.querySelectorAll(".ip-scene"), function (s) {
        s.classList.remove("is-active");
        s.setAttribute("data-group", group);
      });
      c.style.display = "none";
      stage.appendChild(c);
      clones[group] = c;
    }
    adopt(srcV, "vetting");
    adopt(srcT, "training");
    visual.appendChild(frame);

    var scenes = Array.prototype.slice.call(stage.querySelectorAll(".ip-scene"));
    var i = -1, timer = null, playing = false, revealed = false, onScreen = true;

    function show(n) {
      i = (n + scenes.length) % scenes.length;
      var group = scenes[i].getAttribute("data-group");
      scenes.forEach(function (s, j) { s.classList.toggle("is-active", j === i); });
      clones.vetting.style.display = (group === "vetting") ? "" : "none";
      clones.training.style.display = (group === "training") ? "" : "none";
      urlEl.innerHTML = URLS[group] || "";
      syncChrome(scenes[i]);
    }
    function tick() {
      show(i + 1);
      timer = setTimeout(tick, parseInt(scenes[i].getAttribute("data-dur"), 10) || 5000);
    }
    function start() { if (playing || !revealed) return; playing = true; tick(); }
    function stop() {
      playing = false;
      if (timer) { clearTimeout(timer); timer = null; }
    }

    if ("IntersectionObserver" in window) {
      onScreen = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          onScreen = en.isIntersecting;
          if (revealed) { onScreen ? start() : stop(); }
        });
      }, { threshold: 0.05 }).observe(visual);
    }

    setTimeout(function () {
      revealed = true;
      visual.classList.add("is-swapped");
      if (onScreen) start();
    }, 5000);
  })();
})();
