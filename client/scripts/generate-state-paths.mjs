// One-shot generator: reads us-atlas TopoJSON, projects the continental USA
// with d3.geoAlbersUsa-style Albers, and writes client/src/data/state-paths.ts
// (no runtime deps). The 12 NE / Mid-Atlantic states are emitted with their
// own paths + bbox + label anchor (for highlighting); the remaining continental
// states are merged into a single USA_BG_PATH (single muted backdrop fill so
// the highlighted cluster pops). Re-run:
//   node scripts/generate-state-paths.mjs
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { feature, merge } from "topojson-client"
import { geoAlbers, geoPath } from "d3-geo"
import topo from "us-atlas/states-10m.json" with { type: "json" }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, "../src/data/state-paths.ts")

// NE / Mid-Atlantic states (highlighted on the trip map).
const NE_STATES = {
  "23": { name: "Maine",         label: "MAINE" },
  "33": { name: "New Hampshire", label: "N.H." },
  "50": { name: "Vermont",       label: "VERMONT" },
  "25": { name: "Massachusetts", label: "MASS." },
  "09": { name: "Connecticut",   label: "CONN." },
  "44": { name: "Rhode Island",  label: "R.I." },
  "36": { name: "New York",      label: "NEW YORK" },
  "34": { name: "New Jersey",    label: "N.J." },
  "42": { name: "Pennsylvania",  label: "PENN." },
  "10": { name: "Delaware",      label: "DEL." },
  "24": { name: "Maryland",      label: "MARYLAND" },
  "11": { name: "District of Columbia", label: "D.C." },
  "51": { name: "Virginia",      label: "VIRGINIA" },
}

// Exclude Alaska + Hawaii + territories to keep the projection focused on the
// continental USA (otherwise Alaska's extent dominates the fit).
const EXCLUDE = new Set(["02", "15", "60", "66", "69", "72", "78"])

// Continental USA in Albers is roughly 1.8:1 wide:tall. The viewBox preserves
// that aspect; the trip cluster occupies the NE corner.
const VIEW_W = 1100
const VIEW_H = 620
const PADDING = 20

const states = feature(topo, topo.objects.states)
const continental = states.features.filter((f) => !EXCLUDE.has(f.id))

// Albers conic projection — standard for continental US thematic maps.
const projection = geoAlbers().fitExtent(
  [[PADDING, PADDING], [VIEW_W - PADDING, VIEW_H - PADDING]],
  { type: "FeatureCollection", features: continental },
)
const toPath = geoPath(projection)

// NE / highlighted state paths (full metadata).
const neFeatures = continental.filter((f) => NE_STATES[f.id])
const neRows = neFeatures.map((f) => {
  const meta = NE_STATES[f.id]
  const d = toPath(f)
  const [[x0, y0], [x1, y1]] = toPath.bounds(f)
  const [cx, cy] = toPath.centroid(f)
  return {
    id: f.id,
    name: meta.name,
    label: meta.label,
    d,
    bbox: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
    label_x: cx,
    label_y: cy,
  }
})

// Background = all continental states merged into one shape (no internal
// borders → just the continental silhouette). Rendered as a uniform muted fill
// behind the NE highlights.
const bgGeometries = topo.objects.states.geometries.filter(
  (g) => !EXCLUDE.has(g.id) && !NE_STATES[g.id],
)
const bgFeature = merge(topo, bgGeometries)
const bgPath = toPath(bgFeature)

// Also project a few city anchors so itinerary.json can be aligned.
const cityCoords = [
  { name: "Boston",     lng: -71.0589, lat: 42.3601 },
  { name: "Burlington", lng: -73.2121, lat: 44.4759 },
  { name: "Portland",   lng: -70.2553, lat: 43.6591 },
  { name: "New York",   lng: -74.0060, lat: 40.7128 },
  { name: "Washington", lng: -77.0369, lat: 38.9072 },
  { name: "Mt. Washington",  lng: -71.3033, lat: 44.2705 },
  { name: "New Haven",  lng: -72.9279, lat: 41.3083 },
]
const cities = cityCoords.map((c) => {
  const [x, y] = projection([c.lng, c.lat])
  return { ...c, x: Math.round(x), y: Math.round(y) }
})

const itineraryHints = {
  // dayNumber → { x, y } reference for itinerary.json mapX/mapY.
  1:  cityFor("Boston"),
  2:  cityFor("Boston"),
  3:  cityFor("Burlington"),
  4:  cityFor("Mt. Washington"),
  5:  cityFor("Portland"),
  6:  cityFor("New Haven"),
  7:  cityFor("New York"),
  8:  cityFor("New York"),
  9:  cityFor("New York"),
  10: cityFor("New York"),
  11: cityFor("New York"),
  12: cityFor("Washington"),
  13: cityFor("New York"),
  14: cityFor("New York"),
  15: cityFor("New York"),
}
function cityFor(name) {
  const c = cities.find((x) => x.name === name)
  return c ? { x: c.x, y: c.y } : null
}

// Bounding box of all NE features in projected coords — useful in the
// component to crop the visible viewBox tightly around the trip area.
const neBounds = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const f of neFeatures) {
    const [[ax, ay], [bx, by]] = toPath.bounds(f)
    if (ax < x0) x0 = ax
    if (ay < y0) y0 = ay
    if (bx > x1) x1 = bx
    if (by > y1) y1 = by
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
})()

const banner = `// Generated by scripts/generate-state-paths.mjs — DO NOT EDIT BY HAND.\n// Re-run: node scripts/generate-state-paths.mjs\n`
const content =
  banner +
  `export const MAP_VIEWBOX = { w: ${VIEW_W}, h: ${VIEW_H} } as const\n\n` +
  `/** Bounding box of the NE / highlighted cluster in projected coords. */\n` +
  `export const NE_BOUNDS = ${JSON.stringify(
    {
      x: +neBounds.x.toFixed(2),
      y: +neBounds.y.toFixed(2),
      w: +neBounds.w.toFixed(2),
      h: +neBounds.h.toFixed(2),
    },
    null,
    2,
  )} as const\n\n` +
  `export interface StatePath {\n` +
  `  id: string\n` +
  `  name: string\n` +
  `  label: string\n` +
  `  d: string\n` +
  `  bbox: { x: number; y: number; w: number; h: number }\n` +
  `  label_x: number\n` +
  `  label_y: number\n` +
  `}\n\n` +
  `export const STATE_PATHS: StatePath[] = ${JSON.stringify(neRows, null, 2)} as const\n\n` +
  `/** All non-NE continental states merged into one path — rendered as a\n` +
  ` *  uniform muted fill behind the highlighted NE cluster. */\n` +
  `export const USA_BG_PATH = ${JSON.stringify(bgPath)}\n\n` +
  `export interface ProjectedCity { name: string; x: number; y: number }\n\n` +
  `export const PROJECTED_CITIES: ProjectedCity[] = ${JSON.stringify(
    cities.map(({ name, x, y }) => ({ name, x, y })),
    null,
    2,
  )}\n\n` +
  `/** Reference projected coords for each itinerary day — use to set itinerary.json mapX/mapY. */\n` +
  `export const DAY_HINTS: Record<number, { x: number; y: number } | null> = ${JSON.stringify(
    itineraryHints,
    null,
    2,
  )}\n`

fs.writeFileSync(OUT, content, "utf8")
console.log(`Wrote ${OUT}`)
console.log(`Highlighted states: ${neRows.length}`)
console.log(`NE bounds in viewBox: x=${neBounds.x.toFixed(1)} y=${neBounds.y.toFixed(1)} w=${neBounds.w.toFixed(1)} h=${neBounds.h.toFixed(1)}`)
console.log(`Cities: ${cities.length}`)
console.log(`\nProjected city anchors (paste into itinerary.json as mapX/mapY):`)
for (const c of cities) console.log(`  ${c.name}: (${c.x}, ${c.y})`)
