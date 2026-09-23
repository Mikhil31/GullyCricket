/* Gully Cricket Trust (R) · site behaviour. No libraries. */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Masthead: stays pinned, turns into the solid capsule after 40px, shows scroll progress */
  var mast = d.querySelector(".mast"), prog = d.querySelector(".prog i"), ticking = false;
  /* Scroll-linked motion: crest rolls, photos drift slower than the page, hero text lifts away.
     Transforms are written straight onto elements (no inherited custom properties, so no subtree
     restyle), and element positions are measured once, not on every frame. */
  var crest = d.querySelector(".bar .brand img"), heroIn = d.querySelector(".hero-in"),
      pars = [].slice.call(d.querySelectorAll(".phead .bg img, .cta .bg img")), geo = [];
  function measure() {
    geo = pars.map(function (im) { var r = im.parentElement.getBoundingClientRect(); return { el: im, top: r.top + scrollY, h: r.height }; });
  }
  measure(); addEventListener("resize", measure); addEventListener("load", measure);
  function parallax(y) {
    var h = innerHeight;
    if (crest) crest.style.transform = "rotate(" + (y * .35 % 360).toFixed(1) + "deg)";
    if (heroIn && y < h * 1.2) { heroIn.style.transform = "translate3d(0," + (-y * .18).toFixed(1) + "px,0)"; heroIn.style.opacity = Math.max(1 - y / (h * .8), 0).toFixed(3); }
    for (var i = 0; i < geo.length; i++) {
      var g = geo[i], top = g.top - y;
      if (top + g.h < 0 || top > h) continue;
      g.el.style.transform = "translate3d(0," + ((top + g.h / 2 - h / 2) * -.18).toFixed(1) + "px,0)";
    }
  }
  function onScroll() {
    var y = scrollY, max = d.documentElement.scrollHeight - innerHeight;
    mast.classList.toggle("solid", y > 40);
    if (prog) prog.style.setProperty("--p", max > 0 ? Math.min(y / max, 1) : 0);
    if (!reduce) parallax(y);
    ticking = false;
  }
  if (mast) {
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* Nav pill: rests on the current page, glides to whatever link is hovered or focused */
  var nav = d.querySelector(".nav"), pill = nav && nav.querySelector(".pill");
  if (pill) {
    var links = [].slice.call(nav.querySelectorAll("a.top")), cur = nav.querySelector('a.top[aria-current="page"]');
    function place(a) {
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      var r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
      nav.style.setProperty("--x", r.left - n.left - 1 + "px");
      nav.style.setProperty("--w", a.offsetWidth + "px");
    }
    function home() { nav.classList.remove("hovering"); links.forEach(function (l) { l.classList.remove("hot"); }); place(cur); }
    links.forEach(function (a) {
      function go() { nav.classList.toggle("hovering", a !== cur); links.forEach(function (l) { l.classList.toggle("hot", l === a); }); place(a); }
      a.addEventListener("mouseenter", go); a.addEventListener("focus", go);
    });
    nav.addEventListener("mouseleave", home); nav.addEventListener("focusout", function (e) { if (!nav.contains(e.relatedTarget)) home(); });
    home();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(home);
    addEventListener("resize", home);
  }

  /* Hero video: the sources are only attached here, so reduced-motion and data-saver visitors
     never download it (they keep the poster). Paused whenever the hero is off screen. */
  var hv = d.querySelector(".hero-media video");
  if (hv) {
    var save = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
    if (!reduce && !save) {
      hv.querySelectorAll("source[data-src]").forEach(function (s) { s.src = s.getAttribute("data-src"); });
      hv.preload = "auto"; hv.load();
    }
    if (!reduce && !save && "IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); } else hv.pause(); }).observe(hv);
    }
  }

  /* Mobile menu */
  var burger = d.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = root.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("menu-open")) { root.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); burger.focus(); }
    });
    d.querySelectorAll(".mnav a").forEach(function (a) { a.addEventListener("click", function () { root.classList.remove("menu-open"); }); });
  }

  /* Reveals. Stagger counted per container. Parent observed for clip reveals. */
  var rv = [].slice.call(d.querySelectorAll("[data-rv]"));
  function show(el) { el.classList.add("in"); }
  if (!("IntersectionObserver" in window) || reduce) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target;
        (t._rv || [t]).forEach(show);
        io.unobserve(t);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) {
      var p = el.parentElement;
      if (el.hasAttribute("data-stagger") || (p && p.hasAttribute("data-group"))) {
        var sibs = [].slice.call(p.children).filter(function (c) { return c.hasAttribute("data-rv"); });
        el.style.setProperty("--d", Math.min(sibs.indexOf(el) * 90, 540) + "ms");
      }
      if (el.getAttribute("data-rv") === "clip" && p) { (p._rv = p._rv || []).push(el); io.observe(p); }
      else io.observe(el);
    });
    /* Fast flicks can skip an IO sample: sweep anything already above the fold */
    var sw;
    function sweep() { clearTimeout(sw); sw = setTimeout(function () {
      var h = innerHeight;
      rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < h) show(el); });
    }, 120); }
    addEventListener("scroll", sweep, { passive: true });
    addEventListener("load", sweep);
  }

  /* Scoreboard count-up */
  var nums = d.querySelectorAll("[data-count]");
  function fmt(n, lang) { return n.toLocaleString("en-IN"); }
  function count(el) {
    var to = +el.getAttribute("data-count");
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1400 + Math.min(to, 7000) / 10;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (nums.length) {
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }); }, { threshold: .6 });
      nums.forEach(function (n) { n.textContent = "0"; cio.observe(n); });
    } else nums.forEach(function (n) { n.textContent = fmt(+n.getAttribute("data-count")); });
  }

  /* Accordion: one open at a time within an accordion root */
  d.querySelectorAll("[data-acc]").forEach(function (acc) {
    var items = acc.querySelectorAll(".acc-i");
    items.forEach(function (it) {
      var q = it.querySelector(".acc-q");
      q.addEventListener("click", function () {
        var was = it.classList.contains("open");
        items.forEach(function (o) { o.classList.remove("open"); o.querySelector(".acc-q").setAttribute("aria-expanded", "false"); });
        if (!was) { it.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
      });
    });
  });

  /* Championship sub-nav highlights the section in view */
  var sub = d.querySelectorAll(".subnav a");
  if (sub.length && "IntersectionObserver" in window) {
    var map = {};
    sub.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          sub.forEach(function (a) { a.classList.remove("on"); });
          var a = map[e.target.id]; if (a) { a.classList.add("on"); var ul = a.closest("ul"); ul.scrollTo({ left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" }); }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = d.getElementById(id); if (s) sio.observe(s); });
  }

  /* Forms: posted as JSON to the trust's Google Apps Script (forms-backend/). Files are sent as
     base64 because Apps Script can't read multipart uploads. A plain text body keeps it a "simple"
     request, so no CORS preflight is needed. With no endpoint set, the form says it isn't connected. */
  var FILE_TYPES = /^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/, MAX_FILE = 4 * 1048576, MAX_FILES = 20;
  function readB64(file) {
    return new Promise(function (ok, fail) {
      var r = new FileReader();
      r.onload = function () { ok({ name: file.name, type: file.type, data: String(r.result).split(",")[1] }); };
      r.onerror = fail; r.readAsDataURL(file);
    });
  }
  d.querySelectorAll("form[data-form]").forEach(function (f) {
    var ep = f.getAttribute("data-endpoint"), msg = f.querySelector(".form-msg"), t0 = Date.now(), busy = false;
    function say(kind, text) { msg.textContent = text; msg.className = "form-msg show " + kind; msg.focus(); }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy || (f.reportValidity && !f.reportValidity())) return;
      if (!ep) { say("off", f.getAttribute("data-msg-off")); return; }
      var fields = {}, files = [];
      new FormData(f).forEach(function (v, k) {
        if (typeof v === "object" && "size" in v) { if (v.size) files.push(v); return; }
        if (k === "terms") v = "Yes";
        fields[k] = fields[k] ? fields[k] + ", " + v : v;
      });
      if (files.length > MAX_FILES || files.some(function (x) { return x.size > MAX_FILE || !FILE_TYPES.test(x.type); })) {
        say("err", f.getAttribute("data-msg-files")); return;
      }
      var btn = f.querySelector('[type="submit"]'), label = btn.innerHTML;
      busy = true; btn.disabled = true; f.classList.add("sending");
      btn.innerHTML = '<span class="spin" aria-hidden="true"></span>' + f.getAttribute("data-msg-sending") + "…";
      Promise.all(files.map(readB64)).then(function (enc) {
        return fetch(ep, { method: "POST", body: JSON.stringify({
          form: f.getAttribute("data-form"), lang: root.lang, page: location.pathname, t: Date.now() - t0, fields: fields, files: enc }) });
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error);
        f.reset(); t0 = Date.now();
        say("ok", f.getAttribute("data-msg-ok").replace("{ref}", res.ref));
      }).catch(function () {
        say("err", f.getAttribute("data-msg-err"));
      }).then(function () {
        busy = false; btn.disabled = false; btn.innerHTML = label; f.classList.remove("sending");
      });
    });
  });


  /* Buttons: a glow that sits on the border right where the cursor is, a soft spotlight, and a small magnetic pull */
  d.querySelectorAll(".btn, .regtabs a").forEach(function (b) {
    var g = d.createElement("span"); g.className = "glow"; g.setAttribute("aria-hidden", "true");
    var sp = d.createElement("span"); sp.className = "spot"; sp.setAttribute("aria-hidden", "true");
    b.appendChild(sp); b.appendChild(g);
    b.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty("--mx", x + "px"); b.style.setProperty("--my", y + "px");
      if (!reduce) {
        b.style.setProperty("--tx", ((x - r.width / 2) * .14).toFixed(1) + "px");
        b.style.setProperty("--ty", ((y - r.height / 2) * .28).toFixed(1) + "px");
      }
    });
    b.addEventListener("pointerleave", function () { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
  });

  /* Player rows: add more */
  var add = d.querySelector("[data-add-player]");
  if (add) add.addEventListener("click", function () {
    var list = d.querySelector(".players"), rows = list.querySelectorAll(".prow");
    if (rows.length >= 15) return;
    var c = rows[rows.length - 1].cloneNode(true), n = rows.length + 1;
    c.querySelectorAll("input").forEach(function (i) {
      i.value = ""; i.required = false;
      i.name = i.name.replace(/player\d+_/, "player" + n + "_");
      i.setAttribute("aria-label", i.getAttribute("aria-label").replace(/\d+$/, n));
    });
    list.appendChild(c);
    if (rows.length + 1 >= 15) add.disabled = true;
  });
})();
