// One-shot generator: reads Natural Earth 10m Admin 1 (states/provinces),
// projects USA + Canada + Mexico with the SAME Albers projection, and writes
// client/src/data/state-paths.ts.
//
// Single source = perfectly aligned US-CA-MX borders (no gap between shapes).
//
// On first run, fetches the ~63 MB NE GeoJSON and filters down to USA + CAN +
// MEX (~8 MB). The filtered subset is committed at scripts/data/ne_10m_na.json
// so subsequent runs (and other developers) skip the download.
//
// Re-run: node scripts/generate-state-paths.mjs

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { geoAlbers, geoPath } from "d3-geo"
import { topology } from "topojson-server"
import { merge as topoMerge } from "topojson-client"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, "../src/data/state-paths.ts")
const CACHE_FILE = path.resolve(__dirname, "cache/ne_10m_admin_1.json")
const SUBSET_FILE = path.resolve(__dirname, "data/ne_10m_na.json")
const NE_URL =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/cultural/ne_10m_admin_1_states_provinces.json"

const NA_COUNTRIES = new Set(["USA", "CAN", "MEX"])

async function loadNorthAmerica() {
  if (fs.existsSync(SUBSET_FILE)) {
    return JSON.parse(fs.readFileSync(SUBSET_FILE, "utf8"))
  }
  let raw
  if (fs.existsSync(CACHE_FILE)) {
    console.log(`Reading cached NE Admin 1 from ${CACHE_FILE}`)
    raw = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"))
  } else {
    console.log(`Downloading NE 10m Admin 1 (~63 MB) from ${NE_URL}`)
    const res = await fetch(NE_URL)
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
    const text = await res.text()
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
    fs.writeFileSync(CACHE_FILE, text, "utf8")
    raw = JSON.parse(text)
  }
  const subset = {
    type: "FeatureCollection",
    features: raw.features.filter((f) => NA_COUNTRIES.has(f.properties.adm0_a3)),
  }
  fs.mkdirSync(path.dirname(SUBSET_FILE), { recursive: true })
  fs.writeFileSync(SUBSET_FILE, JSON.stringify(subset), "utf8")
  console.log(
    `Wrote filtered subset (${subset.features.length} features) to ${SUBSET_FILE}`,
  )
  return subset
}

// NE / Mid-Atlantic states (highlighted on the trip map). Keyed by FIPS (last
// 2 digits of NE's `fips` like "US23"), keeping the same IDs as before so
// nothing downstream needs to change.
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

// Exclude non-continental US (Alaska, Hawaii) and Mexico's offshore territories
// from the projection fit so the cluster doesn't get squished.
const EXCLUDE_US_ISO = new Set(["US-AK", "US-HI"])

const VIEW_W = 1100
const VIEW_H = 620
const PADDING = 20

const collection = await loadNorthAmerica()

function fipsOf(props) {
  const f = props.fips
  if (typeof f === "string" && f.startsWith("US") && f.length >= 4) {
    return f.slice(2).padStart(2, "0")
  }
  return null
}

function isContinentalUS(f) {
  return f.properties.adm0_a3 === "USA" && !EXCLUDE_US_ISO.has(f.properties.iso_3166_2)
}

const continentalUS = collection.features.filter(isContinentalUS)
const allCanada = collection.features.filter((f) => f.properties.adm0_a3 === "CAN")
const allMexico = collection.features.filter((f) => f.properties.adm0_a3 === "MEX")

// Albers conic projection — fit to continental USA so the trip cluster
// occupies the NE corner of the viewBox like before.
const projection = geoAlbers().fitExtent(
  [[PADDING, PADDING], [VIEW_W - PADDING, VIEW_H - PADDING]],
  { type: "FeatureCollection", features: continentalUS },
)
const toPath = geoPath(projection)

// Trip viewport (matches `VIEW` in UsaMap.tsx). We drop neighbour provinces /
// states whose bounding box can't be reached at any zoom — keeps the bundle
// small without losing anything the user will ever see.
const TRIP_VIEW = { x: 692, y: -35, w: 400, h: 460 }
function intersectsTripView(f) {
  const [[x0, y0], [x1, y1]] = toPath.bounds(f)
  return (
    x1 > TRIP_VIEW.x &&
    x0 < TRIP_VIEW.x + TRIP_VIEW.w &&
    y1 > TRIP_VIEW.y &&
    y0 < TRIP_VIEW.y + TRIP_VIEW.h
  )
}
const canadaFeatures = allCanada.filter(intersectsTripView)
const mexicoFeatures = allMexico.filter(intersectsTripView)

// NE / highlighted state paths (full metadata).
const neRows = continentalUS
  .map((f) => ({ f, fips: fipsOf(f.properties) }))
  .filter(({ fips }) => fips && NE_STATES[fips])
  .map(({ f, fips }) => {
    const meta = NE_STATES[fips]
    const d = toPath(f)
    const [[x0, y0], [x1, y1]] = toPath.bounds(f)
    const [cx, cy] = toPath.centroid(f)
    return {
      id: fips,
      name: meta.name,
      label: meta.label,
      d,
      bbox: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
      label_x: cx,
      label_y: cy,
    }
  })

// Merge a list of GeoJSON features (Polygon/MultiPolygon) into a single
// MultiPolygon for one combined projected path. We render the result as a
// solid fill with no internal borders — the visible borders for NE states
// come from STATE_PATHS, and Canada / Mexico are rendered as a single shape.
// Snap input coordinates to a fixed grid so adjacent polygons share *exactly*
// the same boundary vertices. Natural Earth GeoJSON stores each feature
// independently, so shared borders often differ by sub-pixel amounts — without
// snapping, topojson can't detect them as shared arcs and the "merge" produces
// every input polygon back unchanged.
function snapCoords(features, decimals = 4) {
  const f = Math.pow(10, decimals)
  const round = ([x, y]) => [Math.round(x * f) / f, Math.round(y * f) / f]
  function walk(c) {
    return typeof c[0] === "number" ? round(c) : c.map(walk)
  }
  return features.map((feat) => ({
    ...feat,
    geometry: { ...feat.geometry, coordinates: walk(feat.geometry.coordinates) },
  }))
}

// True polygon union via TopoJSON shared arcs — collapses the borders between
// adjacent input polygons so the merged outline has no internal seams.
function mergePath(features) {
  if (features.length === 0) return ""
  const snapped = snapCoords(features)
  const topo = topology({ collection: { type: "FeatureCollection", features: snapped } })
  const merged = topoMerge(topo, topo.objects.collection.geometries)
  return toPath({ type: "Feature", geometry: merged, properties: {} }) ?? ""
}

const bgPath = mergePath(
  continentalUS.filter((f) => {
    const fips = fipsOf(f.properties)
    return !fips || !NE_STATES[fips]
  }),
)
// Full continental USA outline — rendered with a thicker stroke so the country
// border (incl. US-CA, US-MX, coastlines) reads as the visual frame around the
// state cluster.
const usaOutlinePath = mergePath(continentalUS)
const canadaPath = mergePath(canadaFeatures)
const mexicoPath = mergePath(mexicoFeatures)

// Project a few city anchors so itinerary.json can be aligned.
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

function cityFor(name) {
  const c = cities.find((x) => x.name === name)
  return c ? { x: c.x, y: c.y } : null
}

const itineraryHints = {
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

const neBounds = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const r of neRows) {
    const { x, y, w, h } = r.bbox
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x + w > x1) x1 = x + w
    if (y + h > y1) y1 = y + h
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
  `/** Full continental USA outline — for the thicker country-border stroke. */\n` +
  `export const USA_OUTLINE_PATH = ${JSON.stringify(usaOutlinePath)}\n\n` +
  `/** Canada — all provinces merged into a single silhouette (no inter-province borders). */\n` +
  `export const CANADA_PATH = ${JSON.stringify(canadaPath)}\n\n` +
  `/** Mexico — all states merged, projected in the same Albers system. */\n` +
  `export const MEXICO_PATH = ${JSON.stringify(mexicoPath)}\n\n` +
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
console.log(`Canada provinces merged: ${canadaFeatures.length}`)
console.log(`Mexico states merged: ${mexicoFeatures.length}`)
console.log(`NE bounds: x=${neBounds.x.toFixed(1)} y=${neBounds.y.toFixed(1)} w=${neBounds.w.toFixed(1)} h=${neBounds.h.toFixed(1)}`)
console.log(`\nProjected city anchors (paste into itinerary.json as mapX/mapY):`)
for (const c of cities) console.log(`  ${c.name}: (${c.x}, ${c.y})`)
