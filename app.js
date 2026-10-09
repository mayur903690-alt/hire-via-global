/* Hire Via Global shared script: icons, header/footer, tilt cards,
   pipeline, KPI calculator, forms. Each feature runs only if its markup exists. */
(function () {
  'use strict';

  var P = {
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    chart: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>'
  };
  function icon(name) {
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }
  function $(id) { return document.getElementById(id); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header and footer ---------- */
  var pages = [
    ['home', 'index.html', 'Home'],
    ['about', 'about.html', 'About Us'],
    ['solutions', 'solutions.html', 'HR Solutions'],
    ['recruitment', 'recruitment.html', 'Recruitment'],
    ['staffing', 'staffing.html', 'Staffing Solutions'],
    ['jobs', 'jobs.html', 'Jobs'],
    ['contact', 'contact.html', 'Contact']
  ];
  var current = document.body.getAttribute('data-page') || 'home';

  var headerHost = $('site-header');
  if (headerHost) {
    var links = pages.map(function (p) {
      return '<a href="' + p[1] + '"' + (p[0] === current ? ' aria-current="page"' : '') + '>' + p[2] + '</a>';
    }).join('');
    headerHost.className = 'site-header';
    headerHost.innerHTML =
      '<div class="wrap bar">' +
        '<a class="brand" href="index.html" aria-label="Hire Via Global home"><span class="mark">' + icon('globe') + '</span>Hire Via Global</a>' +
        '<button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="nav">' + icon('menu') + '</button>' +
        '<nav class="nav" id="nav" aria-label="Main">' + links +
          '<span class="login" aria-disabled="true" title="Employee login is not available yet">Employee Login <small>Soon</small></span>' +
          '<a class="btn btn-primary" href="contact.html">Get Started</a>' +
        '</nav>' +
      '</div>';
    var onScroll = function () { headerHost.classList.toggle('scrolled', (window.scrollY || 0) > 4); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var btn = $('menuBtn'), nav = $('nav');
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.innerHTML = icon(open ? 'close' : 'menu');
    };
    btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  }

  var footerHost = $('site-footer');
  if (footerHost) {
    footerHost.innerHTML =
      '<footer><div class="wrap">' +
        '<div class="foot-grid">' +
          '<div><div class="brand"><span class="mark">' + icon('globe') + '</span>Hire Via Global</div>' +
          '<p>HR consulting, recruitment and staffing support for growing teams.</p></div>' +
          '<div><h4>Pages</h4><ul>' + pages.map(function (p) { return '<li><a href="' + p[1] + '">' + p[2] + '</a></li>'; }).join('') + '</ul></div>' +
          '<div><h4>Contact</h4><ul><li>[Add office address]</li><li>[Add phone number]</li><li>[Add business email]</li></ul></div>' +
          '<div><h4>Legal</h4><ul><li>Privacy policy (to be added)</li><li>Terms and conditions (to be added)</li></ul></div>' +
        '</div>' +
        '<p class="copy">© 2026 Hire Via Global. All rights reserved.</p>' +
      '</div></footer>';
  }

  /* ---------- Icons in markup ---------- */
  document.querySelectorAll('[data-i]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-i')); });

  /* ---------- Entrance motion (elements stay visible; only position animates) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('rise'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.card, .why, .principles li, .steps li, .tool, .formcard, .faq details').forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3D tilt on cards (mouse only) ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(800px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Recruitment pipeline ---------- */
  var pipe = $('pipe');
  if (pipe) {
    var stages = [
      ['New Application', 'Every application is logged with its source and date, so nothing sits unseen in an inbox.', 'Recruiter', 'A candidate record with contact details, CV and source'],
      ['Screening', 'The CV is checked against the role brief. A short call confirms availability, expectations and the basics of fit.', 'Recruiter', 'A pass or hold decision with notes'],
      ['Shortlisted', 'Candidates who meet the brief are presented to you with a short summary of their experience and what they are looking for.', 'Recruiter and hiring manager', 'A shortlist with a one-paragraph summary per candidate'],
      ['Interview', 'Interviews are scheduled with your team. Each interviewer records feedback against the same criteria.', 'Hiring manager', 'Structured feedback and a hiring recommendation'],
      ['Offer', 'Terms are agreed, the offer is issued, and the response is tracked until it is accepted or declined.', 'Recruiter and HR', 'An accepted offer with a confirmed joining date'],
      ['Hired', 'The joining date is confirmed and the candidate record is handed over to onboarding.', 'HR', 'A new employee ready for onboarding']
    ];
    var pStage = $('pStage'), pText = $('pText'), pOwner = $('pOwner'), pOut = $('pOut'), pBar = $('pBar'), pCount = $('pCount');
    var buttons = [];
    stages.forEach(function (s, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.textContent = s[0]; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { select(i); });
      li.appendChild(b); pipe.appendChild(li); buttons.push(b);
    });
    function select(i) {
      buttons.forEach(function (b, j) {
        b.setAttribute('aria-pressed', String(j === i));
        b.classList.toggle('done', j < i);
      });
      var s = stages[i];
      pStage.textContent = s[0]; pText.textContent = s[1]; pOwner.textContent = s[2]; pOut.textContent = s[3];
      pCount.textContent = 'Stage ' + (i + 1) + ' of ' + stages.length;
      pBar.style.width = (((i + 1) / stages.length) * 100) + '%';
    }
    select(0);
  }

  /* ---------- KPI calculator ---------- */
  var kpiBody = $('kpiBody');
  if (kpiBody) {
    var rows = [
      ['Calls handled', 400, 372, 'higher', 40],
      ['Error rate (%)', 2, 1.5, 'lower', 30],
      ['On-time delivery (%)', 95, 97, 'higher', 30]
    ];
    rows.forEach(function (r, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><label class="sr" for="k' + i + 'n" style="font-weight:500">KPI ' + (i + 1) + ' name</label><input id="k' + i + 'n" value="' + r[0] + '"></td>' +
        '<td><label for="k' + i + 't" hidden>Target</label><input id="k' + i + 't" type="number" step="any" value="' + r[1] + '" aria-label="Target for KPI ' + (i + 1) + '"></td>' +
        '<td><input id="k' + i + 'a" type="number" step="any" value="' + r[2] + '" aria-label="Actual for KPI ' + (i + 1) + '"></td>' +
        '<td><select id="k' + i + 'd" aria-label="Direction for KPI ' + (i + 1) + '"><option value="higher">Higher is better</option><option value="lower">Lower is better</option></select></td>' +
        '<td><input id="k' + i + 'w" type="number" min="0" step="any" value="' + r[4] + '" aria-label="Weight for KPI ' + (i + 1) + '"></td>' +
        '<td id="k' + i + 'p">–</td><td id="k' + i + 's"></td>';
      kpiBody.appendChild(tr);
      $('k' + i + 'd').value = r[3];
    });
    // The name labels above are hidden visually by the table header; keep them for screen readers.
    kpiBody.querySelectorAll('label').forEach(function (l) { l.style.cssText = 'position:absolute;left:-9999px'; });

    var achievement = function (target, actual, dir) {
      if (isNaN(target) || isNaN(actual)) return { v: null, why: 'Enter numbers' };
      if (dir === 'higher') {
        if (target <= 0) return { v: null, why: 'Target must be above 0' };
        return { v: actual / target * 100 };
      }
      if (target < 0 || actual < 0) return { v: null, why: 'Use values of 0 or more' };
      if (actual === 0) return { v: 100 };            // nothing to reduce: target met
      return { v: target / actual * 100 };            // lower is better: target ÷ actual
    };
    var status = function (v) {
      if (v === null) return ['na', 'Not scored'];
      if (v >= 100) return ['ok', 'Target achieved'];
      if (v >= 85) return ['good', 'On track'];
      if (v >= 60) return ['warn', 'Needs attention'];
      return ['bad', 'Below target'];
    };
    var calc = function () {
      var sum = 0, wsum = 0;
      for (var i = 0; i < rows.length; i++) {
        var a = achievement(parseFloat($('k' + i + 't').value), parseFloat($('k' + i + 'a').value), $('k' + i + 'd').value);
        var w = parseFloat($('k' + i + 'w').value);
        var st = status(a.v);
        $('k' + i + 'p').textContent = a.v === null ? a.why : a.v.toFixed(1) + '%';
        $('k' + i + 's').innerHTML = '<span class="pill ' + st[0] + '">' + st[1] + '</span>';
        if (a.v !== null && w > 0) { sum += Math.min(a.v, 100) * w; wsum += w; }
      }
      var out = $('kpiScore'), lab = $('kpiLabel');
      if (wsum > 0) {
        var s = sum / wsum, st2 = status(s);
        out.textContent = s.toFixed(1);
        lab.innerHTML = '<span class="pill ' + st2[0] + '">' + st2[1] + '</span>';
      } else {
        out.textContent = '–';
        lab.innerHTML = '<span class="pill na">Add a weight above 0</span>';
      }
    };
    kpiBody.addEventListener('input', calc);
    kpiBody.addEventListener('change', calc);
    calc();
  }

  /* ---------- Forms (validated in the page; not connected to email or a database) ---------- */
  function wireForm(formId, rules, build, title) {
    var form = $(formId);
    if (!form) return;
    var result = form.querySelector('.result');
    function check(r) {
      var input = $(r[0]), msg = r[2](input.value);
      $(r[1]).textContent = msg;
      input.closest('.field').classList.toggle('bad', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }
    rules.forEach(function (r) { $(r[0]).addEventListener('blur', function () { check(r); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      result.hidden = true;
      var firstBad = null;
      rules.forEach(function (r) { if (!check(r) && !firstBad) firstBad = $(r[0]); });
      if (firstBad) { firstBad.focus(); return; }
      var text = build();
      result.innerHTML = '<h3>' + title + '</h3>' +
        '<p>This site has no email or database connection yet, so nothing was submitted. Copy the details below and send them to the team directly.</p>' +
        '<pre></pre><button type="button" class="btn btn-ghost">Copy details</button>';
      var pre = result.querySelector('pre'), b = result.querySelector('button');
      pre.textContent = text;
      result.hidden = false;
      b.addEventListener('click', function () {
        function done() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy details'; }, 1800); }
        function fallback() {
          var range = document.createRange(); range.selectNodeContents(pre);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(range);
          b.textContent = 'Press Ctrl+C to copy';
        }
        try { navigator.clipboard.writeText(text).then(done, fallback); } catch (err) { fallback(); }
      });
      result.scrollIntoView({ block: 'nearest' });
    });
  }
  var minLen = function (n, msg) { return function (v) { return v.trim().length >= n ? '' : msg; }; };
  var val = function (id) { return $(id).value.trim(); };

  wireForm('contactForm', [
    ['fName', 'eName', minLen(2, 'Enter your full name.')],
    ['fEmail', 'eEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address, for example name@company.com.'; }],
    ['fPhone', 'ePhone', function (v) { var d = v.replace(/\D/g, ''); return /^[0-9+()\-\s]+$/.test(v) && d.length >= 7 && d.length <= 15 ? '' : 'Enter a phone number with 7 to 15 digits.'; }],
    ['fCompany', 'eCompany', minLen(2, 'Enter your company name.')],
    ['fService', 'eService', function (v) { return v ? '' : 'Choose a service.'; }],
    ['fMsg', 'eMsg', minLen(10, 'Write at least 10 characters about what you need.')]
  ], function () {
    return ['Name: ' + val('fName'), 'Email: ' + val('fEmail'), 'Phone: ' + val('fPhone'), 'Company: ' + val('fCompany'),
      'Service: ' + $('fService').value, 'Message: ' + val('fMsg')].join('\n');
  }, 'Details checked, but not sent');

  wireForm('briefForm', [
    ['bRole', 'eRole', minLen(2, 'Enter the role or skill you need.')],
    ['bCount', 'eCount', function (v) { var n = parseInt(v, 10); return n >= 1 && n <= 500 ? '' : 'Enter a headcount from 1 to 500.'; }],
    ['bModel', 'eModel', function (v) { return v ? '' : 'Choose an engagement type.'; }],
    ['bStart', 'eStart', function (v) { return v ? '' : 'Choose a target start date.'; }],
    ['bDur', 'eDur', function (v) { var n = parseInt(v, 10); return n >= 1 && n <= 60 ? '' : 'Enter a duration from 1 to 60 months.'; }]
  ], function () {
    var n = parseInt($('bCount').value, 10);
    return ['Staffing request', 'Role: ' + val('bRole'), 'People needed: ' + n, 'Engagement: ' + $('bModel').value,
      'Target start: ' + $('bStart').value, 'Duration: ' + parseInt($('bDur').value, 10) + ' month(s)',
      'Notes: ' + (val('bNotes') || 'None')].join('\n');
  }, 'Brief ready, but not sent');
  var bStart = $('bStart');
  if (bStart) {
    var d = new Date(); d.setDate(d.getDate() + 14);
    var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    bStart.min = iso; bStart.value = iso;
  }
})();
