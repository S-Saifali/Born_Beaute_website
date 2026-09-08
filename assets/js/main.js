/* ============================================================================
   Born Beaute Salon - site behaviour.
   No dependencies, no build step. Everything degrades to a working page if
   this file fails to load: the markup is complete on its own.
   ========================================================================== */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* --- hero video: honour reduced-motion, save battery when offscreen ----- */

  var heroVideo = $('.hero-media video');
  if (heroVideo) {
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var applyMotion = function () {
      if (calm.matches) heroVideo.pause();       // poster frame stays visible
      else heroVideo.play().catch(function () {}); // ignore autoplay rejection
    };
    if (calm.addEventListener) calm.addEventListener('change', applyMotion);
    else if (calm.addListener) calm.addListener(applyMotion);
    applyMotion();

    // Stop decoding once the hero has scrolled well out of view.
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

  var toTop = $('#toTop');
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --- booking form ------------------------------------------------------- */

  // "Request appointment" jumps to the form; put the caret in it too.
  $$('a[href="#name"]').forEach(function (link) {
    link.addEventListener('click', function () {
      setTimeout(function () { $('#name').focus({ preventScroll: true }); }, 400);
    });
  });

  var form = $('#bookForm');
  var status = $('#formStatus');

  var messageFor = function (field) {
    if (field.validity.valueMissing) {
      return field.tagName === 'SELECT' ? 'Pick an option so we know who to book you with.' : 'This one is needed.';
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

  // A date in the past is never a bookable slot.
  var dateField = form.elements.date;
  dateField.min = new Date().toISOString().slice(0, 10);

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

    var data = new FormData(form);
    var name = String(data.get('name')).trim().split(/\s+/)[0];
    var when = new Date(String(data.get('date')) + 'T12:00:00');
    var day = isNaN(when) ? String(data.get('date'))
      : when.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

    // No backend yet. Swap this block for a fetch() to the booking endpoint
    // (or a Formspree/Netlify action on the <form>) when one exists.
    status.hidden = false;
    status.textContent =
      'Thank you, ' + name + '. Your request for ' + data.get('service') +
      ' on ' + day + ', ' + data.get('time') + ', is noted — ' +
      'the front desk will confirm by email shortly.';

    form.reset();
    $$('.input', form).forEach(function (field) { showError(field, ''); });
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  /* --- cart --------------------------------------------------------------- */

  var STORE_KEY = 'bb-cart-v1';
  var cart = [];

  try {
    cart = JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch (err) {
    cart = [];
  }

  var drawer = $('#cartDrawer');
  var backdrop = $('#cartBackdrop');
  var cartBody = $('#cartBody');
  var cartCount = $('#cartCount');
  var cartTotal = $('#cartTotal');
  var checkout = $('#cartCheckout');
  var openBtn = $('#cartOpen');
  var toast = $('#toast');
  var toastTimer;

  var money = function (n) { return '$' + n.toFixed(2).replace(/\.00$/, ''); };

  var persist = function () {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cart));
    } catch (err) {
      /* private mode - the cart just does not survive a reload */
    }
  };

  var renderCart = function () {
    var units = cart.reduce(function (n, line) { return n + line.qty; }, 0);
    var total = cart.reduce(function (n, line) { return n + line.qty * line.price; }, 0);

    cartCount.textContent = String(units);
    cartCount.hidden = units === 0;
    cartTotal.textContent = money(total);
    checkout.disabled = units === 0;
    openBtn.setAttribute('aria-label', units ? 'Open cart, ' + units + ' item' + (units === 1 ? '' : 's') : 'Open cart');

    if (!cart.length) {
      cartBody.innerHTML = '<p class="drawer-empty">Nothing here yet. Everything in the shop is what the team reaches for on the floor.</p>';
      return;
    }

    cartBody.innerHTML = '';
    cart.forEach(function (line, index) {
      var row = document.createElement('div');
      row.className = 'cart-line';

      var img = document.createElement('img');
      img.className = 'grayscale';
      img.src = line.img;
      img.alt = '';
      img.width = 56;
      img.height = 56;

      var mid = document.createElement('div');
      var name = document.createElement('p');
      name.className = 'cart-line-name';
      name.textContent = line.name;
      var kind = document.createElement('p');
      kind.className = 'cart-line-kind';
      kind.textContent = line.kind;

      var qty = document.createElement('div');
      qty.className = 'qty';
      var minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'Remove one ' + line.name);
      var count = document.createElement('span');
      count.textContent = String(line.qty);
      var plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Add one ' + line.name);

      minus.addEventListener('click', function () { changeQty(index, -1); });
      plus.addEventListener('click', function () { changeQty(index, 1); });

      qty.appendChild(minus);
      qty.appendChild(count);
      qty.appendChild(plus);
      mid.appendChild(name);
      mid.appendChild(kind);
      mid.appendChild(qty);

      var price = document.createElement('span');
      price.className = 'cart-line-price';
      price.textContent = money(line.qty * line.price);

      row.appendChild(img);
      row.appendChild(mid);
      row.appendChild(price);
      cartBody.appendChild(row);
    });
  };

  var changeQty = function (index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart.splice(index, 1);
    persist();
    renderCart();
  };

  var say = function (message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  };

  var lastFocus = null;
  var setDrawer = function (open) {
    if (open) {
      lastFocus = document.activeElement;
      backdrop.hidden = false;
      // let the element paint before transitioning in
      requestAnimationFrame(function () { backdrop.classList.add('is-open'); });
    } else {
      backdrop.classList.remove('is-open');
      setTimeout(function () { backdrop.hidden = true; }, 220);
    }
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    // keep the closed drawer out of the tab order as well as out of the a11y tree
    if (open) drawer.removeAttribute('inert');
    else drawer.setAttribute('inert', '');
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      $('#cartClose').focus();
      return;
    }
    if (drawer.contains(document.activeElement)) document.activeElement.blur();
    if (lastFocus && lastFocus !== document.body && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  drawer.setAttribute('inert', '');

  $$('[data-add-to-cart]').forEach(function (button) {
    button.addEventListener('click', function () {
      var card = button.closest('.product');
      var name = card.dataset.product;
      var existing = cart.filter(function (line) { return line.name === name; })[0];

      if (existing) existing.qty += 1;
      else cart.push({ name: name, kind: card.dataset.kind, price: Number(card.dataset.price), img: card.dataset.img, qty: 1 });

      persist();
      renderCart();
      say(name + ' added to your cart.');
    });
  });

  openBtn.addEventListener('click', function () { setDrawer(true); });
  $('#cartClose').addEventListener('click', function () { setDrawer(false); });
  backdrop.addEventListener('click', function () { setDrawer(false); });

  checkout.addEventListener('click', function () {
    say('Checkout is not connected yet — call the studio to hold your order.');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawer.classList.contains('is-open')) setDrawer(false);
    if (navLinks.classList.contains('is-open')) setMenu(false);
  });

  // Keep tab focus inside the drawer while it is open.
  drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var focusable = $$('button:not([disabled]), a[href], input, select, textarea', drawer);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* --- misc --------------------------------------------------------------- */

  $('#year').textContent = String(new Date().getFullYear());

  window.addEventListener('scroll', function () { onScroll(); spy(); }, { passive: true });
  onScroll();
  spy();
  renderCart();
})();
