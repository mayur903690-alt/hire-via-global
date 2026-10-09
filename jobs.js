/* Find Jobs / Hire Talent page. All user-supplied text is inserted with
   textContent, never as HTML. */
(function () {
  'use strict';
  var B = window.HVG_BOARD, S = B.state, W = window.HVG_WORLD || { ok: false, sorted: [], byId: {} };
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var FALLBACK = [['ARE', 'United Arab Emirates'], ['SAU', 'Saudi Arabia'], ['QAT', 'Qatar'], ['OMN', 'Oman'], ['KWT', 'Kuwait'], ['BHR', 'Bahrain'],
    ['IND', 'India'], ['PAK', 'Pakistan'], ['BGD', 'Bangladesh'], ['LKA', 'Sri Lanka'], ['NPL', 'Nepal'], ['PHL', 'Philippines'], ['SGP', 'Singapore'],
    ['MYS', 'Malaysia'], ['IDN', 'Indonesia'], ['CHN', 'China'], ['JPN', 'Japan'], ['AUS', 'Australia'], ['NZL', 'New Zealand'], ['GBR', 'United Kingdom'],
    ['IRL', 'Ireland'], ['DEU', 'Germany'], ['FRA', 'France'], ['ESP', 'Spain'], ['ITA', 'Italy'], ['NLD', 'Netherlands'], ['USA', 'United States of America'],
    ['CAN', 'Canada'], ['MEX', 'Mexico'], ['BRA', 'Brazil'], ['ZAF', 'South Africa'], ['KEN', 'Kenya'], ['NGA', 'Nigeria'], ['EGY', 'Egypt']];
  var countryList = W.ok ? W.sorted.map(function (f) { return [f.id, f.name]; }) : FALLBACK;
  var nameOf = {}; countryList.forEach(function (c) { nameOf[c[0]] = c[1]; });

  var TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];

  /* ---------- Fill selects ---------- */
  function fillCountry(sel, first) {
    sel.appendChild(new Option(first, ''));
    countryList.forEach(function (c) { sel.appendChild(new Option(c[1], c[0])); });
  }
  fillCountry($('qCountry'), 'All countries');
  fillCountry($('pCountry'), 'Choose a country');
  TYPES.forEach(function (t) { $('qType').appendChild(new Option(t, t)); $('pType').appendChild(new Option(t, t)); });
  $('qType').insertBefore(new Option('Any type', ''), $('qType').firstChild); $('qType').value = '';

  /* ---------- Tabs and hash ---------- */
  var tabFind = $('tabFind'), tabHire = $('tabHire'), panFind = $('panFind'), panHire = $('panHire');
  function showTab(which) {
    var find = which === 'find';
    tabFind.setAttribute('aria-selected', String(find)); tabHire.setAttribute('aria-selected', String(!find));
    panFind.hidden = !find; panHire.hidden = find;
  }
  tabFind.addEventListener('click', function () { showTab('find'); });
  tabHire.addEventListener('click', function () { showTab('hire'); });
  function applyHash() {
    var h = (location.hash || '').replace('#', '');
    if (!h) return;
    if (h === 'find') { showTab('find'); return; }
    if (h === 'hire') { showTab('hire'); return; }
    var m = /^hire-(.+)$/.exec(h);
    if (m) { showTab('hire'); if (nameOf[m[1]]) $('pCountry').value = m[1]; return; }
    if (nameOf[h]) { showTab('find'); $('qCountry').value = h; render(); }
  }
  window.addEventListener('hashchange', applyHash);

  /* ---------- Banner (availability) ---------- */
  function setBanner(msg) { var b = $('banner'); b.hidden = !msg; b.textContent = msg || ''; }
  function canPost() { return !!S.db && !!S.uid && S.canWrite !== false; }

  /* ---------- Private per-person data: saved and applied ---------- */
  var mine = { saved: {}, applied: {} };
  function watchMine() {
    if (!S.db || !S.uid) return;
    S.db.collection('data/users/' + S.uid).onSnapshot(function (snap) {
      var saved = {}, applied = {};
      snap.docs.forEach(function (d) {
        var x = d.data() || {};
        if (x.kind === 'saved') saved[x.jobId] = true;
        if (x.kind === 'applied') applied[x.jobId] = true;
      });
      mine.saved = saved; mine.applied = applied; render();
    }, function () {});
  }

  /* ---------- Job list ---------- */
  var jobs = [], openForm = null;
  function ago(ts) {
    if (!ts) return '';
    var d = Math.floor((Date.now() - ts) / 86400000);
    return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d + ' days ago';
  }
  function matches(j) {
    if (j.status === 'closed') return false;
    var q = $('qText').value.trim().toLowerCase(), c = $('qCountry').value, t = $('qType').value;
    if (c && j.country !== c) return false;
    if (t && j.type !== t) return false;
    if ($('qSaved').checked && !mine.saved[j.id]) return false;
    if (q) {
      var hay = [j.title, j.company, j.city, j.countryName, j.description].join(' ').toLowerCase();
      var words = q.split(/\s+/);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function field(id, label, input, errId) {
    var f = el('div', 'field'); var l = el('label', null, label); l.setAttribute('for', id);
    input.id = id; f.appendChild(l); f.appendChild(input);
    var e = el('span', 'err'); e.id = errId; f.appendChild(e); return f;
  }
  function applyForm(j) {
    var form = el('form', 'apply'); form.noValidate = true;
    var name = el('input'), email = el('input'), phone = el('input'), cvl = el('input'), msg = el('textarea');
    email.type = 'email'; phone.type = 'tel'; cvl.type = 'url'; cvl.placeholder = 'https://…'; msg.style.minHeight = '90px';
    name.autocomplete = 'name'; email.autocomplete = 'email'; phone.autocomplete = 'tel';
    var p = 'a' + j.id + '_';
    form.appendChild(field(p + 'n', 'Full name', name, p + 'en'));
    form.appendChild(field(p + 'e', 'Email', email, p + 'ee'));
    form.appendChild(field(p + 'p', 'Phone (optional)', phone, p + 'ep'));
    form.appendChild(field(p + 'c', 'CV link (optional)', cvl, p + 'ec'));
    var mf = field(p + 'm', 'Short message (optional)', msg, p + 'em'); mf.className = 'field full'; form.appendChild(mf);
    var foot = el('div', 'form-foot'); var go = el('button', 'btn btn-primary', 'Send application'); go.type = 'submit';
    var note = el('small', null, 'Your details go to the Hire Via Global team, not to the employer directly.');
    foot.appendChild(go); foot.appendChild(note); form.appendChild(foot);
    var status = el('div', 'inline-status'); status.setAttribute('aria-live', 'polite'); form.appendChild(status);

    function setErr(id, m, input) { $(id).textContent = m; input.closest('.field').classList.toggle('bad', !!m); return !m; }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      ok = setErr(p + 'en', name.value.trim().length >= 2 ? '' : 'Enter your full name.', name) && ok;
      ok = setErr(p + 'ee', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Enter a valid email address.', email) && ok;
      var ph = phone.value.trim(), pd = ph.replace(/\D/g, '');
      ok = setErr(p + 'ep', !ph || (/^[0-9+()\-\s]+$/.test(ph) && pd.length >= 7 && pd.length <= 15) ? '' : 'Enter 7 to 15 digits.', phone) && ok;
      var cv = cvl.value.trim();
      ok = setErr(p + 'ec', !cv || /^https?:\/\/\S+$/i.test(cv) ? '' : 'Enter a link starting with http:// or https://.', cvl) && ok;
      ok = setErr(p + 'em', msg.value.length <= 1000 ? '' : 'Keep the message under 1000 characters.', msg) && ok;
      if (!ok) return;
      go.disabled = true; status.textContent = 'Sending…';
      var rec = { jobId: j.id, jobTitle: j.title, company: j.company, country: j.country, applicantId: S.uid,
                  name: name.value.trim(), email: email.value.trim(), phone: ph, cvLink: cv, message: msg.value.trim(), createdAt: Date.now() };
      var appRef = S.db.doc('applications/' + S.uid);
      appRef.get().then(function (snap) {
        var item = {}; item[j.id] = rec;
        return snap.exists ? appRef.update({ items: item }) : appRef.set({ items: item });
      }).then(function () {
        var own = S.db.collection('data/users/' + S.uid).doc('applied_' + j.id);
        return own.set({ kind: 'applied', jobId: j.id, at: Date.now() }).catch(function () {});
      }).then(function () {
        mine.applied[j.id] = true; openForm = null; render();
      }, function (err) {
        go.disabled = false;
        status.textContent = err && err.code === 'quota_exceeded' ? 'The board is full. Please contact the team directly.'
          : 'Could not send your application. Check your connection and try again.';
      });
    });
    return form;
  }

  function jobCard(j) {
    var c = el('article', 'job-card');
    var top = el('div', 'job-top');
    var left = el('div');
    left.appendChild(el('h3', null, j.title));
    left.appendChild(el('p', 'job-meta', j.company + ' · ' + [j.city, j.countryName].filter(Boolean).join(', ')));
    top.appendChild(left);
    var tags = el('div', 'tags');
    tags.appendChild(el('span', 'tag', j.type));
    if (j.salary) tags.appendChild(el('span', 'tag', j.salary));
    if (j.sample) tags.appendChild(el('span', 'tag sample', 'Sample listing'));
    top.appendChild(tags);
    c.appendChild(top);
    c.appendChild(el('p', 'job-desc', j.description));
    var foot = el('div', 'job-foot');
    foot.appendChild(el('small', null, 'Posted ' + ago(j.createdAt).toLowerCase()));
    var acts = el('div', 'job-acts');
    var save = el('button', 'btn btn-ghost sm', mine.saved[j.id] ? 'Saved' : 'Save');
    save.type = 'button'; save.setAttribute('aria-pressed', String(!!mine.saved[j.id]));
    save.disabled = !S.db || !S.uid;
    save.addEventListener('click', function () {
      var ref = S.db.collection('data/users/' + S.uid).doc('saved_' + j.id);
      var on = !mine.saved[j.id];
      (on ? ref.set({ kind: 'saved', jobId: j.id, at: Date.now() }) : ref.delete()).catch(function () {});
    });
    acts.appendChild(save);
    if (mine.applied[j.id]) {
      acts.appendChild(el('span', 'pill ok', 'Applied'));
    } else {
      var ap = el('button', 'btn btn-primary sm', openForm === j.id ? 'Cancel' : 'Apply'); ap.type = 'button';
      ap.disabled = !canPost();
      ap.addEventListener('click', function () { openForm = openForm === j.id ? null : j.id; renderList(); });
      acts.appendChild(ap);
    }
    foot.appendChild(acts); c.appendChild(foot);
    if (openForm === j.id && !mine.applied[j.id]) c.appendChild(applyForm(j));
    return c;
  }

  /* Re-render, but never while someone is typing in an open application form. */
  function render() {
    if (openForm && $('results').contains(document.activeElement)) return;
    renderList(); renderMine();
  }
  function renderList() {
    var list = $('results'), count = $('resultCount');
    var shown = jobs.filter(matches);
    var openTotal = jobs.filter(function (j) { return j.status !== 'closed'; }).length;
    // Keep the open application form (and its typed text) when the list has not changed.
    list.textContent = '';
    if (!S.db) {
      list.appendChild(el('p', 'empty', 'The job board is not available in this view. Sign in to claude.ai and open the page with the access the site owner gave you.'));
      count.textContent = ''; return;
    }
    count.textContent = shown.length + (shown.length === 1 ? ' job' : ' jobs');
    if (!shown.length) {
      list.appendChild(el('p', 'empty', openTotal ? 'No jobs match these filters. Try a different keyword or country.' : 'No jobs have been posted yet. Employers can post the first one from the Hire talent tab.'));
      return;
    }
    shown.forEach(function (j) { list.appendChild(jobCard(j)); });
  }

  /* Render only when something the view depends on changed. */
  ['qText', 'qCountry', 'qType', 'qSaved'].forEach(function (id) { $(id).addEventListener('input', function () { openForm = null; render(); }); });
  $('qClear').addEventListener('click', function () { $('qText').value = ''; $('qCountry').value = ''; $('qType').value = ''; $('qSaved').checked = false; render(); });

  /* ---------- Hire talent: post a job ---------- */
  function getErr(id, m, input) { $(id).textContent = m; input.closest('.field').classList.toggle('bad', !!m); return !m; }
  $('postForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var t = $('pTitle'), co = $('pCompany'), cn = $('pCountry'), ty = $('pType'), ds = $('pDesc'), ci = $('pCity'), sa = $('pSalary');
    var ok = true;
    ok = getErr('ePTitle', t.value.trim().length >= 3 && t.value.length <= 80 ? '' : 'Enter a job title of 3 to 80 characters.', t) && ok;
    ok = getErr('ePCompany', co.value.trim().length >= 2 && co.value.length <= 80 ? '' : 'Enter the company name.', co) && ok;
    ok = getErr('ePCountry', cn.value ? '' : 'Choose a country.', cn) && ok;
    ok = getErr('ePType', ty.value ? '' : 'Choose a job type.', ty) && ok;
    ok = getErr('ePDesc', ds.value.trim().length >= 30 && ds.value.length <= 2000 ? '' : 'Describe the role in 30 to 2000 characters.', ds) && ok;
    ok = getErr('ePCity', ci.value.length <= 60 ? '' : 'Keep the city under 60 characters.', ci) && ok;
    ok = getErr('ePSalary', sa.value.length <= 60 ? '' : 'Keep the pay note under 60 characters.', sa) && ok;
    if (!ok) return;
    var st = $('postStatus'), btn = $('postBtn'); btn.disabled = true; st.textContent = 'Posting…';
    S.db.collection('jobs').add({
      title: t.value.trim(), company: co.value.trim(), country: cn.value, countryName: nameOf[cn.value] || cn.value,
      city: ci.value.trim(), type: ty.value, salary: sa.value.trim(), description: ds.value.trim(),
      ownerId: S.uid, status: 'open', createdAt: Date.now()
    }).then(function () {
      st.textContent = 'Job posted. It now appears in Find a job.';
      $('postForm').reset(); btn.disabled = false;
    }, function (err) {
      btn.disabled = false;
      st.textContent = err && err.code === 'quota_exceeded' ? 'The board is full. Delete old postings or contact the team.' : 'Could not post the job. Check your connection and try again.';
    });
  });

  /* ---------- Hire talent: my postings ---------- */
  var armed = null, armTimer = null;
  function renderMine() {
    var box = $('myJobs'); box.textContent = '';
    if (!S.db || !S.uid) { box.appendChild(el('p', 'empty', 'Sign in to see your postings.')); return; }
    var own = jobs.filter(function (j) { return j.ownerId === S.uid || (S.canEdit && j.sample); });
    if (!own.length) { box.appendChild(el('p', 'empty', 'You have not posted any jobs yet.')); return; }
    own.forEach(function (j) {
      var row = el('div', 'my-row');
      var info = el('div'); info.appendChild(el('strong', null, j.title));
      info.appendChild(el('small', null, ' ' + j.company + ' · ' + (j.countryName || '') + ' · ' + (j.status === 'closed' ? 'Closed' : 'Open')));
      row.appendChild(info);
      var acts = el('div', 'job-acts');
      var tog = el('button', 'btn btn-ghost sm', j.status === 'closed' ? 'Reopen' : 'Close'); tog.type = 'button';
      tog.addEventListener('click', function () { S.db.doc('jobs/' + j.id).update({ status: j.status === 'closed' ? 'open' : 'closed' }).catch(function () {}); });
      var del = el('button', 'btn btn-ghost sm danger', armed === j.id ? 'Confirm delete' : 'Delete'); del.type = 'button';
      del.addEventListener('click', function () {
        if (armed !== j.id) { armed = j.id; clearTimeout(armTimer); armTimer = setTimeout(function () { armed = null; renderMine(); }, 4000); renderMine(); return; }
        armed = null; S.db.doc('jobs/' + j.id).delete().catch(function () {});
      });
      acts.appendChild(tog); acts.appendChild(del); row.appendChild(acts); box.appendChild(row);
    });
  }

  /* ---------- Applications (site editors only) ---------- */
  function watchApplications() {
    if (!S.db || !S.canEdit) return;
    $('appsSection').hidden = false;
    S.db.collection('applications').limit(500).onSnapshot(function (snap) {
      var box = $('appsList'); box.textContent = '';
      var all = [];
      snap.docs.forEach(function (d) {
        var items = (d.data() || {}).items || {};
        Object.keys(items).forEach(function (k) { all.push(items[k]); });
      });
      all.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      if (!all.length) { box.appendChild(el('p', 'empty', 'No applications yet.')); return; }
      all.slice(0, 200).forEach(function (a) {
        var row = el('div', 'my-row app-row');
        var info = el('div');
        info.appendChild(el('strong', null, a.name + ' → ' + a.jobTitle));
        info.appendChild(el('small', null, ' ' + a.company + ' · ' + ago(a.createdAt).toLowerCase()));
        var contact = [a.email, a.phone].filter(Boolean).join(' · ');
        info.appendChild(el('p', 'job-meta', contact));
        if (a.cvLink) info.appendChild(el('p', 'job-meta', 'CV: ' + a.cvLink));
        if (a.message) info.appendChild(el('p', 'job-desc', a.message));
        row.appendChild(info); box.appendChild(row);
      });
    }, function () {});
  }

  /* ---------- Staff sign-in (server mode only) ---------- */
  function setupStaff() {
    var box = $('staffBox'); if (!box) return;
    box.hidden = false;
    var sum = $('staffSummary'), body = $('staffBody'); body.textContent = '';
    if (S.canEdit) {
      sum.textContent = 'Staff access is active';
      var out = el('button', 'btn btn-ghost sm', 'Sign out of staff access'); out.type = 'button';
      out.addEventListener('click', function () { B.setAdminKey(''); location.reload(); });
      body.appendChild(out);
      return;
    }
    sum.textContent = 'Staff sign-in';
    var f = el('div', 'field'); var l = el('label', null, 'Staff access key'); l.setAttribute('for', 'staffKey');
    var inp = el('input'); inp.id = 'staffKey'; inp.type = 'password'; inp.autocomplete = 'off';
    f.appendChild(l); f.appendChild(inp);
    var go = el('button', 'btn btn-primary sm', 'Sign in'); go.type = 'button'; go.style.marginTop = '10px';
    var msg = el('small', null, 'Staff can read applications and manage every posting.'); msg.style.display = 'block'; msg.style.marginTop = '8px';
    go.addEventListener('click', function () {
      if (!inp.value) { msg.textContent = 'Enter the access key.'; return; }
      B.setAdminKey(inp.value); location.reload();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    body.appendChild(f); body.appendChild(go); body.appendChild(msg);
  }

  /* ---------- Boot ---------- */
  var firstRender = true;
  B.watchJobs(function (list, err) {
    jobs = list.slice();
    if (err && err.code === 'no_db') { setBanner('The job board needs a signed-in claude.ai viewer with access to this page. Ask the site owner to share it with you as a Contributor.'); }
    render(); renderMine();
    if (firstRender) { firstRender = false; applyHash(); }
  });
  B.init().then(function () {
    if (!S.db) { render(); return; }
    if (S.mode === 'local') setBanner('Local demo mode: jobs and applications are saved only in this browser. Run the included Node server (node server.js) to share them between visitors.');
    if (S.mode === 'server') setupStaff();
    if (S.mode === 'local') { /* banner above already set */ }
    else if (S.canWrite === false) setBanner('You can browse jobs, but posting and applying need Contributor access. Ask the site owner to upgrade your access.');
    else if (!S.uid) setBanner('Your account has no identity on this page, so saving, posting and applying are off.');
    var post = $('postForm');
    Array.prototype.forEach.call(post.elements, function (x) { x.disabled = !canPost(); });
    watchMine(); watchApplications(); render(); renderMine();
  });
  render(); applyHash();
})();
