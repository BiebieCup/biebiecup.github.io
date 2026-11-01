/* ==========================================================================
   第六届憋憋杯 · 交互脚本
   无依赖 · 无构建 · 兼容 GitHub Pages
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  body.classList.remove('no-js');
  body.classList.add('js');

  /* ---------------------------------------------------------------- utils */
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  var T_OPEN = new Date('2026-08-24T00:00:00+08:00');
  var T_DEADLINE = new Date('2027-01-27T00:00:00+08:00');
  var T_LIVE = new Date('2027-02-08T19:00:00+08:00');

  /* ------------------------------------------------------------ clipboard */
  function legacyCopy(text) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function flash(btn, ok) {
    var original = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', original);
    btn.textContent = ok ? '已复制' : '复制失败';
    btn.classList.toggle('is-copied', ok);
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('is-copied');
    }, 1600);
  }

  $$('[data-copy], [data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (!text) {
        var target = $(btn.getAttribute('data-copy-target'));
        text = target ? (target.innerText || target.textContent || '') : '';
      }
      text = text.trim();
      if (!text) return;
      copyText(text).then(function (ok) { flash(btn, ok); });
    });
  });

  /* --------------------------------------------------------------- header */
  var header = $('#siteHeader');
  var progressBar = $('#progressBar');
  var toTop = $('#toTop');

  var ticking = false;
  function onScrollFrame() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    if (progressBar) {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressBar.style.width = (pct * 100).toFixed(2) + '%';
    }
    ticking = false;
  }
  function requestScrollFrame() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScrollFrame); }
  }
  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  onScrollFrame();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------- mobile nav */
  var menuBtn = $('#menuBtn');
  var nav = $('#nav');

  function setMenu(open) {
    body.classList.toggle('nav-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
    if (menuBtn) menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    if (open) { body.style.overflow = 'hidden'; } else { body.style.overflow = ''; }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(!body.classList.contains('nav-open'));
    });
  }
  if (nav) {
    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) setMenu(false);
  });

  /* ------------------------------------------------------------- scrollspy */
  var spyLinks = $$('#nav a[href^="#"]');
  var spyTargets = spyLinks.map(function (a) {
    return { link: a, el: $(a.getAttribute('href')) };
  }).filter(function (item) { return item.el; });

  function updateSpy() {
    var pos = (window.scrollY || window.pageYOffset) + window.innerHeight * 0.32;
    var current = null;
    spyTargets.forEach(function (item) {
      if (item.el.offsetTop <= pos) current = item;
    });
    spyLinks.forEach(function (a) { a.classList.remove('is-active'); });
    if (current) current.link.classList.add('is-active');
  }
  var spyTick = false;
  window.addEventListener('scroll', function () {
    if (!spyTick) {
      spyTick = true;
      window.requestAnimationFrame(function () { updateSpy(); spyTick = false; });
    }
  }, { passive: true });
  updateSpy();

  /* ---------------------------------------------------------------- reveal */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ------------------------------------------------------------- countdown */
  var cdD = $('#cdD'), cdH = $('#cdH'), cdM = $('#cdM'), cdS = $('#cdS');
  var cdLabel = $('#cdLabel'), cdDate = $('#cdDate'), cdStatus = $('#cdStatus');
  var cdCard = $('#countdownCard');

  function setUnits(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if (cdD) cdD.textContent = d > 99 ? String(d) : pad(d);
    if (cdH) cdH.textContent = pad(h);
    if (cdM) cdM.textContent = pad(m);
    if (cdS) cdS.textContent = pad(s);
  }

  function tickCountdown() {
    var now = new Date();
    var target, label, dateText, status, closed = false;

    if (now < T_OPEN) {
      target = T_OPEN;
      label = '距离投稿开始';
      dateText = '2026.08.24（北京时间）';
      status = '投稿尚未开始 · 可先准备作品与素材';
    } else if (now < T_DEADLINE) {
      target = T_DEADLINE;
      label = '距离投稿截止';
      dateText = '2027.01.27 00:00（北京时间）';
      status = '投稿进行中 · 以邮箱收到时间为准';
    } else if (now < T_LIVE) {
      target = T_LIVE;
      label = '距离直播放送';
      dateText = '2027.02.08 19:00 左右';
      status = '投稿已截止 · 等待直播放送';
      closed = true;
    } else {
      target = null;
      label = '本届比赛';
      dateText = '2027.02.08 已直播';
      status = '本届已结束 · 感谢每一位谱师与观众';
      closed = true;
    }

    if (cdLabel) cdLabel.textContent = label;
    if (cdDate) cdDate.textContent = dateText;
    if (cdStatus) {
      cdStatus.textContent = status;
      cdStatus.classList.toggle('is-closed', closed);
    }
    if (target) setUnits(target - now); else setUnits(0);
    if (cdCard) cdCard.setAttribute('data-phase', now < T_OPEN ? 'pre' : now < T_DEADLINE ? 'open' : now < T_LIVE ? 'closed' : 'over');
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* -------------------------------------------------------------- timeline */
  var tlItems = $$('.tl[data-tl]');
  function paintTimeline() {
    if (!tlItems.length) return;
    var now = new Date();
    var state = {}; // key -> 'done' | 'now' | ''
    if (now < T_OPEN) {
      state.open = 'now';
    } else if (now < T_DEADLINE) {
      state.open = 'done'; state.deadline = 'now';
    } else if (now < T_LIVE) {
      state.open = 'done'; state.deadline = 'done'; state.render = 'now';
    } else {
      state.open = 'done'; state.deadline = 'done'; state.render = 'done';
      state.live = 'done'; state.after = 'now';
    }
    tlItems.forEach(function (item) {
      var key = item.getAttribute('data-tl');
      item.classList.toggle('is-done', state[key] === 'done');
      item.classList.toggle('is-now', state[key] === 'now');
      var tag = $('.tl-tag', item);
      if (tag) {
        if (state[key] === 'now') tag.textContent = '当前阶段';
        else if (state[key] === 'done') tag.textContent = '已完成';
        else if (key === 'deadline') tag.textContent = '硬截止';
        else if (key === 'render') tag.textContent = '确认期';
        else if (key === 'live') tag.textContent = '公开';
        else if (key === 'after') tag.textContent = '存档';
        else tag.textContent = '起点';
      }
    });
  }
  paintTimeline();
  setInterval(paintTimeline, 60000);

  /* ------------------------------------------------------------- generator */
  var gSong = $('#gSong'), gArtist = $('#gArtist'), gCharter = $('#gCharter');
  var gTrack = $('#gTrack'), gType = $('#gType'), gContact = $('#gContact');
  var gUid = $('#gUid'), gConvert = $('#gConvert');
  var genText = $('#genText'), genFile = $('#genFile');

  function val(input) {
    if (!input) return '';
    var v = (input.value || '').trim();
    if (v) return v;
    return (input.getAttribute('placeholder') || '').trim();
  }

  function buildMail() {
    if (!genText) return;
    var song = val(gSong) || '（曲名）';
    var artist = val(gArtist) || '（曲师）';
    var charter = val(gCharter) || '（谱师）';
    var track = gTrack ? gTrack.value : '常规';
    var type = gType ? gType.value : '单人';
    var contact = val(gContact) || '（QQ / 其他联系方式）';
    var uidRaw = gUid ? (gUid.value || '').trim() : '';
    var uid = uidRaw;
    if (!uid) uid = track === '常规' ? '（请填写 B 站 UID 或 BV 号）' : '（娱乐赛道无需）';

    var lines = [
      '【第六届憋憋杯投稿/' + track + '/' + type + '】',
      '',
      '曲目：' + song,
      '曲师：' + artist,
      '谱师：' + charter,
      '参赛赛道：' + track,
      '作品类型：' + type,
      '联系方式：' + contact,
      '哔哩哔哩UID：' + uid
    ];
    if (gConvert && gConvert.checked) lines.push('需要转 RPE');

    genText.textContent = lines.join('\n');
    if (genFile) genFile.textContent = song + '_' + track + '_' + type;
  }

  [gSong, gArtist, gCharter, gContact, gUid].forEach(function (el) {
    if (el) el.addEventListener('input', buildMail);
  });
  [gTrack, gType, gConvert].forEach(function (el) {
    if (el) el.addEventListener('change', buildMail);
  });
  buildMail();

  /* ------------------------------------------------------------- checklist */
  var CL_KEY = 'bbc6.checklist.v1';
  var clBoxes = $$('#checklist input[type="checkbox"][data-cl]');
  var clBar = $('#clBar');
  var clProgress = $('#clProgress');

  function readChecklist() {
    try {
      var raw = window.localStorage.getItem(CL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function writeChecklist(ids) {
    try { window.localStorage.setItem(CL_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
  }
  function paintChecklist() {
    var done = clBoxes.filter(function (b) { return b.checked; }).length;
    if (clProgress) clProgress.textContent = done + ' / ' + clBoxes.length;
    if (clBar) clBar.style.width = (clBoxes.length ? (done / clBoxes.length) * 100 : 0) + '%';
  }

  if (clBoxes.length) {
    var saved = readChecklist();
    clBoxes.forEach(function (box) {
      if (saved.indexOf(box.getAttribute('data-cl')) !== -1) box.checked = true;
      box.addEventListener('change', function () {
        var ids = clBoxes.filter(function (b) { return b.checked; }).map(function (b) { return b.getAttribute('data-cl'); });
        writeChecklist(ids);
        paintChecklist();
      });
    });
    paintChecklist();
  }

  /* ------------------------------------------------------- hero note canvas */
  (function initCanvas() {
    var canvas = $('#notesCanvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var LANES = 9;
    var notes = [];
    var w = 0, h = 0, raf = 0, last = 0, spawnAcc = 0;
    var running = true;

    function roundRect(x, y, width, height, r) {
      var rr = Math.min(r, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + width - rr, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + rr);
      ctx.lineTo(x + width, y + height - rr);
      ctx.quadraticCurveTo(x + width, y + height, x + width - rr, y + height);
      ctx.lineTo(x + rr, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - rr);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
      ctx.closePath();
    }

    function size() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeNote(initial) {
      var lane = Math.floor(Math.random() * LANES);
      var hold = Math.random() < 0.16;
      return {
        x: w * ((lane + 0.5) / LANES),
        y: initial ? Math.random() * h : -60,
        width: Math.max(16, Math.min(44, (w / LANES) * 0.44)),
        height: hold ? 60 + Math.random() * 90 : 9 + Math.random() * 7,
        speed: 55 + Math.random() * 95,
        mint: Math.random() < 0.52,
        alpha: 0.18 + Math.random() * 0.4
      };
    }

    function seed() {
      notes = [];
      var count = Math.round(Math.min(34, Math.max(14, w / 46)));
      for (var i = 0; i < count; i++) notes.push(makeNote(true));
    }

    function drawBackdrop() {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      for (var i = 1; i < LANES; i++) {
        var x = Math.round((w * i) / LANES) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawJudgeLine() {
      var y = h * 0.8;
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(139,123,255,0)');
      grad.addColorStop(0.2, 'rgba(139,123,255,0.5)');
      grad.addColorStop(0.55, 'rgba(78,225,193,0.85)');
      grad.addColorStop(0.85, 'rgba(255,204,102,0.45)');
      grad.addColorStop(1, 'rgba(255,204,102,0)');
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(78,225,193,0.5)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.restore();

      var glow = ctx.createLinearGradient(0, y - 60, 0, y + 4);
      glow.addColorStop(0, 'rgba(78,225,193,0)');
      glow.addColorStop(1, 'rgba(78,225,193,0.09)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, y - 60, w, 64);
    }

    function drawNote(n) {
      var col = n.mint ? '78,225,193' : '139,123,255';
      ctx.save();
      ctx.shadowColor = 'rgba(' + col + ',0.75)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(' + col + ',' + n.alpha + ')';
      roundRect(n.x - n.width / 2, n.y, n.width, n.height, 5);
      ctx.fill();
      ctx.restore();
    }

    function frame(ts) {
      if (!running) return;
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;

      spawnAcc += dt;
      var interval = 0.26;
      while (spawnAcc > interval) {
        spawnAcc -= interval;
        if (notes.length < 38) notes.push(makeNote(false));
      }

      drawBackdrop();
      for (var i = notes.length - 1; i >= 0; i--) {
        var n = notes[i];
        n.y += n.speed * dt;
        if (n.y > h + 140) { notes.splice(i, 1); continue; }
        drawNote(n);
      }
      drawJudgeLine();
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = window.requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      window.cancelAnimationFrame(raf);
    }

    size();
    seed();
    drawBackdrop();
    notes.forEach(drawNote);
    drawJudgeLine();

    if (!reduceMotion) {
      raf = window.requestAnimationFrame(frame);
      doc.addEventListener('visibilitychange', function () {
        if (doc.hidden) stop(); else start();
      });
      var resizeTimer = 0;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var wasRunning = running;
          stop();
          size();
          notes.forEach(function (n) {
            n.x = Math.min(n.x, w - n.width / 2);
            n.y = Math.min(n.y, h);
          });
          if (!notes.length) seed();
          drawBackdrop();
          notes.forEach(drawNote);
          drawJudgeLine();
          if (wasRunning) start();
        }, 180);
      });
    }
  })();

  /* ------------------------------------------------------- smooth anchors */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id === '#') return;
    var target = doc.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ---------------------------------------------------------------- footer */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
