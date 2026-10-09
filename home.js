/* Home page: live numbers and "open jobs by country" chips from the shared job board. */
(function () {
  'use strict';
  if (!window.HVG_BOARD) return;
  var box = document.getElementById('homeJobs');
  var statJobs = document.getElementById('statJobs'), statCountries = document.getElementById('statCountries');
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  window.HVG_BOARD.watchJobs(function (jobs, err) {
    if (err && err.code === 'no_db') {
      if (box) { box.textContent = ''; box.appendChild(el('p', 'empty', 'Live job counts appear here for signed-in viewers with access to this page.')); }
      return;
    }
    var c = {}, names = {}, total = 0;
    jobs.forEach(function (j) {
      if (j.status !== 'closed' && j.country) { total++; c[j.country] = (c[j.country] || 0) + 1; names[j.country] = j.countryName || j.country; }
    });
    var ids = Object.keys(c).sort(function (a, b) { return c[b] - c[a] || names[a].localeCompare(names[b]); });
    if (statJobs) statJobs.textContent = String(total);
    if (statCountries) statCountries.textContent = String(ids.length);
    if (!box) return;
    box.textContent = '';
    if (!ids.length) { box.appendChild(el('p', 'empty', 'No jobs posted yet. Be the first to post one.')); return; }
    ids.slice(0, 16).forEach(function (id) {
      var a = el('a', 'chip'); a.href = 'jobs.html#' + id;
      a.appendChild(el('span', null, names[id]));
      a.appendChild(el('b', null, String(c[id])));
      box.appendChild(a);
    });
  });
})();
