/* ==========================================================================
   Tokenization 2050 — site behaviour (no cookies, no tracking, no libraries)
   Every feature here is an enhancement: the page is complete without it.
   prefers-reduced-motion is respected everywhere.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---- "More" menu: open/close on click, close on Escape or click outside ---- */
  function initMoreMenu() {
    var item = document.querySelector('.nav-more');
    if (!item) return;
    var btn = item.querySelector('.nav-more-toggle');
    function setOpen(open) {
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { setOpen(!item.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!item.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && item.classList.contains('open')) { setOpen(false); btn.focus(); }
    });
  }

  /* ---- Ticker: pause button (hover/focus pause is pure CSS) ---- */
  function initTicker() {
    var ticker = document.querySelector('.ticker');
    if (!ticker || reduceMotion) return;
    var btn = ticker.querySelector('.ticker-pause');
    if (!btn) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var paused = ticker.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.querySelector('.sr-only').textContent = paused ? 'Resume scrolling figures' : 'Pause scrolling figures';
      btn.querySelector('[aria-hidden]').textContent = paused ? '▶' : '❚❚';
    });
  }

  /* ---- Relative times ("12 min ago") recomputed in the browser ---- */
  function timeAgo(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return null;
    var min = Math.max(0, Math.floor(diff / 60000));
    if (min < 60) return min + ' min ago';
    var h = Math.floor(min / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }
  function refreshTimes() {
    var els = document.querySelectorAll('time.latest-strip-time[datetime]');
    for (var i = 0; i < els.length; i++) {
      var t = timeAgo(els[i].getAttribute('datetime'));
      if (t) els[i].textContent = t;
    }
  }

  /* ---- Latest headlines strip: rotates every 6 s, pausable ---- */
  function initLatestStrip() {
    var strip = document.querySelector('.latest-strip');
    if (!strip) return;
    refreshTimes();
    setInterval(refreshTimes, 60000);

    var items = strip.querySelectorAll('.latest-strip-item');
    var controls = strip.querySelector('.latest-strip-controls');
    if (items.length < 2 || !controls) return;
    controls.hidden = false;

    var index = 0;
    var userPaused = reduceMotion; // no auto-rotation with reduced motion
    var hoverPaused = false;
    var timer = null;
    var pauseBtn = controls.querySelector('.latest-strip-pause');

    function show(next) {
      var current = items[index];
      index = (next + items.length) % items.length;
      var target = items[index];
      if (current === target) return;
      current.classList.remove('is-active');
      current.hidden = true;
      target.hidden = false;
      // restart the entrance animation
      target.classList.remove('is-active');
      void target.offsetWidth;
      target.classList.add('is-active');
    }
    function schedule() {
      clearInterval(timer);
      if (!userPaused && !hoverPaused) timer = setInterval(function () { show(index + 1); }, 6000);
    }
    function setPaused(p) {
      userPaused = p;
      pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
      pauseBtn.querySelector('.sr-only').textContent = p ? 'Play headlines' : 'Pause headlines';
      pauseBtn.querySelector('[aria-hidden]').textContent = p ? '▶' : '❚❚';
      schedule();
    }

    controls.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b === pauseBtn) { setPaused(!userPaused); return; }
      show(index + Number(b.getAttribute('data-dir')));
      schedule();
    });
    strip.addEventListener('mouseenter', function () { hoverPaused = true; schedule(); });
    strip.addEventListener('mouseleave', function () { hoverPaused = false; schedule(); });
    strip.addEventListener('focusin', function () { hoverPaused = true; schedule(); });
    strip.addEventListener('focusout', function (e) {
      if (!strip.contains(e.relatedTarget)) { hoverPaused = false; schedule(); }
    });
    document.addEventListener('visibilitychange', function () {
      hoverPaused = document.hidden; schedule();
    });
    if (reduceMotion) setPaused(true); else schedule();
  }

  /* ---- Animated counters on key figures ---- */
  function formatNumber(n, decimals, grouped) {
    var s = n.toFixed(decimals);
    if (!grouped) return s;
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-count-to'));
    var dec = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    var grouped = el.hasAttribute('data-grouped');
    var finalText = el.textContent;
    var start = null;
    var duration = 1100;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = pre + formatNumber(to * eased, dec, grouped) + suf;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = finalText; // always end on the exact published value
    }
    requestAnimationFrame(frame);
  }
  function initCounters() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length || reduceMotion || !hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          io.unobserve(entry.target);
          runCounter(entry.target);
        }
      });
    }, { threshold: 0.6 });
    for (var i = 0; i < els.length; i++) {
      // reserve the final width so digits changing never shift the layout
      els[i].style.display = 'inline-block';
      els[i].style.minWidth = els[i].getBoundingClientRect().width + 'px';
      io.observe(els[i]);
    }
  }

  /* ---- Section reveal: gentle fade-in for sections below the fold ---- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length || reduceMotion || !hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          io.unobserve(entry.target);
          entry.target.classList.remove('reveal-pending');
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var vh = window.innerHeight;
    for (var i = 0; i < els.length; i++) {
      // only sections not yet on screen: nothing visible ever disappears
      if (els[i].getBoundingClientRect().top > vh) {
        els[i].classList.add('reveal-pending');
        io.observe(els[i]);
      }
    }
  }

  /* ---- Charts (Data page): self-hosted Chart.js, loaded on demand ---- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var COLORS = { ink: '#0F1A2E', azure: '#1A56DB', azure100: '#DBEAFE', muted: '#6B7280', border: '#E5E7EB' };

  function loadChartJs(cb) {
    if (window.Chart) return cb();
    var s = document.createElement('script');
    s.src = '/assets/vendor/chart.umd.min.js';
    s.onload = cb;
    s.onerror = function () {
      var boxes = document.querySelectorAll('[data-chart]');
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].classList.remove('skeleton');
        boxes[i].classList.add('chart-error');
        boxes[i].textContent = 'Chart unavailable. See the table below.';
      }
    };
    document.head.appendChild(s);
  }
  function unitFormatter(unit) {
    var parts = (unit || '|').split('|');
    return function (v) { return parts[0] + v + parts[1]; };
  }
  function drawCharts(data) {
    var Chart = window.Chart;
    Chart.defaults.font.family = "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = COLORS.muted;
    Chart.defaults.borderColor = COLORS.border;
    if (reduceMotion) Chart.defaults.animation = false;
    else Chart.defaults.animation = { duration: 700, easing: 'easeOutCubic' };

    var tooltip = {
      backgroundColor: COLORS.ink, titleColor: '#fff', bodyColor: '#fff',
      cornerRadius: 2, padding: 8, displayColors: false,
    };

    var boxes = document.querySelectorAll('[data-chart]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var canvas = box.querySelector('canvas');
      var kind = box.getAttribute('data-chart');
      var cfg = null;

      if (kind === 'comparison' && data.comparison) {
        var fmtC = unitFormatter(data.comparison.unit);
        cfg = {
          type: 'bar',
          data: { labels: data.comparison.labels, datasets: [{ data: data.comparison.values, backgroundColor: COLORS.azure, hoverBackgroundColor: COLORS.ink, borderRadius: 2, barThickness: 18 }] },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: Object.assign({ callbacks: { label: function (c) { return fmtC(c.parsed.x); } } }, tooltip) },
            scales: {
              x: { grid: { color: COLORS.border }, ticks: { callback: fmtC } },
              y: { grid: { display: false }, ticks: { color: COLORS.ink } },
            },
          },
        };
      } else if (kind === 'trend') {
        var id = box.getAttribute('data-chart-id');
        var t = null;
        for (var k = 0; k < data.trends.length; k++) if (data.trends[k].id === id) t = data.trends[k];
        if (t) {
          var fmtT = unitFormatter(t.unit);
          cfg = {
            type: 'line',
            data: {
              labels: t.points.map(function (p) { return p.date; }),
              datasets: [{ data: t.points.map(function (p) { return p.value; }), borderColor: COLORS.azure, borderWidth: 2, pointRadius: 0, pointHoverRadius: 3, pointBackgroundColor: COLORS.azure, tension: 0.25, fill: false }],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: { legend: { display: false }, tooltip: Object.assign({ callbacks: { label: function (c) { return fmtT(c.parsed.y); } } }, tooltip) },
              scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 4, maxRotation: 0, callback: function (v) {
                  var d = new Date(this.getLabelForValue(v));
                  if (isNaN(d)) return '';
                  return MONTHS[d.getUTCMonth()] + ' ' + String(d.getUTCFullYear()).slice(2);
                } } },
                y: { grid: { color: COLORS.border }, ticks: { maxTicksLimit: 4, callback: fmtT } },
              },
            },
          };
        }
      }
      if (cfg) {
        new Chart(canvas, cfg);
        box.classList.remove('skeleton');
      }
    }
  }
  function initCharts() {
    var dataEl = document.getElementById('chart-data');
    var section = document.querySelector('.data-charts');
    if (!dataEl || !section) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    function go() { loadChartJs(function () { drawCharts(data); }); }
    if (!hasIO) return go();
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); go(); }
    }, { rootMargin: '200px 0px' });
    io.observe(section);
  }

  ready(function () {
    initMoreMenu();
    initTicker();
    initLatestStrip();
    initCounters();
    initReveal();
    initCharts();
  });
})();
