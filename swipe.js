/* Home page: swipe-through job cards (drag, buttons or arrow keys), and the
   animated "post a job" step tracker. Cards come from the live job board when
   it is available; otherwise clearly labeled sample cards are shown. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ================= Swipe demo ================= */
  var deck = $('swipeDeck');
  if (deck) {
    var SAMPLE = [
      { title: 'HR Coordinator', company: 'Sample Employer', city: 'Dubai', countryName: 'United Arab Emirates', type: 'Full-time', salary: 'Negotiable', description: 'Support onboarding, attendance records and leave requests for a growing team.' },
      { title: 'Customer Support Agent', company: 'Sample Employer', city: 'Gurugram', countryName: 'India', type: 'Full-time', salary: '', description: 'Handle customer calls and emails and resolve issues on first contact.' },
      { title: 'Recruitment Consultant', company: 'Sample Employer', city: 'London', countryName: 'United Kingdom', type: 'Full-time', salary: 'Salary plus commission', description: 'Run vacancies from brief to offer and keep hiring managers updated.' },
      { title: 'Payroll Analyst', company: 'Sample Employer', city: 'Austin', countryName: 'United States of America', type: 'Contract', salary: 'Hourly', description: 'Prepare payroll inputs and support month-end review with finance.' },
      { title: 'Warehouse Operations Staff', company: 'Sample Employer', city: '', countryName: 'Singapore', type: 'Temporary', salary: 'Daily rate', description: 'Peak-season project work: picking, packing and stock checks.' }
    ];
    SAMPLE.forEach(function (j) { j.sample = true; });

    var jobs = SAMPLE, i = 0, saved = 0, skipped = 0, started = false, busy = false;
    var sSaved = $('swSaved'), sSkipped = $('swSkipped'), sProg = $('swProgress'), live = $('swLive'), note = $('swNote');
    var btnSkip = $('swSkip'), btnSave = $('swSave');

    function counts() {
      sSaved.textContent = saved; sSkipped.textContent = skipped;
      sProg.textContent = Math.min(i, jobs.length) + '/' + jobs.length;
      var done = i >= jobs.length;
      btnSkip.disabled = btnSave.disabled = done;
    }
    function card(j, depth) {
      var c = el('article', 'sw-card' + (depth === 0 ? ' top' : ''));
      c.style.setProperty('--d', depth);
      c.appendChild(el('span', 'sw-stamp save', 'SAVE'));
      c.appendChild(el('span', 'sw-stamp skip', 'SKIP'));
      var tags = el('div', 'tags');
      tags.appendChild(el('span', 'tag', j.type));
      if (j.salary) tags.appendChild(el('span', 'tag', j.salary));
      if (j.sample) tags.appendChild(el('span', 'tag sample', 'Sample'));
      c.appendChild(tags);
      c.appendChild(el('h3', null, j.title));
      c.appendChild(el('p', 'job-meta', j.company + ' · ' + [j.city, j.countryName].filter(Boolean).join(', ')));
      c.appendChild(el('p', 'sw-desc', j.description));
      return c;
    }

    function render() {
      deck.textContent = '';
      if (i >= jobs.length) {
        var done = el('div', 'sw-done');
        done.appendChild(el('h3', null, saved ? 'You saved ' + saved + (saved === 1 ? ' job' : ' jobs') : 'No jobs saved this time'));
        done.appendChild(el('p', null, 'Browse every open role, filter by country and apply from the job board.'));
        var row = el('div', 'cc-actions');
        var a = el('a', 'btn btn-primary', 'Open the job board'); a.href = 'jobs.html#find';
        var r = el('button', 'btn btn-ghost', 'Swipe again'); r.type = 'button';
        r.addEventListener('click', function () { i = 0; saved = 0; skipped = 0; started = false; render(); counts(); });
        row.appendChild(a); row.appendChild(r); done.appendChild(row); deck.appendChild(done);
        return;
      }
      for (var k = Math.min(i + 2, jobs.length - 1); k >= i; k--) deck.appendChild(card(jobs[k], k - i));
      bindTop();
    }

    function persist(j) {
      var S = window.HVG_BOARD && window.HVG_BOARD.state;
      if (!S || !S.db || !S.uid || S.canWrite === false || !j.id) return;
      S.db.collection('data/users/' + S.uid).doc('saved_' + j.id).set({ kind: 'saved', jobId: j.id, at: Date.now() }).catch(function () {});
    }
    function commit(dir) {
      var j = jobs[i];
      if (dir > 0) { saved++; persist(j); } else skipped++;
      live.textContent = (dir > 0 ? 'Saved ' : 'Skipped ') + j.title;
      i++; started = true; busy = false; render(); counts();
    }
    function fly(dir) {
      var top = deck.querySelector('.sw-card.top');
      if (!top || busy) return;
      busy = true;
      top.style.transition = reduce ? 'none' : 'transform 0.32s ease-out, opacity 0.32s';
      top.style.transform = 'translate(' + (dir * 520) + 'px,-30px) rotate(' + (dir * 22) + 'deg)';
      top.style.opacity = '0';
      setTimeout(function () { commit(dir); }, reduce ? 0 : 300);
    }

    function bindTop() {
      var top = deck.querySelector('.sw-card.top');
      if (!top) return;
      var sv = top.querySelector('.sw-stamp.save'), sk = top.querySelector('.sw-stamp.skip');
      var down = false, sx = 0, sy = 0, dx = 0, dy = 0;
      top.addEventListener('pointerdown', function (e) {
        if (busy) return;
        down = true; sx = e.clientX; sy = e.clientY; top.style.transition = 'none';
        try { top.setPointerCapture(e.pointerId); } catch (x) {}
      });
      top.addEventListener('pointermove', function (e) {
        if (!down) return;
        dx = e.clientX - sx; dy = (e.clientY - sy) * 0.4;
        top.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 14) + 'deg)';
        sv.style.opacity = Math.max(0, Math.min(1, dx / 90));
        sk.style.opacity = Math.max(0, Math.min(1, -dx / 90));
      });
      function end() {
        if (!down) return; down = false;
        if (Math.abs(dx) > 110) { fly(dx > 0 ? 1 : -1); }
        else {
          top.style.transition = reduce ? 'none' : 'transform 0.25s ease-out';
          top.style.transform = ''; sv.style.opacity = 0; sk.style.opacity = 0;
        }
        dx = 0; dy = 0;
      }
      top.addEventListener('pointerup', end);
      top.addEventListener('pointercancel', end);
    }

    btnSkip.addEventListener('click', function () { fly(-1); });
    btnSave.addEventListener('click', function () { fly(1); });
    deck.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); fly(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); fly(1); }
    });

    function setNote(sample) {
      note.textContent = sample
        ? 'These are sample cards. Open jobs from the board appear here once employers post them.'
        : 'Cards come from the live job board. Saved jobs are kept in your account.';
    }
    render(); counts(); setNote(true);

    if (window.HVG_BOARD) {
      window.HVG_BOARD.watchJobs(function (list, err) {
        if (started) return;
        var open = (list || []).filter(function (j) { return j.status !== 'closed'; }).slice(0, 8);
        if (err && err.code === 'no_db') return;
        if (open.length) { jobs = open; setNote(false); } else { jobs = SAMPLE; setNote(true); }
        i = 0; render(); counts();
      });
    }
  }

  /* ================= Post-a-job step tracker ================= */
  var trk = $('tracker');
  if (trk) {
    var steps = trk.querySelectorAll('li'), bar = $('trkBar'), lab = $('trkCount');
    function show(n) {
      steps.forEach(function (li, k) {
        li.classList.toggle('done', k < n);
        li.classList.toggle('now', k === n && n < steps.length);
      });
      bar.style.width = (n / steps.length * 100) + '%';
      lab.textContent = n + '/' + steps.length + ' done';
    }
    if (reduce) { show(steps.length); }
    else {
      var n = 0, vis = true, timer = null;
      function tick() {
        if (!vis) { timer = null; return; }
        show(n);
        n = n >= steps.length ? 0 : n + 1;
        timer = setTimeout(tick, n === 0 ? 2600 : 1200);
      }
      show(0);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis && !timer) tick(); }, { threshold: 0.2 }).observe(trk);
      } else { tick(); }
    }
  }
})();
