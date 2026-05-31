/* jetlag-compass — UI layer. Reads inputs, calls JETLAG.plan, renders the plan.
   Bilingual (EN / 中文), state in localStorage. No frameworks. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var LS = 'jetlag_compass_v1';

  // city -> standard UTC offset (hours). DST handled via a note, not here.
  var CITIES = [
    { en: 'Beijing / Shanghai', zh: '北京 / 上海', off: 8 },
    { en: 'Hong Kong', zh: '香港', off: 8 },
    { en: 'Singapore', zh: '新加坡', off: 8 },
    { en: 'Tokyo', zh: '东京', off: 9 },
    { en: 'Seoul', zh: '首尔', off: 9 },
    { en: 'Sydney', zh: '悉尼', off: 10 },
    { en: 'Auckland', zh: '奥克兰', off: 12 },
    { en: 'Bangkok', zh: '曼谷', off: 7 },
    { en: 'Jakarta', zh: '雅加达', off: 7 },
    { en: 'Delhi / Mumbai', zh: '德里 / 孟买', off: 5.5 },
    { en: 'Dubai', zh: '迪拜', off: 4 },
    { en: 'Moscow', zh: '莫斯科', off: 3 },
    { en: 'Istanbul', zh: '伊斯坦布尔', off: 3 },
    { en: 'Athens / Cairo', zh: '雅典 / 开罗', off: 2 },
    { en: 'Paris / Berlin', zh: '巴黎 / 柏林', off: 1 },
    { en: 'London / Lisbon', zh: '伦敦 / 里斯本', off: 0 },
    { en: 'São Paulo', zh: '圣保罗', off: -3 },
    { en: 'New York / Toronto', zh: '纽约 / 多伦多', off: -5 },
    { en: 'Chicago', zh: '芝加哥', off: -6 },
    { en: 'Denver', zh: '丹佛', off: -7 },
    { en: 'Los Angeles', zh: '洛杉矶', off: -8 },
    { en: 'Honolulu', zh: '火奴鲁鲁', off: -10 }
  ];

  var STR = {
    en: {
      tagline: 'Beat jet lag with light, not luck — a science-based plan to reset your body clock.',
      privacy: '🔒 All computed in your browser. Nothing is uploaded.',
      lHome: 'Departing from', lDest: 'Arriving in', lBed: 'Usual bedtime', lWake: 'Usual wake time', lPre: 'Prep days before flight',
      dstNote: 'Offsets are standard time — if a city is on daylight saving, nudge results by ±1h.',
      daysPre: 'Full adjustment in about', daysPost: 'days',
      preTitle: 'Before you fly', schedTitle: 'Day-by-day, in destination local time',
      schedHint: 'Shift sleep gradually and time your light. "Bright light" = outdoors or a bright lamp; "dim" = low, warm light and no screens.',
      thDay: 'Day', thBed: 'Sleep', thWake: 'Wake', thGet: '☀ Get bright light', thAvoid: '🌙 Keep it dim',
      tipsTitle: 'Also helps',
      tip1: 'On the plane, switch your watch to destination time and sleep/wake by it.',
      tip2: 'Get outside in daylight at the destination — natural light is the strongest signal.',
      tip3: 'Caffeine only in your new morning; avoid alcohol and big meals near your new bedtime.',
      tip4: 'Stay hydrated; short walks beat long naps. Cap naps at ~20 min.',
      melSum: 'A note on melatonin',
      melBody: 'Some travelers use low-dose (0.5–1 mg) melatonin near the destination bedtime to nudge an advance. Timing and suitability vary by person — treat this as information, not a recommendation, and ask a healthcare professional, especially if you take medication or have a health condition.',
      disc: 'Educational planning aid based on general circadian-rhythm science — not medical advice.',
      reset: 'Reset', day: 'Day',
      eastAhead: 'East (your destination is ahead)', westBehind: 'West (your destination is behind)',
      needAdvance: 'your body clock needs to advance — shift earlier.',
      needDelay: 'your body clock needs to delay — shift later.',
      noShift: 'Same time zone — no jet lag to fight. 🎉 Safe travels!',
      flip: function (mag, rec) { return 'Big eastward jump — instead of forcing ' + mag + 'h earlier, it\'s usually easier to delay the long way (~' + rec + 'h later). The plan below does that.'; },
      preAdvance: function (n, r) { return 'Start ' + n + ' day' + (n > 1 ? 's' : '') + ' before departure: each night sleep and wake about ' + r + 'h EARLIER, and get bright light right after waking. You\'ll land already partly adjusted.'; },
      preDelay: function (n, r) { return 'Start ' + n + ' day' + (n > 1 ? 's' : '') + ' before departure: each night sleep and wake about ' + r + 'h LATER, and get bright light in the evening. You\'ll land already partly adjusted.'; }
    },
    zh: {
      tagline: '靠光照而不是靠运气倒时差 —— 基于昼夜节律科学,帮你重置生物钟。',
      privacy: '🔒 全部在你的浏览器里计算,不上传任何数据。',
      lHome: '出发地', lDest: '到达地', lBed: '平时入睡', lWake: '平时起床', lPre: '出发前预调天数',
      dstNote: '这里用标准时区;若城市正在夏令时,结果按 ±1 小时微调。',
      daysPre: '大约', daysPost: '天完全适应',
      preTitle: '出发前', schedTitle: '逐日计划(按到达地当地时间)',
      schedHint: '逐步平移睡眠,并掐准光照时机。"亮光"=户外或明亮台灯;"昏暗"=暖弱光、不看屏幕。',
      thDay: '第', thBed: '入睡', thWake: '起床', thGet: '☀ 晒亮光', thAvoid: '🌙 保持昏暗',
      tipsTitle: '还有帮助',
      tip1: '上飞机就把手表调到到达地时间,并按它睡觉/起床。',
      tip2: '到达后多去户外晒自然光 —— 这是最强的信号。',
      tip3: '咖啡因只在你的"新早晨"喝;临近新的入睡时间别喝酒、别吃大餐。',
      tip4: '多喝水;短散步胜过长午睡,小睡控制在 20 分钟内。',
      melSum: '关于褪黑素',
      melBody: '有些旅客会在到达地入睡前用小剂量(0.5–1 mg)褪黑素来帮助"提前"。时机与是否适用因人而异 —— 这只是信息、非建议;如在服药或有健康状况,请咨询专业医生。',
      disc: '基于昼夜节律科学的教育性规划工具 —— 非医疗建议。',
      reset: '重置', day: '第',
      eastAhead: '东(到达地超前)', westBehind: '西(到达地滞后)',
      needAdvance: '生物钟需要"提前" —— 往早调。',
      needDelay: '生物钟需要"推后" —— 往晚调。',
      noShift: '同一时区 —— 没有时差要倒。🎉 旅途愉快!',
      flip: function (mag, rec) { return '东向跨度大 —— 与其硬把生物钟提前 ' + mag + ' 小时,通常反过来推后(约 ' + rec + ' 小时)更轻松。下面的计划就是这么安排的。'; },
      preAdvance: function (n, r) { return '出发前 ' + n + ' 天开始:每晚把入睡和起床都提前约 ' + r + ' 小时,起床后立刻晒亮光。落地时你已经调好一部分。'; },
      preDelay: function (n, r) { return '出发前 ' + n + ' 天开始:每晚把入睡和起床都推后约 ' + r + ' 小时,傍晚晒亮光。落地时你已经调好一部分。'; }
    }
  };

  var DEFAULTS = { home: 8, dest: 0, bed: '23:00', wake: '07:00', pre: '3', lang: 'en' };
  var state = Object.assign({}, DEFAULTS, load());
  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
  function t(k) { return STR[state.lang][k]; }

  // build city selects
  function fillCities() {
    [['home', state.home], ['dest', state.dest]].forEach(function (pair) {
      var sel = $(pair[0]); sel.innerHTML = '';
      CITIES.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.off; o.textContent = (state.lang === 'zh' ? c.zh : c.en) + '  (UTC' + (c.off >= 0 ? '+' : '') + c.off + ')';
        sel.appendChild(o);
      });
      sel.value = String(pair[1]);
    });
  }

  function bind() {
    $('home').addEventListener('change', function () { state.home = +this.value; persist(); render(); });
    $('dest').addEventListener('change', function () { state.dest = +this.value; persist(); render(); });
    $('bed').addEventListener('change', function () { state.bed = this.value; persist(); render(); });
    $('wake').addEventListener('change', function () { state.wake = this.value; persist(); render(); });
    $('pre').addEventListener('change', function () { state.pre = this.value; persist(); render(); });
    Array.prototype.forEach.call(document.querySelectorAll('#langSeg button'), function (b) {
      b.addEventListener('click', function () { setLang(this.dataset.lang); });
    });
    $('resetBtn').addEventListener('click', function () { localStorage.removeItem(LS); location.reload(); });
    $('bed').value = state.bed; $('wake').value = state.wake; $('pre').value = state.pre;
  }

  function win(range) { return range ? range[0] + '–' + range[1] : '—'; }

  function render() {
    var p = JETLAG.plan({ homeOffset: state.home, destOffset: state.dest, bedtime: state.bed, waketime: state.wake, startDaysBefore: +state.pre });
    var noShift = p.magnitude === 0;

    $('r-shift').textContent = noShift ? '0h' : (p.magnitude + 'h');
    if (noShift) {
      $('r-dir').textContent = t('noShift');
      $('r-flip').style.display = 'none';
      $('preCard').style.display = 'none';
      document.querySelectorAll('.days-pill').forEach && document.querySelector('.days-pill').style && (document.querySelector('.days-pill').style.display = 'none');
      document.querySelector('#schedTable').closest('.card').style.display = 'none';
      return;
    }
    document.querySelector('.days-pill').style.display = '';
    document.querySelector('#schedTable').closest('.card').style.display = '';

    var ew = p.shiftHours > 0 ? t('eastAhead') : t('westBehind');
    var need = p.directionNeeded === 'advance' ? t('needAdvance') : t('needDelay');
    $('r-dir').textContent = ew + ' — ' + need;

    if (p.flippedForEase) {
      $('r-flip').style.display = '';
      $('r-flip').textContent = t('flip')(p.magnitude, 24 - p.magnitude);
    } else { $('r-flip').style.display = 'none'; }

    $('r-days').textContent = p.daysToAdjust;

    if (p.preTrip) {
      $('preCard').style.display = '';
      $('r-pre').textContent = (p.preTrip.direction === 'advance' ? t('preAdvance') : t('preDelay'))(p.preTrip.days, p.preTrip.perDayHours);
    } else { $('preCard').style.display = 'none'; }

    var tb = document.querySelector('#schedTable tbody'); tb.innerHTML = '';
    p.schedule.forEach(function (d) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (state.lang === 'zh' ? (t('day') + ' ' + d.day + ' 天') : (t('day') + ' ' + d.day)) + '</td>' +
        '<td>' + d.bedtime + '</td><td>' + d.wake + '</td>' +
        '<td class="get win">' + win(d.lightGet) + '</td>' +
        '<td class="avoid win">' + win(d.lightAvoid) + '</td>';
      tb.appendChild(tr);
    });
  }

  function setLang(l) {
    state.lang = l; persist();
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    Array.prototype.forEach.call(document.querySelectorAll('#langSeg button'), function (b) { b.classList.toggle('on', b.dataset.lang === l); });
    document.querySelectorAll('[data-i18n]').forEach(function (el) { var v = STR[l][el.dataset.i18n]; if (v != null && typeof v === 'string') el.textContent = v; });
    fillCities();
    render();
  }

  fillCities();
  bind();
  setLang(state.lang);
})();
