/* Job-board data layer. One small document-store API, three back ends:
   - "claude": the artifact `db` and `user` capabilities (when hosted on claude.ai)
   - "server": the included Node server (server.js), shared between visitors
   - "local":  this browser's localStorage, used on any plain static server
   Pages only call HVG_BOARD.state.db (collection/doc/get/set/update/delete/
   add/orderBy/limit/onSnapshot) and watchJobs(), so the back end is invisible. */
(function () {
  'use strict';
  var S = { mode: null, db: null, user: null, uid: null, canWrite: null, canEdit: false, isOwner: false,
            jobs: [], loaded: false, error: null, listeners: [], started: false, ready: null };

  /* ---------- helpers ---------- */
  function newId() { return 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function store(kind) {
    try { var s = window[kind]; s.setItem('__t', '1'); s.removeItem('__t'); return s; } catch (e) { return null; }
  }
  function merge(a, b) {
    var out = {}, k;
    for (k in a) out[k] = a[k];
    for (k in b) {
      var v = b[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = merge(out[k], v);
      else out[k] = v;
    }
    return out;
  }
  function mkDoc(id, data) { return { id: id, exists: data != null, data: function () { return data == null ? undefined : data; } }; }
  function toSnap(rows) {
    var docs = rows.map(function (r) { return mkDoc(r.id, r.data); });
    return { docs: docs, size: docs.length, empty: !docs.length };
  }

  /* ---------- generic db over an async transport ---------- */
  function makeDb(T) {
    var subs = [];
    function notify() { subs.slice().forEach(function (f) { f(); }); }
    if (T.watch) T.watch(notify);

    function query(col, o) {
      function load() {
        return T.list(col).then(function (rows) {
          rows = rows.slice();
          if (o.order) {
            var f = o.order[0], dir = o.order[1] === 'desc' ? -1 : 1;
            rows.sort(function (a, b) { var x = a.data[f], y = b.data[f]; return x === y ? 0 : (x > y ? 1 : -1) * dir; });
          }
          return o.lim ? rows.slice(0, o.lim) : rows;
        });
      }
      return {
        path: col,
        orderBy: function (f, d) { return query(col, { order: [f, d || 'asc'], lim: o.lim }); },
        limit: function (n) { return query(col, { order: o.order, lim: n }); },
        get: function () { return load().then(toSnap); },
        onSnapshot: function (next, err) {
          var dead = false, timer = null;
          function run() {
            if (dead) return;
            load().then(function (rows) { if (!dead) next(toSnap(rows)); },
                        function (e) { if (!dead && err) err({ code: 'unavailable', message: String((e && e.message) || e) }); });
          }
          subs.push(run); run();
          if (T.poll) timer = setInterval(run, T.poll);
          return function () { dead = true; var i = subs.indexOf(run); if (i >= 0) subs.splice(i, 1); if (timer) clearInterval(timer); };
        },
        doc: function (id) { return docRef(col + '/' + id); },
        add: function (data) { var id = newId(); return T.set(col, id, data).then(function () { notify(); return docRef(col + '/' + id); }); }
      };
    }
    function docRef(path) {
      var seg = path.split('/'), id = seg.pop(), col = seg.join('/');
      return {
        id: id, path: path,
        get: function () { return T.get(col, id).then(function (d) { return mkDoc(id, d); }); },
        set: function (d) { return T.set(col, id, d).then(notify); },
        update: function (d) { return T.update(col, id, d).then(notify); },
        delete: function () { return T.del(col, id).then(notify); }
      };
    }
    return { collection: function (p) { return query(p, { order: null, lim: null }); }, doc: docRef };
  }

  /* ---------- local (browser) transport ---------- */
  function localTransport() {
    var KEY = 'hvg_db_v1', ls = store('localStorage'), mem = null;
    function read() {
      if (ls) { try { var s = ls.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {} }
      return mem;
    }
    function write(db) { mem = db; if (ls) { try { ls.setItem(KEY, JSON.stringify(db)); } catch (e) {} } }
    var db = read();
    if (!db) {
      db = { jobs: {} };
      (window.HVG_SEED || []).forEach(function (j) { db.jobs[j.id] = j.data; });
      write(db);
    }
    function col(c) { var d = read() || {}; return d[c] || {}; }
    function put(c, id, data) { var d = read() || {}; d[c] = d[c] || {}; d[c][id] = data; write(d); }
    return {
      newId: newId,
      watch: function (cb) { window.addEventListener('storage', function (e) { if (e.key === KEY) cb(); }); },
      list: function (c) { var m = col(c); return Promise.resolve(Object.keys(m).map(function (id) { return { id: id, data: m[id] }; })); },
      get: function (c, id) { var m = col(c); return Promise.resolve(m[id] || null); },
      set: function (c, id, data) { put(c, id, data); return Promise.resolve(); },
      update: function (c, id, data) {
        var m = col(c);
        if (!m[id]) return Promise.reject(new Error('Document does not exist'));
        put(c, id, merge(m[id], data)); return Promise.resolve();
      },
      del: function (c, id) { var d = read() || {}; if (d[c]) delete d[c][id]; write(d); return Promise.resolve(); }
    };
  }

  /* ---------- http transport (server.js) ---------- */
  function httpTransport(uid, adminKey) {
    function enc(x) { return encodeURIComponent(x); }
    function req(method, url, body) {
      var h = { 'content-type': 'application/json', 'x-uid': uid };
      if (adminKey) h['x-admin-key'] = adminKey;
      return fetch(url, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { var e = new Error(t || ('HTTP ' + r.status)); e.status = r.status; throw e; });
        return r.status === 204 ? null : r.json();
      });
    }
    return {
      poll: 6000, newId: newId,
      list: function (c) { return req('GET', 'api/list?col=' + enc(c)); },
      get: function (c, id) { return req('GET', 'api/doc?col=' + enc(c) + '&id=' + enc(id)).then(function (r) { return r && r.exists ? r.data : null; }); },
      set: function (c, id, data) { return req('PUT', 'api/doc?col=' + enc(c) + '&id=' + enc(id), { data: data }); },
      update: function (c, id, data) { return req('PATCH', 'api/doc?col=' + enc(c) + '&id=' + enc(id), { data: data }); },
      del: function (c, id) { return req('DELETE', 'api/doc?col=' + enc(c) + '&id=' + enc(id)); }
    };
  }

  /* ---------- init ---------- */
  function visitorId() {
    var ls = store('localStorage'), id = ls && ls.getItem('hvg_uid');
    if (!id) { id = 'u_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); if (ls) { try { ls.setItem('hvg_uid', id); } catch (e) {} } }
    return id;
  }
  function adminKey() { var ss = store('sessionStorage'); return (ss && ss.getItem('hvg_admin_key')) || ''; }
  function setAdminKey(k) { var ss = store('sessionStorage'); if (ss) { if (k) ss.setItem('hvg_admin_key', k); else ss.removeItem('hvg_admin_key'); } }
  function timeoutFetch(url, opts, ms) {
    var c = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = c ? setTimeout(function () { c.abort(); }, ms) : null;
    opts = opts || {}; if (c) opts.signal = c.signal;
    return fetch(url, opts).then(function (r) { if (t) clearTimeout(t); return r; }, function (e) { if (t) clearTimeout(t); throw e; });
  }

  function init() {
    if (S.ready) return S.ready;
    S.ready = (async function () {
      if (window.claude && window.claude.use) {
        S.mode = 'claude';
        try { S.db = await window.claude.use('db'); S.user = await window.claude.use('user'); } catch (e) { S.db = null; }
        if (S.user) {
          try {
            S.uid = await S.user.id(); S.canWrite = await S.user.can('data.write');
            S.canEdit = await S.user.canEdit(); S.isOwner = await S.user.isOwner();
          } catch (e) {}
        }
        return S;
      }
      /* Standalone hosting */
      S.uid = visitorId(); S.canWrite = true;
      var online = false;
      try {
        var r = await timeoutFetch('api/health', null, 1500);
        online = r.ok && (await r.json()).ok === true;
      } catch (e) { online = false; }
      if (online) {
        S.mode = 'server';
        var key = adminKey();
        try {
          var w = await timeoutFetch('api/whoami', { headers: { 'x-admin-key': key, 'x-uid': S.uid } }, 2500);
          S.canEdit = w.ok && (await w.json()).admin === true;
        } catch (e) { S.canEdit = false; }
        S.db = makeDb(httpTransport(S.uid, key));
      } else {
        S.mode = 'local'; S.canEdit = true;
        S.db = makeDb(localTransport());
      }
      return S;
    })();
    return S.ready;
  }

  function emit(err) { S.listeners.forEach(function (f) { f(S.jobs, err || null); }); }

  function watchJobs(cb) {
    S.listeners.push(cb);
    if (S.loaded) cb(S.jobs, null);
    init().then(function (s) {
      if (!s.db) { s.noDb = true; cb(s.jobs, { code: 'no_db' }); return; }
      if (S.started) return;
      S.started = true;
      s.db.collection('jobs').orderBy('createdAt', 'desc').limit(500).onSnapshot(function (snap) {
        S.jobs = snap.docs.map(function (d) { var x = Object.assign({}, d.data()); x.id = d.id; return x; });
        S.loaded = true; S.error = null; emit(null);
      }, function (err) { S.error = err; emit(err); });
    });
  }

  window.HVG_BOARD = { state: S, init: init, watchJobs: watchJobs, setAdminKey: setAdminKey };
})();
