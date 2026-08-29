/**
 * Rawabit v2 — GeoJSON → SVG Path Data Converter
 * Converts Algeria's wilaya boundaries from GeoJSON to optimized
 * SVG path data, exported as an ES module.
 *
 * Usage: node scripts/geojson-to-svg.js
 * Input:  ../../app/assets/wilayas-Bv3Ezlc4.geojson
 * Output: ../js/components/map-paths.js
 */

const fs = require('fs');
const path = require('path');

const INPUT  = path.resolve(__dirname, '../../app/assets/wilayas-Bv3Ezlc4.geojson');
const OUTPUT = path.resolve(__dirname, '../js/components/map-paths.js');

const geo = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
console.log(`Processing ${geo.features.length} wilaya features...`);

/* ── Helpers ── */
const r2 = n => +(n.toFixed(2));

let gMinX = Infinity, gMaxX = -Infinity;
let gMinY = Infinity, gMaxY = -Infinity;

function trackBounds(x, y) {
  if (x < gMinX) gMinX = x;  if (x > gMaxX) gMaxX = x;
  if (y < gMinY) gMinY = y;  if (y > gMaxY) gMaxY = y;
}

/** Convert a coordinate ring to SVG path segment */
function ringToSVG(ring) {
  return ring.map(([lng, lat], i) => {
    const x = r2(lng);
    const y = r2(-lat);          // flip Y for SVG coordinate system
    trackBounds(x, y);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join('') + 'Z';
}

/** Convert MultiPolygon → full SVG path `d` attribute */
function geometryToPath(coords) {
  return coords.flatMap(polygon =>
    polygon.map(ring => ringToSVG(ring))
  ).join('');
}

/** Centroid from exterior rings */
function getCentroid(coords) {
  let sx = 0, sy = 0, n = 0;
  for (const polygon of coords)
    for (const [lng, lat] of polygon[0]) { sx += lng; sy += -lat; n++; }
  return { cx: r2(sx / n), cy: r2(sy / n) };
}

/** Bounding box dimensions */
function getBBox(coords) {
  let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
  for (const polygon of coords)
    for (const [lng, lat] of polygon[0]) {
      const x = lng, y = -lat;
      if (x < x1) x1 = x;  if (x > x2) x2 = x;
      if (y < y1) y1 = y;  if (y > y2) y2 = y;
    }
  return { w: r2(x2 - x1), h: r2(y2 - y1) };
}

/* ── Process Features ── */
const wilayas = geo.features.map(f => {
  const p = f.properties;
  const c = f.geometry.coordinates;
  const d = geometryToPath(c);
  const { cx, cy } = getCentroid(c);
  const { w, h } = getBBox(c);
  const area = r2(w * h);
  const labelSize = r2(Math.max(0.18, Math.min(1.0, Math.sqrt(w * h) * 0.15)));

  return { code: p.code || '', name: p.name || p.NAME_1 || '', nameAr: p.nameAr || '', d, cx, cy, labelSize, area };
});

/* ── ViewBox ── */
const pad = 0.5;
const viewBox = [r2(gMinX - pad), r2(gMinY - pad), r2(gMaxX - gMinX + pad * 2), r2(gMaxY - gMinY + pad * 2)].join(' ');

/* ── Generate ES Module ── */
let js = `// Auto-generated from wilayas GeoJSON — do not edit manually\n`;
js += `export const MAP_VIEWBOX = '${viewBox}';\n\n`;
js += `export const WILAYAS = [\n`;
wilayas.forEach((w, i) => { js += `  ${JSON.stringify(w)}${i < wilayas.length - 1 ? ',' : ''}\n`; });
js += `];\n`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, js, 'utf8');

const kb = (Buffer.byteLength(js) / 1024).toFixed(1);
console.log(`Done: ${wilayas.length} wilayas -> ${kb} KB`);
console.log(`ViewBox: ${viewBox}`);
console.log(`Output:  ${OUTPUT}`);
