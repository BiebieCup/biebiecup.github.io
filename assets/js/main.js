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

  /* ------------------------------------------------------- announce bar */
  var announceClose = $('#announceClose');
  if (announceClose) {
    announceClose.addEventListener('click', function () {
      doc.documentElement.classList.add('no-announce');
      try { localStorage.setItem('bbc6.announce.account', '1'); } catch (e) { /* ignore */ }
    });
  }

  /* -------------------------------------------------- local time helpers */
  var LOCAL_TZ = '';
  try { LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { LOCAL_TZ = ''; }
  var SAME_TZ = /^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)$/.test(LOCAL_TZ) || !LOCAL_TZ;

  function formatLocal(date) {
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(date);
    } catch (e) {
      return date.toLocaleString();
    }
  }
  function localSuffix() {
    return SAME_TZ ? '（与北京时间一致）' : '（' + LOCAL_TZ + '）';
  }

  var localDeadline = $('#localDeadline');
  if (localDeadline) localDeadline.textContent = '你的本地时间：' + formatLocal(T_DEADLINE) + localSuffix();
  var localLive = $('#localLive');
  if (localLive) localLive.textContent = '你的本地时间：' + formatLocal(T_LIVE) + localSuffix();

  /* ------------------------------------------------------- calendar .ics */
  function icsStamp(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }
  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function icsFold(line) {
    var out = [];
    var cur = '';
    for (var i = 0; i < line.length; i++) {
      if (cur.length >= 73) { out.push(cur); cur = ' '; }
      cur += line[i];
    }
    out.push(cur);
    return out.join('\r\n');
  }
  function buildIcs(kind) {
    var start, end, summary, desc, alarm;
    if (kind === 'live') {
      start = T_LIVE;
      end = new Date(T_LIVE.getTime() + 2 * 3600 * 1000);
      summary = '第六届憋憋杯 · 直播放送';
      desc = 'B 站 @夜肆-スタート 直播间：https://live.bilibili.com/1881508246  官网：https://biebiecup.qzz.io/';
      alarm = '-PT30M';
    } else {
      start = T_DEADLINE;
      end = new Date(T_DEADLINE.getTime() + 3600 * 1000);
      summary = '第六届憋憋杯 · 投稿截止';
      desc = '截稿 2027-01-27 00:00（北京时间）。投稿邮箱 biebiecup5071@163.com，官网 https://biebiecup.qzz.io/';
      alarm = '-P1D';
    }
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BieBie Cup//6th//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:bbc6-' + kind + '@biebiecup.qzz.io',
      'DTSTAMP:' + icsStamp(new Date()),
      'DTSTART:' + icsStamp(start),
      'DTEND:' + icsStamp(end),
      'SUMMARY:' + icsEscape(summary),
      'DESCRIPTION:' + icsEscape(desc),
      'LOCATION:' + icsEscape('https://biebiecup.qzz.io/'),
      'URL:https://biebiecup.qzz.io/',
      'BEGIN:VALARM',
      'TRIGGER:' + alarm,
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsEscape(summary),
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = doc.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    doc.body.appendChild(a);
    a.click();
    setTimeout(function () {
      doc.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  }

  $$('[data-ics]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-ics');
      var name = kind === 'live' ? '第六届憋憋杯-直播.ics' : '第六届憋憋杯-截稿.ics';
      downloadBlob(new Blob([buildIcs(kind)], { type: 'text/calendar;charset=utf-8' }), name);
    });
  });

  /* ------------------------------------------------------- chart checker */
  (function initChecker() {
    var zone = $('#dropZone');
    var input = $('#fileInput');
    if (!zone || !input) return;

    var panel = $('#checkPanel');
    var listEl = $('#checkList');
    var nameEl = $('#checkName');
    var sizeEl = $('#checkSize');
    var verdictEl = $('#checkVerdict');
    var songInput = $('#renameSong');
    var renameBtn = $('#renameBtn');
    var trackSel = $('#renameTrack');
    var typeSel = $('#renameType');

    var AUDIO_EXT = ['.ogg', '.mp3', '.wav', '.flac', '.m4a', '.aac', '.opus'];
    var IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];
    var CHART_EXT = ['.json', '.pec'];
    var state = { buffer: null, ext: '.pez' };

    function extOf(name) {
      var i = name.lastIndexOf('.');
      return i >= 0 ? name.slice(i).toLowerCase() : '';
    }
    function fmtSize(n) {
      if (n < 1024) return n + ' B';
      if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1048576).toFixed(2) + ' MB';
    }
    function fmtDur(sec) {
      var total = Math.round(sec);
      var m = Math.floor(total / 60);
      var s = total % 60;
      return m + ' 分 ' + pad(s) + ' 秒';
    }
    function decodeName(bytes) {
      var name = '';
      try { name = new TextDecoder('utf-8').decode(bytes); } catch (e) { name = ''; }
      if (name.indexOf('\uFFFD') >= 0) {
        try { name = new TextDecoder('gbk').decode(bytes); } catch (e2) { /* keep */ }
      }
      return name;
    }
    function parseZip(buffer) {
      var dv = new DataView(buffer);
      var u8 = new Uint8Array(buffer);
      var len = buffer.byteLength;
      var eocd = -1;
      var min = Math.max(0, len - 65558);
      for (var i = len - 22; i >= min; i--) {
        if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      }
      if (eocd < 0) throw new Error('不是有效的 zip / .pez 文件');
      var count = dv.getUint16(eocd + 10, true);
      var cdOffset = dv.getUint32(eocd + 16, true);
      if (count === 0xffff || cdOffset === 0xffffffff) throw new Error('暂不支持 ZIP64 格式的压缩包');
      var entries = [];
      var p = cdOffset;
      for (var n = 0; n < count; n++) {
        if (p + 46 > len || dv.getUint32(p, true) !== 0x02014b50) break;
        var flags = dv.getUint16(p + 8, true);
        var method = dv.getUint16(p + 10, true);
        var compSize = dv.getUint32(p + 20, true);
        var rawSize = dv.getUint32(p + 24, true);
        var nameLen = dv.getUint16(p + 28, true);
        var extraLen = dv.getUint16(p + 30, true);
        var commentLen = dv.getUint16(p + 32, true);
        var localOffset = dv.getUint32(p + 42, true);
        var name = decodeName(u8.subarray(p + 46, p + 46 + nameLen));
        entries.push({
          name: name,
          method: method,
          compSize: compSize,
          rawSize: rawSize,
          localOffset: localOffset,
          encrypted: !!(flags & 1)
        });
        p += 46 + nameLen + extraLen + commentLen;
      }
      if (!entries.length) throw new Error('压缩包是空的，或格式不受支持');
      return entries;
    }
    async function readEntry(buffer, entry) {
      var dv = new DataView(buffer);
      var off = entry.localOffset;
      if (off + 30 > buffer.byteLength || dv.getUint32(off, true) !== 0x04034b50) {
        throw new Error('压缩包数据损坏');
      }
      var nameLen = dv.getUint16(off + 26, true);
      var extraLen = dv.getUint16(off + 28, true);
      var start = off + 30 + nameLen + extraLen;
      var compressed = new Uint8Array(buffer, start, entry.compSize);
      if (entry.method === 0) return compressed.slice().buffer;
      if (entry.method !== 8) throw new Error('不支持的压缩方式');
      if (typeof DecompressionStream === 'undefined') throw new Error('当前浏览器不支持在线解压');
      var stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(stream).arrayBuffer();
    }
    function readDuration(buffer, name) {
      return new Promise(function (resolve, reject) {
        var mimes = {
          '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
          '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.opus': 'audio/ogg'
        };
        var url = URL.createObjectURL(new Blob([buffer], { type: mimes[extOf(name)] || 'audio/mpeg' }));
        var audio = doc.createElement('audio');
        var done = false;
        var timer = setTimeout(function () { finish(new Error('读取超时')); }, 8000);
        function finish(err) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          URL.revokeObjectURL(url);
          if (err) reject(err); else resolve(audio.duration);
        }
        audio.onloadedmetadata = function () { finish(null); };
        audio.onerror = function () { finish(new Error('无法解码音频')); };
        audio.preload = 'metadata';
        audio.src = url;
      });
    }

    function addRow(kind, icon, label, value) {
      var li = doc.createElement('li');
      li.className = 'c-' + kind;
      var ic = doc.createElement('span');
      ic.className = 'c-ico';
      ic.textContent = icon;
      var k = doc.createElement('span');
      k.className = 'c-k';
      k.textContent = label;
      li.appendChild(ic);
      li.appendChild(k);
      if (value) {
        var v = doc.createElement('span');
        v.className = 'c-v';
        v.textContent = value;
        li.appendChild(v);
      }
      return li;
    }

    function fail(message) {
      panel.hidden = false;
      listEl.innerHTML = '';
      verdictEl.className = 'check-verdict bad';
      verdictEl.textContent = message;
    }

    async function inspect(file) {
      var ext = extOf(file.name);
      if (ext !== '.pez' && ext !== '.zip') {
        fail('请选择 .pez 或 .zip 文件。');
        return;
      }
      panel.hidden = false;
      nameEl.textContent = file.name;
      sizeEl.textContent = fmtSize(file.size);
      listEl.innerHTML = '';
      verdictEl.className = 'check-verdict';
      verdictEl.textContent = '正在本地解析…';
      songInput.value = file.name.replace(/\.[^.]+$/, '');
      state.ext = ext;

      var buffer;
      try {
        buffer = await file.arrayBuffer();
        state.buffer = buffer;
      } catch (e) {
        fail('读取文件失败，请重试。');
        return;
      }

      var entries;
      try {
        entries = parseZip(buffer);
      } catch (e) {
        fail(e && e.message ? e.message : '解析失败，请确认文件有效。');
        return;
      }

      var files = entries.filter(function (e) { return e.name && e.name.charAt(e.name.length - 1) !== '/'; });
      var encrypted = entries.some(function (e) { return e.encrypted; });
      var audio = files.filter(function (e) { return AUDIO_EXT.indexOf(extOf(e.name)) >= 0; });
      var images = files.filter(function (e) { return IMAGE_EXT.indexOf(extOf(e.name)) >= 0; });
      var charts = files.filter(function (e) {
        return CHART_EXT.indexOf(extOf(e.name)) >= 0 && !/storyboard|effect/i.test(e.name);
      });
      var storyboard = files.filter(function (e) { return /storyboard/i.test(e.name); });
      var total = files.reduce(function (sum, e) { return sum + (e.rawSize || 0); }, 0);

      var rows = [];
      if (encrypted) {
        rows.push(addRow('bad', '✕', '压缩包已加密', '请取消密码后重新打包'));
      } else {
        rows.push(addRow('ok', '✓', '压缩包可正常读取', files.length + ' 个文件 · ' + fmtSize(total)));
      }
      if (charts.length) {
        rows.push(addRow('ok', '✓', '谱面文件', charts[0].name + (charts.length > 1 ? ' 等 ' + charts.length + ' 个' : '')));
      } else {
        rows.push(addRow('bad', '✕', '未找到谱面文件', '未发现 .json / .pec'));
      }
      if (audio.length) {
        rows.push(addRow('ok', '✓', '音频文件', audio[0].name + (audio.length > 1 ? ' 等 ' + audio.length + ' 个' : '')));
      } else {
        rows.push(addRow('bad', '✕', '未找到音频文件', '检查是否打包完整'));
      }
      if (images.length) {
        rows.push(addRow('ok', '✓', '曲绘 / 图片', images[0].name + (images.length > 1 ? ' 等 ' + images.length + ' 个' : '')));
      } else {
        rows.push(addRow('warn', '!', '未找到曲绘图片', '确认是否为有意省略'));
      }
      if (storyboard.length) {
        rows.push(addRow('ok', '·', '含故事板文件', storyboard.length + ' 个'));
      }

      var duration = null;
      var durationError = '';
      if (audio.length && !encrypted) {
        try {
          var data = await readEntry(buffer, audio[0]);
          duration = await readDuration(data, audio[0].name);
          if (!isFinite(duration) || duration <= 0) { duration = null; durationError = '无法读取时长'; }
        } catch (e) {
          durationError = e && e.message ? e.message : '无法读取时长';
        }
      }

      if (duration) {
        var inRange = duration >= 60 && duration <= 900;
        rows.push(addRow(inRange ? 'ok' : 'warn', inRange ? '✓' : '!', '曲目时长', fmtDur(duration) + (inRange ? '' : ' · 需 1–15 分钟')));
      } else if (audio.length) {
        rows.push(addRow('warn', '!', '曲目时长', durationError || '无法读取'));
      }

      rows.forEach(function (row) { listEl.appendChild(row); });

      var bad = !charts.length || !audio.length || encrypted;
      if (bad) {
        verdictEl.className = 'check-verdict bad';
        verdictEl.textContent = encrypted
          ? '压缩包加密，主办方无法正常解压，请去掉密码后再投。'
          : '文件可能不完整：缺谱面或音频。补齐后再投更稳妥。';
      } else if (duration && (duration < 60 || duration > 900)) {
        verdictEl.className = 'check-verdict warn';
        verdictEl.textContent = '结构完整，但曲目时长不在 1–15 分钟内，请留意赛事要求。';
      } else if (!images.length) {
        verdictEl.className = 'check-verdict warn';
        verdictEl.textContent = '结构基本完整，但没有找到曲绘图片，请确认是否为有意省略。';
      } else {
        verdictEl.className = 'check-verdict ok';
        verdictEl.textContent = '文件结构看起来没问题。投前仍建议在 RPE 里完整试玩一遍，并确认渲染视频。';
      }
    }

    function onFiles(fileList) {
      var file = fileList && fileList[0];
      if (!file) return;
      inspect(file);
    }

    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        input.click();
      }
    });
    input.addEventListener('change', function () {
      onFiles(input.files);
      input.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (name) {
      zone.addEventListener(name, function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('is-over');
      });
    });
    ['dragleave', 'dragend'].forEach(function (name) {
      zone.addEventListener(name, function (e) {
        e.preventDefault();
        zone.classList.remove('is-over');
      });
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('is-over');
      onFiles(e.dataTransfer && e.dataTransfer.files);
    });
    window.addEventListener('dragover', function (e) { e.preventDefault(); });
    window.addEventListener('drop', function (e) { e.preventDefault(); });

    renameBtn.addEventListener('click', function () {
      if (!state.buffer) return;
      var base = (songInput.value || '').trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || '曲名';
      var filename = base + '_' + trackSel.value + '_' + typeSel.value + state.ext;
      downloadBlob(new Blob([state.buffer], { type: 'application/octet-stream' }), filename);
    });
  })();

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
