/* Restocq — site behaviour (no dependencies) */
(function () {
  'use strict';

  // ---------- Config ----------
  // Point this at your form handler (Formspree, HubSpot Forms, Netlify, SMTP2GO etc.).
  // Leave empty to fall back to a mailto: link.
  var FORM_ENDPOINT = '';
  var SUPPORT_EMAIL = 'support@restocq.com';
  var POPUP_DELAY_MS = 9000;          // delay before the offer popup shows
  var POPUP_SESSION_KEY = 'restocq_popup_seen';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---------- Header shadow on scroll ----------
  var header = $('.header');
  var mobileCta = $('.mobile-cta');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (mobileCta) mobileCta.classList.toggle('is-visible', y > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile drawer ----------
  var burger = $('.burger');
  var drawer = $('.overlay') || $('.drawer');
  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('drawer-open', open);
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      setDrawer(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100) setDrawer(false); });
  }

  // ---------- Current page highlight ----------
  var path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  $$('.nav--v2 > .nav__item > a, .nav:not(.nav--v2) a, .drawer__nav a, .overlay__nav a').forEach(function (a) {
    var href = a.getAttribute('href').replace(/\.html$/, '');
    if (href === path || (href !== '/' && href !== 'index' && path.indexOf(href) === 0)) a.setAttribute('aria-current', 'page');
  });

  // ---------- Reveal on scroll ----------
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---------- Pricing toggle ----------
  var toggle = $('.toggle');
  if (toggle) {
    var buttons = $$('button', toggle);
    function setBilling(mode) {
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.billing === mode ? 'true' : 'false'); });
      $$('[data-price]').forEach(function (el) {
        var prices = JSON.parse(el.getAttribute('data-price'));
        var strong = $('strong', el), small = $('small', el);
        if (strong) strong.textContent = '$' + prices[mode];
        if (small) small.textContent = mode === 'annual' ? 'per month, billed annually' : 'per month, billed monthly';
      });
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { setBilling(b.dataset.billing); }); });
    setBilling('monthly');
  }

  // ---------- Forms (contact + newsletter) ----------
  $$('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('.form__status', form);
      var data = new FormData(form);
      var kind = form.getAttribute('data-form');

      if (!FORM_ENDPOINT) {
        // Fallback: open the visitor's mail client with the details pre-filled.
        var lines = [];
        data.forEach(function (v, k) { if (k !== '_gotcha') lines.push(k + ': ' + v); });
        var subject = kind === 'newsletter' ? 'Newsletter subscription' : 'Website enquiry';
        location.href = 'mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        if (status) status.textContent = 'Opening your email app…';
        return;
      }

      var btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('Request failed');
          if (kind === 'contact') { location.href = 'thank-you.html'; return; }
          form.reset();
          if (status) status.textContent = 'Thanks, you are subscribed.';
        })
        .catch(function () { if (status) { status.style.color = '#C0392B'; status.textContent = 'Something went wrong. Please email ' + SUPPORT_EMAIL + '.'; } })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
    });
  });

  // ---------- Offer popup ----------
  var popup = $('.popup');
  if (popup) {
    var seen = false;
    try { seen = sessionStorage.getItem(POPUP_SESSION_KEY) === '1'; } catch (err) { seen = false; }
    function closePopup() {
      popup.classList.remove('is-open');
      try { sessionStorage.setItem(POPUP_SESSION_KEY, '1'); } catch (err) { /* ignore */ }
    }
    if (!seen) {
      setTimeout(function () {
        if (document.body.classList.contains('drawer-open')) return;
        popup.classList.add('is-open');
      }, POPUP_DELAY_MS);
    }
    $$('[data-popup-close]', popup).forEach(function (el) { el.addEventListener('click', closePopup); });
    popup.addEventListener('click', function (e) { if (e.target === popup) closePopup(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
  }

  // ---------- Desktop nav: sliding indicator + mega menu ----------
  var nav = $('.nav--v2');
  if (nav) {
    var ind = $('.nav__indicator', nav);
    var items = $$('.nav__item', nav);
    var current = $('.nav__item > a[aria-current="page"]', nav);
    function moveTo(a) {
      if (!ind || !a) return;
      var r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
      ind.style.left = (r.left - n.left) + 'px';
      ind.style.width = r.width + 'px';
      ind.classList.add('is-on');
    }
    function restIndicator() { if (current) moveTo(current); else if (ind) ind.classList.remove('is-on'); }
    items.forEach(function (it) {
      var a = $(':scope > a', it);
      it.addEventListener('mouseenter', function () { moveTo(a); });
      a.addEventListener('focus', function () { moveTo(a); });
    });
    nav.addEventListener('mouseleave', restIndicator);
    window.addEventListener('resize', restIndicator);
    setTimeout(restIndicator, 50);

    var megaItems = $$('.has-mega', nav), closeTimer;
    function openMega(it) { clearTimeout(closeTimer); megaItems.forEach(function (m) { m.classList.toggle('is-open', m === it); $(':scope > a', m).setAttribute('aria-expanded', m === it ? 'true' : 'false'); }); }
    function closeMega() { megaItems.forEach(function (m) { m.classList.remove('is-open'); $(':scope > a', m).setAttribute('aria-expanded', 'false'); }); }
    megaItems.forEach(function (it) {
      var a = $(':scope > a', it);
      it.addEventListener('mouseenter', function () { openMega(it); });
      it.addEventListener('mouseleave', function () { closeTimer = setTimeout(closeMega, 160); });
      a.addEventListener('click', function (e) {
        // first tap/click on touch or keyboard opens the menu; second follows the link
        if (!it.classList.contains('is-open') && (matchMedia('(hover: none)').matches || e.detail === 0)) { e.preventDefault(); openMega(it); }
      });
      a.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); openMega(it); var f = $('.mega a', it); if (f) f.focus(); } });
      it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) closeMega(); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMega(); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeMega(); });
  }

  // ---------- Video facades: load the Vimeo player on click ----------
  $$('.vframe[data-video]').forEach(function (frame) {
    var btn = $('.vframe__play', frame);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var id = frame.getAttribute('data-video');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
      iframe.title = 'Restocq testimonial video';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.setAttribute('allowfullscreen', '');
      frame.appendChild(iframe);
      frame.classList.add('is-playing');
      btn.remove();
      var label = $('.vframe__label', frame); if (label) label.remove();
      var img = $('img', frame); if (img) img.remove();
    });
  });

  // ---------- Footer year ----------
  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
