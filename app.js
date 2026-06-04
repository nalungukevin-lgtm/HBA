/* =====================================================================
   HBA — site behavior
   Reveal-on-scroll · count-ups · live bars · hero scroll choreography
   (dashboard exit / wordmark drift / canvas lift+fade / sticky nav) ·
   register modal · tryout form · reduced-motion fallback.
   The 3D ball+board itself lives in ball.js; both read the same scroll
   signal (f = scrollY / innerHeight) so they stay in sync.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- reduced motion: short-circuit the whole choreography ----
     The CSS already has a full `body.no-motion` end-state path. */
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCE) document.body.classList.add('no-motion');

  /* HBA WhatsApp number (international format, no + or spaces) — sign-ups land here */
  var HBA_WA = '256772757596';
  function waLink(message) {
    return 'https://wa.me/' + HBA_WA + '?text=' + encodeURIComponent(message);
  }

  /* ---- scroll reveal ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- count-up numbers when scrolled into view ---- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0, dur = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('.countup').forEach(function (el) { cio.observe(el); });
  } else {
    document.querySelectorAll('.countup').forEach(function (el) { el.textContent = el.getAttribute('data-to'); });
  }

  /* ---- live training-load bars ---- */
  var bars = [].slice.call(document.querySelectorAll('.badge-metric .bar'));
  var bases = bars.map(function (b) { return parseFloat(b.style.height) || 50; });
  bars.forEach(function (b) { b.style.height = '6%'; });
  setTimeout(function () { bars.forEach(function (b, i) { b.style.height = bases[i] + '%'; }); }, 280);
  setInterval(function () {
    if (document.body.classList.contains('no-motion')) return;
    bars.forEach(function (b, i) {
      var v = Math.max(22, Math.min(100, bases[i] + (Math.random() * 28 - 14)));
      b.style.height = v.toFixed(0) + '%';
    });
  }, 1150);

  /* ---- entrance reveal failsafe (hidden-tab safe) ---- */
  function revealHero() {
    document.querySelectorAll('.hero .stagger').forEach(function (el) {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
  }
  if (document.visibilityState !== 'visible') revealHero();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') revealHero();
  });
  window.addEventListener('load', function () {
    setTimeout(function () {
      document.querySelectorAll('.hero .stagger').forEach(function (el) {
        if (parseFloat(getComputedStyle(el).opacity) < 0.99) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
    }, 2600);
  });

  /* ---- register modal ---- */
  var modal = document.getElementById('reg-modal');
  if (modal) {
    var regTitle = document.getElementById('reg-title');
    var regForm = document.getElementById('reg-form');
    var regDone = document.getElementById('reg-done');
    var lastFocus = null;
    function openReg(name) {
      lastFocus = document.activeElement;
      regTitle.textContent = name || 'Register';
      regForm.hidden = false; regDone.hidden = true; try { regForm.reset(); } catch (e) {}
      modal.hidden = false; document.body.style.overflow = 'hidden';
      var first = regForm.querySelector('input,select');
      if (first) first.focus();
    }
    function closeReg() {
      modal.hidden = true; document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll('[data-register]').forEach(function (b) {
      b.addEventListener('click', function () { openReg(b.getAttribute('data-register')); });
    });
    document.getElementById('reg-close').addEventListener('click', closeReg);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeReg(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeReg(); });
    // simple focus trap
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || modal.hidden) return;
      var f = modal.querySelectorAll('button,input,select,a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // On submit, hand off to WhatsApp with the details pre-typed to the HBA number.
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(regForm);
      var msg =
        "Hi HBA! I'd like to register for: " + (regTitle.textContent || 'an event') + ".\n" +
        "Athlete: " + (d.get('athlete') || '') + "\n" +
        "Age group: " + (d.get('agegroup') || '') + "\n" +
        "Guardian: " + (d.get('guardian') || '') + "\n" +
        "Email: " + (d.get('email') || '') + "\n" +
        "WhatsApp: " + (d.get('phone') || '');
      window.open(waLink(msg), '_blank', 'noopener');
      regForm.hidden = true; regDone.hidden = false;
    });
  }

  /* ---- tryout (CTA) form ---- */
  var ctaForm = document.getElementById('cta-form');
  if (ctaForm) {
    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (new FormData(ctaForm).get('email')) || '';
      var msg = "Hi HBA! I'd like to request a tryout.\nMy email: " + email;
      window.open(waLink(msg), '_blank', 'noopener');
      var done = document.getElementById('cta-done');
      ctaForm.hidden = true; if (done) done.hidden = false;
    });
  }

  /* ---- scroll-driven hero choreography (DOM beats) ----
     Absolute viewport-unit beats: f = scrollY / innerHeight.
     Drives dashboard exit, wordmark drift, canvas lift+fade, sticky nav.
     The 3D ball+board reads the same f in ball.js. */
  var topnav = document.getElementById('topnav');
  var wm = document.querySelector('.wordmark');
  var dash = document.querySelector('.dash-shell');
  function clamp01(x) { return Math.min(Math.max(x, 0), 1); }
  function eo(t) { return 1 - Math.pow(1 - t, 3); }
  function onScroll() {
    var noMotion = document.body.classList.contains('no-motion');
    var V = window.innerHeight || 1, f = (window.scrollY || 0) / V;   // scroll in viewport-heights
    var heroBall = document.getElementById('hero-ball');
    if (heroBall) {
      heroBall.classList.toggle('lift', f > 1.35);                    // ride above incoming sections
      var docMax = (document.documentElement.scrollHeight - V) / V;   // last scroll pos in vh
      heroBall.style.opacity = noMotion ? 1 : (1 - clamp01((f - (docMax - 0.25)) / 0.25)).toFixed(3);
    }
    if (topnav) topnav.classList.toggle('show', f > 1.5);
    if (noMotion) {
      if (dash) { dash.style.transform = ''; dash.style.opacity = ''; }
      if (wm) { wm.style.transform = 'translateX(-50%)'; wm.style.opacity = ''; }
      return;
    }
    // BEAT 1 — dashboard slides straight LEFT & out at natural speed; wordmark holds
    if (dash) {
      var de = clamp01(f / 1.05);
      dash.style.transform = 'translateX(' + (-de * 118).toFixed(2) + 'vw)';
      dash.style.opacity = Math.max(0, 1 - clamp01((f - 0.7) / 0.3)).toFixed(3);
    }
    // wordmark holds, then drifts up & fades as the ball departs
    if (wm) {
      var wf = eo(clamp01((f - 0.95) / 0.5));
      wm.style.transform = 'translate(-50%,' + (wf * -80).toFixed(1) + 'px)';
      wm.style.opacity = Math.max(0, 1 - wf * 1.15).toFixed(3);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
})();
