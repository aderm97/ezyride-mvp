/* EzyRide — interactions
   Theme toggle · fleet tablist · scroll reveals · header state · booking form
*/
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem('ezyride-theme', theme);
    themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  applyTheme(root.getAttribute('data-theme') || 'light', false);

  themeToggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  });

  // Follow OS changes unless the user has chosen explicitly
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem('ezyride-theme')) {
      applyTheme(e.matches ? 'dark' : 'light', false);
    }
  });

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');

  navToggle.addEventListener('click', function () {
    var open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    navLinks.classList.toggle('is-open', !open);
  });

  // Close the menu after choosing a destination
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      navLinks.classList.remove('is-open');
    }
  });

  /* ---------- Fleet tablist (WAI-ARIA tabs pattern) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.fleet-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.fleet-panel'));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (p) {
      var active = p.id === tab.getAttribute('aria-controls');
      p.hidden = !active;
      // restart the entrance animation
      p.classList.remove('is-active');
      if (active) {
        void p.offsetWidth;
        p.classList.add('is-active');
      }
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });

  /* ---------- Scroll reveals ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Booking form ---------- */
  var booking = document.querySelector('.booking');
  var datetime = document.getElementById('datetime');

  // Earliest bookable pickup: one hour from now, minute precision
  var min = new Date(Date.now() + 60 * 60 * 1000);
  min.setSeconds(0, 0);
  datetime.min = min.toISOString().slice(0, 16);

  booking.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!booking.reportValidity()) return;
    var submit = booking.querySelector('.booking__submit');
    submit.textContent = 'Finding your prices…';
    submit.disabled = true;
    // Hand off to the app: carry the booking intent into the sign-in flow.
    var params = new URLSearchParams({
      pickup: (document.getElementById('pickup') || {}).value || '',
      dropoff: (document.getElementById('dropoff') || {}).value || '',
      when: (document.getElementById('datetime') || {}).value || '',
      passengers: (document.getElementById('passengers') || {}).value || ''
    });
    window.location.href = '/login?' + params.toString();
  });

  // Swap field labels to match trip direction
  var pickupLabel = document.querySelector('label[for="pickup"]');
  var dropoffLabel = document.querySelector('label[for="dropoff"]');
  var pickupInput = document.getElementById('pickup');
  var dropoffInput = document.getElementById('dropoff');

  booking.addEventListener('change', function (e) {
    if (e.target.name !== 'direction') return;
    var fromAirport = e.target.value === 'from-airport';
    pickupLabel.textContent = fromAirport ? 'Pickup — airport' : 'Pickup';
    dropoffLabel.textContent = fromAirport ? 'Drop-off' : 'Drop-off — airport';
    pickupInput.placeholder = fromAirport ? 'Airport or terminal' : 'Address, hotel or terminal';
    dropoffInput.placeholder = fromAirport ? 'Address, hotel or terminal' : 'Airport or terminal';
  });
})();
