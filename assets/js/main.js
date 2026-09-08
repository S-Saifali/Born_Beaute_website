/* ============================================================================
   Born Beaute - site behaviour.
   No dependencies, no build step. The page is complete without this file:
   booking and gift cards are plain links to Square, so nothing here is required
   to browse or book.
   ========================================================================== */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var toTop = $('#toTop');

  /* --- hero video: honour reduced-motion, save battery when offscreen ----- */

  var heroVideo = $('.hero-media video');
  if (heroVideo) {
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var applyMotion = function () {
      if (calm.matches) heroVideo.pause();          // poster frame stays visible
      else heroVideo.play().catch(function () {});  // ignore autoplay rejection
    };
    if (calm.addEventListener) calm.addEventListener('change', applyMotion);
    else if (calm.addListener) calm.addListener(applyMotion);
    applyMotion();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (calm.matches) return;
          if (entry.isIntersecting) heroVideo.play().catch(function () {});
          else heroVideo.pause();
        });
      }, { threshold: 0.05 }).observe(heroVideo);
    }
  }

  /* --- header: solid once you leave the hero ------------------------------ */

  var header = $('#siteHeader');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 40);
    toTop.classList.toggle('is-visible', window.scrollY > 800);
  };

  /* --- mobile menu -------------------------------------------------------- */

  var navToggle = $('#navToggle');
  var navLinks = $('#navLinks');

  var setMenu = function (open) {
    navLinks.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  };

  navToggle.addEventListener('click', function () {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  /* --- scroll spy --------------------------------------------------------- */

  var navAnchors = $$('a[href^="#"]', navLinks);
  var sections = navAnchors
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  var spy = function () {
    var line = window.scrollY + window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (section) {
      if (section.offsetTop <= line) current = section.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });
  };

  /* --- reveal on scroll --------------------------------------------------- */

  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --- back to top -------------------------------------------------------- */

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --- contact form ------------------------------------------------------- */

  var form = $('#contactForm');
  if (form) {
    var status = $('#formStatus');

    var messageFor = function (field) {
      if (field.validity.valueMissing) {
        return field.name === 'message' ? 'Let us know how we can help.'
          : field.name === 'email' ? 'We need an email to reply to.'
          : 'This one is needed.';
      }
      if (field.validity.typeMismatch && field.type === 'email') return 'That email address looks incomplete.';
      return field.validationMessage;
    };

    var showError = function (field, message) {
      var slot = form.querySelector('[data-error-for="' + field.name + '"]');
      if (slot) slot.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    $$('.input', form).forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) showError(field, '');
      });
      field.addEventListener('blur', function () {
        if (field.value && !field.checkValidity()) showError(field, messageFor(field));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = null;

      $$('.input', form).forEach(function (field) {
        var ok = field.checkValidity();
        showError(field, ok ? '' : messageFor(field));
        if (!ok && !invalid) invalid = field;
      });

      if (invalid) {
        status.hidden = true;
        invalid.focus();
        return;
      }

      var name = String(new FormData(form).get('name')).trim().split(/\s+/)[0];

      // No backend yet. Point the <form> at Formspree/Netlify Forms, or replace
      // this block with a fetch() to your endpoint, to actually deliver the message.
      status.hidden = false;
      status.textContent = 'Thanks, ' + name + ' — your message has been noted. '
        + 'We’ll reply by email. For anything urgent, call or text (224) 275-1714.';

      form.reset();
      $$('.input', form).forEach(function (field) { showError(field, ''); });
      status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /* --- gift card: pick an amount, the card lights up ---------------------- */

  var giftAmounts = $('#giftAmounts');
  if (giftAmounts) {
    var chips = $$('.chip', giftAmounts);
    var giftCard = $('#giftCard');
    var giftAmount = $('#giftAmount');
    var giftBuy = $('#giftBuy');
    var customWrap = $('#giftCustom');
    var customInput = $('#giftCustomInput');

    var renderAmount = function (value) {
      giftCard.classList.add('is-active');
      // retrigger the pop animation on every change
      giftCard.classList.remove('is-pulse');
      void giftCard.offsetWidth;
      giftCard.classList.add('is-pulse');

      if (value) {
        giftAmount.textContent = '$' + value;
        giftBuy.textContent = 'Buy a $' + value + ' gift card';
      } else {
        giftAmount.textContent = '$—';
        giftBuy.textContent = 'Buy a gift card';
      }
    };

    var customChip = giftAmounts.querySelector('[data-amount="custom"]');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-selected'); });
        chip.classList.add('is-selected');

        if (chip.dataset.amount === 'custom') {
          customWrap.hidden = false;
          customChip.setAttribute('aria-expanded', 'true');
          customInput.focus();
          var v = Number(customInput.value);
          renderAmount(v > 0 ? v : '');
        } else {
          customWrap.hidden = true;
          customChip.setAttribute('aria-expanded', 'false');
          renderAmount(chip.dataset.amount);
        }
      });
    });

    customInput.addEventListener('input', function () {
      var v = Number(customInput.value);
      renderAmount(v > 0 ? v : '');
    });
  }

  /* --- reviews slider ----------------------------------------------------- */

  var reviewsTrack = $('#reviewsTrack');
  if (reviewsTrack) {
    var slides = $$('.review', reviewsTrack);
    var dotsWrap = $('#reviewsDots');
    var reviewsSlider = $('.reviews-slider');
    var viewport = $('.reviews-viewport');
    var index = 0;
    var timer = null;
    var reduceReviews = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var dots = slides.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Review ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      reviewsTrack.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach(function (d, di) { d.setAttribute('aria-selected', di === index ? 'true' : 'false'); });
      slides.forEach(function (s, si) { s.setAttribute('aria-hidden', si === index ? 'false' : 'true'); });
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function start() { if (!reduceReviews && !timer) timer = setInterval(next, 6500); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    $('#revNext').addEventListener('click', function () { next(); restart(); });
    $('#revPrev').addEventListener('click', function () { prev(); restart(); });

    reviewsSlider.addEventListener('mouseenter', stop);
    reviewsSlider.addEventListener('mouseleave', start);
    reviewsSlider.addEventListener('focusin', stop);
    reviewsSlider.addEventListener('focusout', start);

    // swipe
    var startX = null;
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
      startX = null;
      start();
    });

    // only autoplay while the section is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { entry.isIntersecting ? start() : stop(); });
      }, { threshold: 0.2 }).observe(reviewsSlider);
    } else {
      start();
    }

    go(0);
  }

  /* --- misc --------------------------------------------------------------- */

  $('#year').textContent = String(new Date().getFullYear());

  window.addEventListener('scroll', function () { onScroll(); spy(); }, { passive: true });
  onScroll();
  spy();
})();
