/* Gully Cricket Trust (R) · site behaviour. No libraries. */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Masthead: solid capsule after 40px, hides on scroll down, returns on scroll up, shows scroll progress */
  var mast = d.querySelector(".mast"), prog = d.querySelector(".prog i"), lastY = scrollY, ticking = false;
  /* Scroll-linked motion: crest rolls, photos drift slower than the page, hero text lifts away.
     Transforms are written straight onto elements (no inherited custom properties, so no subtree
     restyle), and element positions are measured once, not on every frame. */
  var crest = d.querySelector(".bar .brand img"), heroIn = d.querySelector(".hero-in"),
      pars = [].slice.call(d.querySelectorAll(".phead .bg img, .cta .bg img")),
      strip = d.querySelector(".strip"), wide = matchMedia("(min-width: 1000px)"), geo = [];
  function measure() {
    geo = pars.map(function (im) { var r = im.parentElement.getBoundingClientRect(); return { el: im, top: r.top + scrollY, h: r.height }; });
    if (strip) { var r = strip.getBoundingClientRect(); geo.strip = { top: r.top + scrollY, h: r.height }; }
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
    if (strip && geo.strip && wide.matches) {
      var st = geo.strip.top - y;
      if (st + geo.strip.h > 0 && st < h) strip.style.transform = "translate3d(" + ((st + geo.strip.h / 2 - h / 2) * .08).toFixed(1) + "px,0,0)";
    }
  }
  function onScroll() {
    var y = scrollY, max = d.documentElement.scrollHeight - innerHeight;
    mast.classList.toggle("solid", y > 40);
    if (!root.classList.contains("menu-open")) {
      if (y > lastY + 6 && y > 420) mast.classList.add("hide");
      else if (y < lastY - 6 || y < 420) mast.classList.remove("hide");
    }
    if (prog) prog.style.setProperty("--p", max > 0 ? Math.min(y / max, 1) : 0);
    if (!reduce) parallax(y);
    lastY = y; ticking = false;
  }
  if (mast) {
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    mast.addEventListener("focusin", function () { mast.classList.remove("hide"); });
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

  /* Hero video: skipped for reduced motion or data saver; paused whenever the hero is off screen */
  var hv = d.querySelector(".hero-media video");
  if (hv) {
    var save = navigator.connection && navigator.connection.saveData;
    if (reduce || save) { hv.removeAttribute("autoplay"); hv.preload = "none"; hv.pause(); }
    else if ("IntersectionObserver" in window) {
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

  /* Forms: no endpoint wired yet, so say so honestly instead of pretending to submit */
  d.querySelectorAll("form[data-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      var ep = f.getAttribute("action");
      if (!ep || ep === "#") {
        e.preventDefault();
        if (!f.reportValidity || f.reportValidity()) {
          var m = f.querySelector(".form-msg"); if (m) { m.classList.add("show"); m.focus(); }
        }
      }
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
    var c = rows[rows.length - 1].cloneNode(true);
    c.querySelectorAll("input").forEach(function (i) { i.value = ""; i.required = false; });
    list.appendChild(c);
    if (rows.length + 1 >= 15) add.disabled = true;
  });
})();
