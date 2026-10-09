/* Builds window.HVG_WORLD (country shapes) from the world topology bundled in
   datamaps (loaded from cdnjs before this file, with d3 v3 and topojson v1).
   If any part is missing, HVG_WORLD.ok stays false and callers fall back. */
(function () {
  'use strict';
  var out = { features: [], byId: {}, ok: false };

  function ringArea(r) {
    var a = 0;
    for (var i = 0, n = r.length; i < n; i++) {
      var p = r[i], q = r[(i + 1) % n];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return a / 2;
  }
  function centroid(polys, bbox) {
    var best = null, bestA = 0;
    polys.forEach(function (p) { var a = Math.abs(ringArea(p[0])); if (a > bestA) { bestA = a; best = p[0]; } });
    if (!best || bestA < 1e-9) return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    var cx = 0, cy = 0, a2 = 0;
    for (var i = 0, n = best.length; i < n; i++) {
      var p = best[i], q = best[(i + 1) % n], f = p[0] * q[1] - q[0] * p[1];
      cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; a2 += f;
    }
    if (Math.abs(a2) < 1e-9) return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    return [cx / (3 * a2), cy / (3 * a2)];
  }

  try {
    var topo = window.Datamap && window.Datamap.prototype && window.Datamap.prototype.worldTopo;
    if (topo && window.topojson && topo.objects) {
      var key = Object.keys(topo.objects)[0];
      var fc = window.topojson.feature(topo, topo.objects[key]);
      fc.features.forEach(function (f) {
        var g = f.geometry;
        if (!g) return;
        var polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        if (!polys.length) return;
        var name = (f.properties && f.properties.name) || String(f.id || '');
        if (!name) return;
        var id = (f.id && String(f.id) !== '-99') ? String(f.id) : 'X' + name.replace(/[^A-Za-z0-9]/g, '');
        var bbox = [180, 90, -180, -90];
        polys.forEach(function (p) {
          p[0].forEach(function (c) {
            if (c[0] < bbox[0]) bbox[0] = c[0]; if (c[1] < bbox[1]) bbox[1] = c[1];
            if (c[0] > bbox[2]) bbox[2] = c[0]; if (c[1] > bbox[3]) bbox[3] = c[1];
          });
        });
        var item = { id: id, name: name, polys: polys, bbox: bbox, centroid: centroid(polys, bbox) };
        out.features.push(item);
        out.byId[id] = item;
      });
      out.ok = out.features.length > 50;
    }
  } catch (e) { out.ok = false; }

  out.sorted = out.features.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });

  /* Point-in-polygon lookup (lon, lat) -> feature or null. */
  function inRing(ring, x, y) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  out.find = function (lon, lat) {
    for (var i = 0; i < out.features.length; i++) {
      var f = out.features[i], b = f.bbox;
      if (lat < b[1] || lat > b[3]) continue;
      if (b[2] - b[0] <= 180 && (lon < b[0] || lon > b[2])) continue;
      for (var k = 0; k < f.polys.length; k++) {
        var p = f.polys[k];
        if (inRing(p[0], lon, lat)) {
          var hole = false;
          for (var h = 1; h < p.length; h++) if (inRing(p[h], lon, lat)) { hole = true; break; }
          if (!hole) return f;
        }
      }
    }
    return null;
  };

  window.HVG_WORLD = out;
})();
