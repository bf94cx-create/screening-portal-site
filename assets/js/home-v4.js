/* home-v4 interactions: faithful vanilla port of the designer prototype's
   runtime (dc-component source). Every demo the prototype had: matrix view
   toggle + tooltips + manual-record form, course module tabs + tutor chat +
   listen, certificate tabs, member search, reveals, counters, rail, chart
   animations, hero parallax. */
(function () {
  "use strict";
  var S = window.__V4_STATES || {};
  var speakingBtn = null;

  var TIP_DATES = { 0: ["Assigned 12 Jun 2026", "Not started", "No certificate yet"], 1: ["Completed 02 Aug 2025", "Expires 02 Sep 2026", "Renewal reminder sent"], 2: ["Completed 14 Jun 2026", "Valid until 14 Jun 2027", "Certificate on file"], 3: ["Completed 09 Mar 2024", "Expired 09 Mar 2026", "Action needed"] };

  /* ---------- generic helpers ---------- */
  function swap(sectionId, html) {
    var el = document.getElementById(sectionId);
    if (!el || !html) return false;
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    var next = tmp.firstElementChild;
    el.replaceWith(next);
    return true;
  }
  function on(root, sel, evt, fn) {
    (root.querySelectorAll ? root : document).querySelectorAll(sel).forEach(function (el) { el.addEventListener(evt, fn); });
  }
  function byText(root, sel, re) {
    return [].filter.call(root.querySelectorAll(sel), function (el) { return re.test((el.textContent || "").trim()); });
  }

  /* ---------- tooltip (reconstructed from the prototype's placeTip) ---------- */
  var tip = document.createElement("div");
  tip.id = "ip-tip";
  tip.style.cssText = "position:fixed;z-index:200;max-width:300px;background:#0E2A6B;color:#fff;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.5;box-shadow:0 18px 40px rgba(7,20,50,.4);pointer-events:none;display:none;font-family:'Plus Jakarta Sans',sans-serif";
  document.body.appendChild(tip);
  function showTip(title, status, statusColor, lines, ev) {
    tip.innerHTML = "<div style='font-weight:800;margin-bottom:2px'>" + title + "</div>" +
      "<div style='font-weight:700;color:" + statusColor + "'>" + status + "</div>" +
      lines.map(function (l) { return "<div style='opacity:.85'>" + l + "</div>"; }).join("");
    tip.style.display = "block";
    placeTip(ev.clientX, ev.clientY);
  }
  function placeTip(x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight, vw = innerWidth, vh = innerHeight;
    tip.style.left = Math.max(8, Math.min(x + 18, vw - w - 12)) + "px";
    tip.style.top = (y + 16 + h > vh ? Math.max(12, y - h - 16) : Math.max(12, y - 16)) + "px";
  }
  function hideTip() { tip.style.display = "none"; }

  /* ---------- MATRIX ---------- */
  var matrixManual = [];   // manual entries survive view switches
  function wireMatrix() {
    var mx = document.getElementById("matrix");
    if (!mx) return;
    byText(mx, "button,[role=button]", /^week one$/i).forEach(function (b) {
      b.style.cursor = "pointer";
      b.addEventListener("click", function () { if (swap("matrix", S.matrix_day1)) wireMatrix(); });
    });
    byText(mx, "button,[role=button]", /^after 30 days$/i).forEach(function (b) {
      b.style.cursor = "pointer";
      b.addEventListener("click", function () { if (swap("matrix", S.matrix_day30)) wireMatrix(); });
    });
    byText(mx, "button,[role=button]", /record training manually/i).forEach(function (b) {
      b.addEventListener("click", function () { if (swap("matrix", S.matrix_form_open)) wireMatrix(); });
    });
    byText(mx, "button,[role=button]", /^cancel$/i).forEach(function (b) {
      b.addEventListener("click", function () { if (swap("matrix", S.matrix_day30)) wireMatrix(); });
    });
    // save: demo behaviour = show the captured with-manual state
    byText(mx, "button,[role=button]", /^save record$/i).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var t = mx.querySelector("input");
        if (t && !t.value.trim()) { t.focus(); t.style.outline = "2px solid #F5B93B"; return; }
        if (swap("matrix", S.matrix_with_manual)) wireMatrix();
      });
    });
    // tooltips on every status chip (glyph or coloured cell)
    mx.querySelectorAll("[title]").forEach(function (cell) {
      var label = cell.getAttribute("title");
      if (!label || label.indexOf("\u00b7") === -1) return;
      var status = label.split("\u00b7").pop().trim();
      var v = /Complete and in date/i.test(status) ? 2 : /Expires/i.test(status) ? 1 : /Expired/i.test(status) ? 3 : 0;
      var colors = { 0: "#8FA3CC", 1: "#F5B93B", 2: "#10B981", 3: "#EF4444" };
      cell.addEventListener("mouseenter", function (ev) { showTip(label.split("\u00b7")[1] || "Course", status, colors[v], [label.split("\u00b7")[0].trim()].concat(TIP_DATES[v]), ev); });
      cell.addEventListener("mousemove", function (ev) { placeTip(ev.clientX, ev.clientY); });
      cell.addEventListener("mouseleave", hideTip);
    });
  }

  /* ---------- COURSE demo: module tabs + tutor chat + listen ---------- */
  function wireCourse() {
    var c = document.getElementById("course");
    if (!c) return;
    [/^1\./, /^2\./, /^3\./, /^4\./].forEach(function (re, i) {
      byText(c, "button,[role=button],li", re).forEach(function (t) {
        t.style.cursor = "pointer";
        t.addEventListener("click", function (e) {
          if (e.target && e.target.closest && [].some.call(c.querySelectorAll("button"), function (q) { return q.contains(e.target) && (q.textContent || "").trim().slice(-1) === "?"; })) return;
          if (swap("course", S["course_m" + i])) wireCourse();
        });
      });
    });
    // tutor Q&A: each question chip reveals ITS OWN answer, with the
    // prototype's 900ms typing pause (answers ported verbatim from the
    // designer's component source)
    var QA = {
      "Who counts as a responsible person?": "The employer for employees, and whoever is in control of the premises for sole traders and members of the public. On a shared site that is normally the principal contractor. If you supervise the shift, you report it up the same day.",
      "Is an accident book entry enough?": "No. The accident book is your internal record and is required under social security law. RIDDOR is a separate report to the enforcing authority, and only some incidents meet the threshold. Keep both.",
      "What if I am not sure it is reportable?": "Record it internally straight away and escalate. The categories are set out in the regulations, and your duty holder decides. Late reports are treated far more seriously than cautious ones.",
      "How long do we keep records?": "Accident records are kept for at least three years from the date of the last entry. Records of reportable incidents are kept for at least three years too, and most companies keep them longer where a claim is possible.",
      "Can officers see each other's entries?": "No. Accident book pages are removed and stored securely, because they contain personal data about health. Only those who need them for investigation or reporting should have access.",
      "Does a near miss get reported?": "Only if it falls in the dangerous occurrences list, for example a lifting equipment failure or an accidental release of a substance. Everything else is an internal record, and a good one is still worth keeping.",
      "The officer is agency staff, who reports?": "The employer of the injured person reports the injury, so normally the agency. The site controller still reports dangerous occurrences on their premises, and both keep an internal record.",
      "What makes an investigation credible to an assessor?": "A dated record, evidence attached, a named investigator, an action with an owner and a completion date, and proof the action happened. Everything else reads as a box ticking exercise."
    };
    function bubble(who, text) {
      var d = document.createElement("div");
      if (who === "you") {
        d.style.cssText = "align-self:flex-end;max-width:85%;background:#0E2A6B;color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;line-height:1.5";
      } else {
        d.style.cssText = "align-self:flex-start;max-width:90%;background:#EEF3FF;color:#13203E;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13px;line-height:1.5";
      }
      d.textContent = text;
      return d;
    }
    function chatLog() {
      var existing = c.querySelector("[data-v4-chatlog]");
      if (existing) return existing;
      var label = byText(c, "div,p,span", /^ask about this module$/i)[0];
      var log = document.createElement("div");
      log.setAttribute("data-v4-chatlog", "1");
      log.style.cssText = "display:flex;flex-direction:column;gap:10px;margin:12px 0";
      if (label && label.parentElement) label.parentElement.insertBefore(log, label);
      else c.appendChild(log);
      return log;
    }
    window.__qaBound = 0;
    Object.keys(QA).forEach(function (q) {
      // plain string comparison: no regex construction to go wrong
      [].filter.call(c.querySelectorAll("button,[role=button],div"), function (el) {
        return (el.textContent || "").trim() === q;
      })
        .forEach(function (chip) {
          window.__qaBound++;
          chip.style.cursor = "pointer";
          chip.addEventListener("click", function (e) {
            e.stopPropagation();
            window.__qaClicked = (window.__qaClicked || 0) + 1;
            try {
            var log = chatLog();
            log.appendChild(bubble("you", q));
            var typing = bubble("tutor", "…");
            log.appendChild(typing);
            typing.scrollIntoView({ block: "nearest", behavior: "smooth" });
            setTimeout(function () {
              typing.textContent = QA[q];
              typing.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }, 900);
            } catch (err) { window.__qaErr = String(err && err.stack || err); }
          });
        });
    });
    // Listen buttons: real speech synthesis, en-GB, matching the prototype
    byText(c, "button,[role=button]", /listen/i).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!("speechSynthesis" in window)) return;
        var synth = window.speechSynthesis;
        if (synth.speaking) { synth.cancel(); if (speakingBtn === b) { speakingBtn = null; return; } }
        var region = b.closest("div");
        var text = region ? region.parentElement.textContent.replace(/Listen( to this module)?/gi, "").slice(0, 1200) : "";
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 0.98; u.pitch = 1; u.lang = "en-GB";
        speakingBtn = b;
        u.onend = function () { speakingBtn = null; };
        synth.speak(u);
      });
    });
    byText(c, "button,[role=button],div", /clear conversation/i).forEach(function (b) {
      b.style.cursor = "pointer";
      b.addEventListener("click", function () {
        var log = c.querySelector("[data-v4-chatlog]");
        if (log) log.remove();
      });
    });
  }

  /* ---------- CERTIFICATES: tab switching ---------- */
  function wireCerts() {
    var c = document.getElementById("certificates");
    if (!c) return;
    [[/course completion/i, "certs_v0"], [/business membership/i, "certs_v1"], [/gold shield|star gold/i, "certs_v2"]].forEach(function (pair) {
      byText(c, "button,[role=button]", pair[0]).forEach(function (t) {
        t.style.cursor = "pointer";
        t.addEventListener("click", function () { if (swap("certificates", S[pair[1]])) wireCerts(); });
      });
    });
  }

  /* ---------- CHARTS: animate the funnel + cost bars when scrolled into
     view (chartsOn trigger from the prototype; the snapshot froze them at
     zero). Targets ported verbatim from the component source. ---------- */
  function wireCharts() {
    var ch = document.getElementById("charts");
    if (!ch) return;
    // match bars by their ROW LABELS (index-order broke: the snapshot froze
    // the first funnel bar mid-animation at 22%, not 0%)
    var FUNNEL = [["Assigned", 100], ["Opened within 7 days", 92], ["Exam attempted", 84], ["Passed", 79], ["Certificate downloaded", 76]];
    var COSTS = [["Classroom day rate", 160], ["Per course marketplace", 108.8], ["Enterprise seat licence", 72], ["company plan", 14.4]];
    function barNear(labelText, dim) {
      var label = byText(ch, "div,span", new RegExp("^" + labelText.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&"))).filter(function (el) { return el.children.length === 0; })[0];
      if (!label) return null;
      var row = label.parentElement;
      for (var hop = 0; hop < 4 && row; hop++) {
        var bar = [].find.call(row.querySelectorAll("div"), function (d) {
          var s = d.getAttribute("style") || "";
          return new RegExp(dim + ":\\s*[\\d.]+(%|px)").test(s) && /background/.test(s) && d.children.length === 0;
        });
        if (bar) return bar;
        row = row.parentElement;
      }
      return null;
    }
    function reset() {
      FUNNEL.forEach(function (f) { var b = barNear(f[0], "width"); if (b) b.style.width = "0%"; });
      COSTS.forEach(function (c) { var b = barNear(c[0], "height"); if (b) b.style.height = "0px"; });
    }
    function fire() {
      FUNNEL.forEach(function (f, i) {
        var b = barNear(f[0], "width");
        if (!b) return;
        b.style.transition = "width 1.1s cubic-bezier(.2,.8,.2,1) " + (i * 0.1) + "s";
        b.style.width = f[1] + "%";
      });
      COSTS.forEach(function (c, i) {
        var b = barNear(c[0], "height");
        if (!b) return;
        b.style.transition = "height 1.1s cubic-bezier(.2,.8,.2,1) " + (i * 0.1) + "s";
        b.style.height = c[1] + "px";
      });
    }
    reset();
    if (!("IntersectionObserver" in window)) return fire();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { fire(); io.disconnect(); } });
    }, { threshold: 0.15 });
    io.observe(ch);
  }

  /* ---------- MEMBERS: LIVE register lookup (real portal data via the
     memberLookup function; the fictional demo cards are cleared the first
     time a real search runs) ---------- */
  function wireMembers() {
    var m = document.getElementById("members");
    if (!m) return;
    var input = m.querySelector("input");
    if (!input) return;
    var FN = "https://europe-west2-induction-portal-d0b6a.cloudfunctions.net/memberLookup";
    // the list container = the element with 3+ DIRECT children that each
    // carry a membership id (the five demo cards)
    var list = [].find.call(m.querySelectorAll("div"), function (d) {
      var n = 0;
      [].forEach.call(d.children, function (k) { if (/IPM-[A-Z0-9-]+/.test(k.textContent || "")) n++; });
      return n >= 3;
    });
    if (!list) return;
    var cards = [].filter.call(list.children, function (k) { return /IPM-[A-Z0-9-]+/.test(k.textContent || ""); });
    var cardTpl = cards[0].cloneNode(true);
    var detail = null;   // right-hand panel: located lazily by its prompt text
    function detailPanel() {
      if (detail) return detail;
      var sel = byText(m, "div,span,p", /select a member to verify/i).pop();
      if (!sel) return null;
      // climb to the whole right-hand column: the largest ancestor that does
      // NOT contain the search input (so the left column is never touched)
      var node = sel;
      while (node.parentElement && node.parentElement !== m && !node.parentElement.contains(input)) node = node.parentElement;
      detail = node;
      return detail;
    }
    function fmtDate(t) {
      if (!t) return "—";
      return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }
    function renderDetail(r) {
      var d = detailPanel();
      if (!d) return;
      var active = r.status === "Active";
      d.innerHTML =
        '<div style="padding:26px">' +
        '<div style="display:flex;gap:18px;align-items:flex-start">' +
        '<div style="flex:0 0 auto;width:86px;height:86px"><svg viewBox="0 0 58 58" width="86" height="86"><polygon points="29,2 49,10 56,29 49,48 29,56 9,48 2,29 9,10" fill="' + (active ? "#0E2A6B" : "#C3CCDE") + '" stroke="' + (active ? "#F5B93B" : "#8FA3CC") + '" stroke-width="2.5"/><text x="29" y="26" text-anchor="middle" fill="#fff" font-size="13" font-weight="800" font-family="Plus Jakarta Sans">IP</text><text x="29" y="37" text-anchor="middle" fill="' + (active ? "#F5B93B" : "#EEF3FF") + '" font-size="6.2" letter-spacing="1" font-family="JetBrains Mono">MEMBER</text></svg></div>' +
        '<div style="flex:1">' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:' + (active ? "#0D7A50" : "#B7791F") + '">●&nbsp; MEMBERSHIP ' + r.status.toUpperCase() + "</div>" +
        '<div style="font-size:24px;font-weight:800;color:#13203E;margin:4px 0 2px">' + r.name + "</div>" +
        '<div style="font-size:13.5px;color:#5A6A8C">' + r.plan + "</div>" +
        "</div></div>" +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px">' +
        [["MEMBER SINCE", fmtDate(r.since)], ["RENEWS", r.renews ? fmtDate(r.renews) : "Monthly rolling"], ["WORKFORCE", r.staff + " staff enrolled"], ["MEMBERSHIP ID", r.id]].map(function (kv) {
          return '<div style="background:#F4F6FB;border-radius:12px;padding:12px 16px"><div style="font-size:10px;font-weight:700;letter-spacing:1.6px;color:#5A6A8C">' + kv[0] + '</div><div style="font-size:15px;font-weight:700;color:#13203E;margin-top:3px">' + kv[1] + "</div></div>";
        }).join("") + "</div>" +
        '<div style="margin-top:20px;border-top:1px solid #E3E9F5;padding-top:16px"><div style="font-size:10px;font-weight:700;letter-spacing:1.6px;color:#5A6A8C;margin-bottom:10px">BENEFITS IN FORCE</div>' +
        (active
          ? ["Full catalogue unlocked for all staff", "Training matrix, PDF and Excel export", "Certificate audit pack for ACS assessment", "Registered Member logo for tenders and proposals"]
          : ["Historic certificates remain verifiable", "Renew to restore catalogue access and the member logo"]
        ).map(function (bnf) { return '<div style="font-size:13.5px;color:#13203E;margin:7px 0"><span style="color:' + (active ? "#10B981" : "#B7791F") + ';font-weight:800">✓</span>&nbsp; ' + bnf + "</div>"; }).join("") +
        "</div></div>";
    }
    function renderList(rows) {
      list.innerHTML = "";
      if (!rows.length) {
        var none = document.createElement("div");
        none.style.cssText = "padding:22px;font-size:13.5px;color:#5A6A8C";
        none.textContent = "No member found under that name or IPM number. Check the spelling, or ask the company for their membership certificate.";
        list.appendChild(none);
        return;
      }
      rows.forEach(function (r) {
        var card = cardTpl.cloneNode(true);
        var texts = card.querySelectorAll("*");
        var done = { name: false, sub: false, id: false, chip: false };
        [].forEach.call(texts, function (el) {
          if (el.children.length > 0) return;
          var t = (el.textContent || "").trim();
          if (!t) return;
          if (!done.name && /leon|northgate|vantage|harbour|meridian/i.test(t)) { el.textContent = r.name; done.name = true; }
          else if (!done.sub && /·/.test(t)) { el.textContent = r.plan; done.sub = true; }
          else if (!done.id && /^IPM-/.test(t)) { el.textContent = r.id; done.id = true; }
          else if (!done.chip && /^(Active|Lapsed)$/.test(t)) {
            el.textContent = r.status; done.chip = true;
            if (r.status === "Lapsed") { el.style.background = "#FEF6E7"; el.style.color = "#B7791F"; }
          }
        });
        card.setAttribute("data-v4-member", r.id);
        card.style.cursor = "pointer";
        card.addEventListener("click", function () { renderDetail(r); });
        list.appendChild(card);
      });
    }
    var t;
    input.addEventListener("input", function () {
      clearTimeout(t);
      var q = input.value.trim();
      if (q.length < 2) return;
      t = setTimeout(function () {
        fetch(FN + "?q=" + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (j) { renderList(j.results || []); })
          .catch(function () { /* leave the list as is on network failure */ });
      }, 300);
    });
  }

  /* ---------- SECTOR CARDS: whole card clicks through to the catalogue ---------- */
  function wireSectors() {
    document.querySelectorAll(".v4-slot").forEach(function (slot) {
      var card = slot.closest("div");
      for (var i = 0; i < 3 && card; i++) {
        if (/courses/.test(card.textContent || "") && card.querySelector(".v4-slot")) break;
        card = card.parentElement;
      }
      (card || slot).style.cursor = "pointer";
      (card || slot).addEventListener("click", function () { location.href = "/training/catalogue.html"; });
    });
  }

  /* ---------- CTA targets (robust to nested markup) ---------- */
  function wireCTAs() {
    var map = [
      [/^start free trial$/i, "/training/business.html"],
      [/^see the catalogue$/i, "/training/catalogue.html"],
      [/^browse all courses/i, "/training/catalogue.html"],
      [/^sign in$/i, "/training/login.html"],
      [/^(security guarding|care|construction|commercial & fm)$/i, "/training/catalogue.html"],
      [/^about$/i, "/about.html"],
      [/^contact$/i, "/contact.html"],
      [/^(privacy|terms)$/i, "/training/terms.html"]
    ];
    document.querySelectorAll("a").forEach(function (a) {
      var t = (a.textContent || "").trim().replace(/\s+/g, " ").replace(/→/g, "").trim();
      for (var i = 0; i < map.length; i++) {
        if (map[i][0].test(t)) { a.setAttribute("href", map[i][1]); return; }
      }
    });
  }

  /* ---------- LEFT PROGRESS RAIL (ported from the prototype: appears on
     scroll, fades 1.6s after scrolling stops, one dot per section with the
     active dot gold, dots + arrows navigate; hidden on small/touch) ---------- */
  function wireRail() {
    if (!S.rail) return;
    var SECTIONS = ["top", "matrix", "charts", "catalogue", "course", "certificates", "members", "acs", "value", "cta"];
    // the snapshot may already carry a static copy of the rail: adopt it
    // rather than appending a duplicate behind it
    var rail = document.querySelector('[data-r="rail"]');
    if (!rail) {
      var host = document.createElement("div");
      host.innerHTML = S.rail;
      rail = host.firstElementChild;
      document.body.appendChild(rail);
    }
    // small screens / touch: CSS media handles it reliably
    var mq = document.createElement("style");
    mq.textContent = "@media (max-width:1080px),(pointer:coarse){[data-r=rail]{display:none !important}}";
    document.head.appendChild(mq);
    var kids = [].slice.call(rail.children);
    var up = kids[0], down = kids[kids.length - 1];
    var dots = kids.slice(1, kids.length - 1);
    // the active state lives on each dot's INNER SPAN (12px gold vs 8px grey)
    var spans = dots.map(function (d) { return d.querySelector("span"); });
    var spanStyles = spans.map(function (s) { return s ? s.getAttribute("style") || "" : ""; });
    var goldIdx = spanStyles.findIndex(function (s) { return /245,\s*185,\s*59|F5B93B/i.test(s); });
    var activeCss = goldIdx >= 0 ? spanStyles[goldIdx] : spanStyles[0];
    var idleCss = spanStyles.find(function (s, i) { return i !== goldIdx && s; }) || "";
    var activeIdx = 0;
    function paint() {
      spans.forEach(function (s, i) { if (s) s.setAttribute("style", i === activeIdx ? activeCss : idleCss); });
      dots.forEach(function (d) { d.style.cursor = "pointer"; });
    }
    function goTo(i) {
      i = Math.max(0, Math.min(SECTIONS.length - 1, i));
      var el = document.getElementById(SECTIONS[i]);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { goTo(i); }); });
    if (up) { up.style.cursor = "pointer"; up.addEventListener("click", function () { goTo(activeIdx - 1); }); }
    if (down) { down.style.cursor = "pointer"; down.addEventListener("click", function () { goTo(activeIdx + 1); }); }
    rail.style.opacity = "0"; rail.style.pointerEvents = "none";
    var hideT;
    // capture:true like the prototype, so inner-container scrolls count too
    addEventListener("scroll", function () {
      rail.style.opacity = "1"; rail.style.pointerEvents = "auto";
      clearTimeout(hideT);
      hideT = setTimeout(function () { rail.style.opacity = "0"; rail.style.pointerEvents = "none"; }, 1600);
      var mid = innerHeight * 0.42, act = 0;
      SECTIONS.forEach(function (id, i) {
        var el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mid) act = i;
      });
      if (act !== activeIdx) { activeIdx = act; paint(); }
    }, { passive: true, capture: true });
    paint();
  }

  /* ---------- boot ---------- */
  wireMatrix(); wireCourse(); wireCerts(); wireMembers(); wireSectors(); wireCTAs(); wireRail(); wireCharts();
})();
