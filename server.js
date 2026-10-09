'use strict';
/*
 * Hire Via Global: zero-dependency Node server.
 *   - serves the website files in this folder
 *   - provides the shared job board API used by board.js, stored in data/db.json
 *
 * Run:   node server.js
 * Env:   PORT (default 8080)   HOST (default 127.0.0.1; use 0.0.0.0 for your network)
 *        ADMIN_KEY (staff access key; CHANGE IT)   DATA_DIR (default ./data)
 * Needs Node 18 or newer. No npm install required.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me';
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_BODY = 64 * 1024;

/* ---------- storage ---------- */
let db = {};
function loadDb() {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { db = {}; }
  if (!db.jobs || !Object.keys(db.jobs).length) {
    db.jobs = db.jobs || {};
    try {
      JSON.parse(fs.readFileSync(path.join(ROOT, 'seed.json'), 'utf8')).forEach((j) => { db.jobs[j.id] = j.data; });
    } catch (e) { /* no seed file */ }
    saveNow();
  }
}
let saveTimer = null;
function saveNow() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 150); }
process.on('SIGINT', () => { try { saveNow(); } catch (e) {} process.exit(0); });
process.on('SIGTERM', () => { try { saveNow(); } catch (e) {} process.exit(0); });

/* ---------- helpers ---------- */
const SEG = '[A-Za-z0-9_\\-.~:@+]{1,200}';
const COL_RE = new RegExp('^' + SEG + '(?:/' + SEG + '){0,6}$');
const ID_RE = new RegExp('^' + SEG + '$');
const UID_RE = /^[A-Za-z0-9_-]{6,64}$/;

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function who(req) {
  const uid = String(req.headers['x-uid'] || '');
  return { uid: UID_RE.test(uid) ? uid : '', admin: safeEqual(req.headers['x-admin-key'] || '', ADMIN_KEY) };
}
function merge(a, b) {
  const out = Object.assign({}, a);
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = merge(out[k], v);
    else out[k] = v;
  }
  return out;
}
function send(res, code, body, headers) {
  const h = Object.assign({ 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, headers || {});
  if (body !== undefined && typeof body !== 'string' && !Buffer.isBuffer(body)) { body = JSON.stringify(body); h['content-type'] = 'application/json; charset=utf-8'; }
  res.writeHead(code, h);
  res.end(body);
}

/* ---------- access rules ---------- */
function canReadList(col, u) {
  if (col === 'jobs') return true;
  if (col === 'applications') return u.admin;
  const s = col.split('/');
  return s.length === 2 && s[0] === 'data' ? false : (s.length === 3 && s[0] === 'data' && s[1] === 'users' && !!u.uid && s[2] === u.uid);
}
function canReadDoc(col, id, u) {
  if (col === 'jobs') return true;
  if (col === 'applications') return u.admin || (!!u.uid && id === u.uid);
  return canReadList(col, u);
}
function validJob(d) {
  const str = (v, max) => typeof v === 'string' && v.length <= max;
  return d && str(d.title, 120) && str(d.company, 120) && str(d.country, 12) && str(d.countryName, 80) &&
         str(d.city, 80) && str(d.type, 30) && str(d.salary, 80) && str(d.description, 4000) && d.title.trim() && d.description.trim();
}
/* Returns an error string, or '' when allowed. `data` may be mutated (job ownership). */
function checkWrite(method, col, id, data, u) {
  const existing = (db[col] || {})[id];
  if (col === 'jobs') {
    if (!u.uid && !u.admin) return 'Missing visitor id';
    if (method === 'DELETE') return existing && (u.admin || existing.ownerId === u.uid) ? '' : 'Not allowed';
    if (!existing) {
      if (method !== 'PUT') return 'Not found';
      if (!validJob(data)) return 'Invalid job';
      data.ownerId = u.uid; data.status = 'open'; data.createdAt = Date.now();
      if (!u.admin) delete data.sample;
      return '';
    }
    if (!(u.admin || existing.ownerId === u.uid)) return 'Not allowed';
    delete data.ownerId; delete data.sample;
    if (method === 'PUT') return 'Use PATCH to change an existing job';
    if (data.status !== undefined && data.status !== 'open' && data.status !== 'closed') return 'Invalid status';
    return '';
  }
  if (col === 'applications') {
    if (!(u.admin || (u.uid && id === u.uid))) return 'Not allowed';
    return '';
  }
  const s = col.split('/');
  if (s.length === 3 && s[0] === 'data' && s[1] === 'users' && u.uid && s[2] === u.uid) return '';
  return 'Not allowed';
}

/* ---------- API ---------- */
const hits = new Map();
setInterval(() => hits.clear(), 60 * 1000).unref();

function api(req, res, url) {
  const ip = req.socket.remoteAddress || '';
  const n = (hits.get(ip) || 0) + 1; hits.set(ip, n);
  if (n > 600) return send(res, 429, 'Too many requests');

  const u = who(req);
  if (url.pathname === '/api/health') return send(res, 200, { ok: true });
  if (url.pathname === '/api/whoami') return send(res, 200, { admin: u.admin });

  const col = url.searchParams.get('col') || '';
  if (!COL_RE.test(col)) return send(res, 400, 'Bad collection');

  if (url.pathname === '/api/list' && req.method === 'GET') {
    if (!canReadList(col, u)) return send(res, 403, 'Not allowed');
    const m = db[col] || {};
    return send(res, 200, Object.keys(m).map((id) => ({ id, data: m[id] })));
  }

  if (url.pathname === '/api/doc') {
    const id = url.searchParams.get('id') || '';
    if (!ID_RE.test(id)) return send(res, 400, 'Bad id');
    if (req.method === 'GET') {
      if (!canReadDoc(col, id, u)) return send(res, 403, 'Not allowed');
      const d = (db[col] || {})[id];
      return send(res, 200, d ? { exists: true, data: d } : { exists: false });
    }
    if (['PUT', 'PATCH', 'DELETE'].indexOf(req.method) < 0) return send(res, 405, 'Method not allowed');
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      let data = {};
      if (req.method !== 'DELETE') {
        try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')).data; } catch (e) { return send(res, 400, 'Bad JSON'); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res, 400, 'Body must be {"data": {...}}');
      }
      const err = checkWrite(req.method, col, id, data, u);
      if (err) return send(res, err === 'Not found' ? 404 : err === 'Not allowed' ? 403 : 400, err);
      db[col] = db[col] || {};
      if (req.method === 'DELETE') delete db[col][id];
      else if (req.method === 'PUT') db[col][id] = data;
      else {
        if (!db[col][id]) return send(res, 404, 'Not found');
        db[col][id] = merge(db[col][id], data);
      }
      save();
      return send(res, 204);
    });
    return undefined;
  }
  return send(res, 404, 'Not found');
}

/* ---------- static files ---------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};
const BLOCKED = new Set(['server.js']);
const CSP = "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'";

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let p;
  try { p = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, 'Bad path'); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some((s) => s.startsWith('.')) ||
      BLOCKED.has(rel) || rel.split(path.sep)[0] === 'data') return send(res, 404, 'Not found');
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return send(res, 404, 'Not found');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    const h = { 'content-type': type, 'referrer-policy': 'strict-origin-when-cross-origin' };
    if (type.startsWith('text/html')) h['content-security-policy'] = CSP;
    send(res, 200, req.method === 'HEAD' ? '' : buf, h);
  });
  return undefined;
}

loadDb();
http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return api(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    return send(res, 500, 'Server error');
  }
}).listen(PORT, HOST, () => {
  console.log('Hire Via Global running at http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT);
  if (ADMIN_KEY === 'change-me') console.log('WARNING: ADMIN_KEY is the default "change-me". Set ADMIN_KEY before sharing this server.');
  console.log('Job data file: ' + DB_FILE);
});
