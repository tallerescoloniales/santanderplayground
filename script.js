(function () {
  'use strict';

  var header = document.querySelector('.spg-header');
  var hamburger = document.querySelector('.spg-hamburger');
  var overlay = document.querySelector('.spg-overlay');
  var overlayClose = document.querySelector('.spg-overlay-close');
  var progressBar = document.getElementById('spg-progress-bar');
  var topBtn = document.getElementById('spg-top');

  /* ============ MENÚ ============ */
  function setMenu(state) {
    if (!overlay) return;
    overlay.classList.toggle('open', state);
    overlay.setAttribute('aria-hidden', state ? 'false' : 'true');
    if (hamburger) hamburger.setAttribute('aria-expanded', state ? 'true' : 'false');
  }

  if (hamburger) hamburger.addEventListener('click', function () { setMenu(true); });
  if (overlayClose) overlayClose.addEventListener('click', function () { setMenu(false); });
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ============ HEADER + PROGRESO + BOTÓN ARRIBA ============ */
  function onScroll() {
    var scrolled = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', scrolled > 24);
    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
    }
    if (topBtn) topBtn.hidden = scrolled < 600;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (topBtn) {
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============ SCROLLSPY ============ */
  var spyLinks = document.querySelectorAll('.spg-nav a[href^="#"]:not(.spg-btn)');
  var sections = [];
  spyLinks.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) sections.push({ id: id, el: sec, link: link });
  });

  function onSpy() {
    var pos = window.scrollY + 120;
    var current = sections[0] ? sections[0].id : '';
    sections.forEach(function (s) {
      if (s.el.offsetTop <= pos) current = s.id;
    });
    sections.forEach(function (s) {
      s.link.classList.toggle('is-active', s.id === current);
    });
  }
  onSpy();
  window.addEventListener('scroll', onSpy, { passive: true });

  /* ============ REVEAL ============ */
  var revealEls = document.querySelectorAll('.spg-reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ============ CAROUSELES ============ */
  function initCarousels() {
    var carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach(function (root) {
      var items = Array.prototype.slice.call(root.querySelectorAll('.spg-carousel-item'));
      var dots = Array.prototype.slice.call(root.querySelectorAll('.spg-carousel-dot'));
      var prev = root.querySelector('.spg-carousel-prev');
      var next = root.querySelector('.spg-carousel-next');
      if (!items.length) return;

      var idx = 0;
      var timer = null;

      function show(i) {
        idx = (i + items.length) % items.length;
        items.forEach(function (it, n) { it.classList.toggle('is-active', n === idx); });
        dots.forEach(function (d, n) { d.classList.toggle('is-active', n === idx); });
      }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function start() {
        stop();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        timer = setInterval(function () { show(idx + 1); }, 5200);
      }

      if (prev) prev.addEventListener('click', function () { show(idx - 1); start(); });
      if (next) next.addEventListener('click', function () { show(idx + 1); start(); });
      dots.forEach(function (d, n) {
        d.addEventListener('click', function () { show(n); start(); });
      });
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      start();
    });
  }

  initCarousels();

  /* ============ MAPA ============ */
  function initMap() {
    var el = document.getElementById('spg-map');
    if (!el || typeof L === 'undefined' || !window.SPG_COLES || !window.SPG_COLES.length) return;

    var map = L.map(el, { scrollWheelZoom: false });

    var providers = [
      {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        opts: { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
      },
      {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        opts: { attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: 'abcd', maxZoom: 19 }
      },
      {
        url: 'https://tile.openfreemap.org/styles/positron/{z}/{x}/{y}.png',
        opts: { attribution: '&copy; OpenStreetMap contributors &copy; OpenFreeMap', maxZoom: 19 }
      }
    ];

    var tile = null;
    var providerIdx = 0;
    function addTiles() {
      var p = providers[providerIdx];
      tile = L.tileLayer(p.url, p.opts).addTo(map);
      tile.on('tileerror', function () {
        if (providerIdx < providers.length - 1) {
          map.removeLayer(tile);
          providerIdx += 1;
          addTiles();
        }
      });
    }
    addTiles();

    var hexIcon = L.divIcon({
      className: 'spg-hex-marker',
      html: '<span class="spg-hex-mark"><span></span></span>',
      iconSize: [9, 10],
      iconAnchor: [5, 5],
      popupAnchor: [0, -5]
    });

    function safe(text) {
      return String(text == null ? '' : text)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function linkList(items) {
      if (!items) return '';
      var arr = Array.isArray(items) ? items : [{ text: 'Redes', url: items }];
      return arr.map(function (l) {
        return '<a href="' + safe(l.url) + '" target="_blank" rel="noopener">' + safe(l.text || 'Enlace') + '</a>';
      }).join(' · ');
    }

    function popupSection(label) {
      return '<small class="spg-popup-ampa">' + safe(label) + '</small>';
    }

    function schoolBlocks(c) {
      var html = '';
      var own = [];
      if (c.web) own.push({ text: 'Web', url: c.web });
      (c.social || []).forEach(function (s) { own.push(s); });
      var ownHtml = linkList(own.length ? own : null);
      if (c.address) html += '<small>' + safe(c.address) + '</small>';
      if (ownHtml) html += '<small class="spg-popup-links">' + ownHtml + '</small>';
      var a = c.ampa;
      if (a) {
        html += popupSection(a.name);
        var ampaLinks = [];
        if (a.web) ampaLinks.push({ text: 'Web', url: a.web });
        (a.social || []).forEach(function (s) { ampaLinks.push(s); });
        var ampaHtml = linkList(ampaLinks.length ? ampaLinks : null);
        if (ampaHtml) html += '<small class="spg-popup-links">' + ampaHtml + '</small>';
      }
      return html;
    }

    var pts = window.SPG_COLES.map(function (c) {
      var m = L.marker([c.lat, c.lon], { icon: hexIcon }).addTo(map);
      var html = '<b>' + safe(c.name) + '</b>' + schoolBlocks(c);
      m.bindPopup(html);
      return [c.lat, c.lon];
    });

    var hitoBase = function () {
      return L.divIcon({
        className: 'spg-hex-marker',
        html: '<span class="spg-hex-mark-hito"></span>',
        iconSize: [9, 10],
        iconAnchor: [5, 5],
        popupAnchor: [0, -5]
      });
    };

    var allPts = pts.slice();
    (window.SPG_HITOS || []).forEach(function (h) {
      var m = L.marker([h.lat, h.lon], { icon: hitoBase() }).addTo(map);
      var html = '<b>' + safe(h.name) + '</b>';
      if (h.label) html += '<small>' + safe(h.label) + '</small>';
      var items = [];
      if (h.link) items.push({ text: 'tallerescoloniales.com', url: h.link });
      (h.social || []).forEach(function (s) { items.push(s); });
      var linksHtml = linkList(items);
      if (linksHtml) html += '<small class="spg-popup-links">' + linksHtml + '</small>';
      m.bindPopup(html);
      allPts.push([h.lat, h.lon]);
    });

    var bounds = L.latLngBounds(allPts);
    map.fitBounds(bounds.pad(0.22), { animate: false });

    function fitVisible() {
      map.invalidateSize();
      map.fitBounds(bounds.pad(0.22), { animate: false });
    }

    if (document.readyState === 'complete') { fitVisible(); }
    else { window.addEventListener('load', fitVisible); }

    if ('IntersectionObserver' in window) {
      var ioMap = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            fitVisible();
            ioMap.disconnect();
          }
        });
      }, { threshold: 0.05 });
      ioMap.observe(el);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();