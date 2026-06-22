import { useMemo } from "react"
import {
  cities,
  days,
  derivePinState,
  getCurrentDayNumber,
  getHubDays,
  getPhase,
  type ItineraryDay,
  type PinState,
} from "@/data/itinerary"
import { type DaySummary } from "@/lib/api"

interface Props {
  summaries: Map<number, DaySummary>
  onPinClick: (dayNumber: number) => void
  onHubClick: (hub: string) => void
}

// Subtle background state labels. Coordinates are approximate centers in the viewBox.
const STATE_LABELS: { name: string; x: number; y: number }[] = [
  { name: "MAINE",    x: 880, y: 130 },
  { name: "VERMONT",  x: 530, y:  95 },
  { name: "N.H.",     x: 700, y: 115 },
  { name: "MASS.",    x: 670, y: 290 },
  { name: "CONN.",    x: 600, y: 355 },
  { name: "NEW YORK", x: 430, y: 250 },
  { name: "N.J.",     x: 470, y: 440 },
  { name: "PENN.",    x: 320, y: 380 },
  { name: "MARYLAND", x: 230, y: 490 },
  { name: "VIRGINIA", x: 180, y: 560 },
]

// Stylised Atlantic coast curve — decorative, not geographic.
const COAST_PATH =
  "M 940 60 C 920 140 880 200 870 240 C 860 270 840 285 830 305 C 805 345 770 370 745 405 C 700 445 640 460 600 495 C 560 525 500 545 470 580 L 460 600"

function buildPolyline(pts: ItineraryDay[]): string {
  if (pts.length < 2) return ""
  return "M " + pts.map((p) => `${p.mapX} ${p.mapY}`).join(" L ")
}

function aggregateHubState(hubDays: ItineraryDay[], summaries: Map<number, DaySummary>, now: Date): PinState {
  const states = hubDays.map((d) =>
    derivePinState(d, summaries.get(d.dayNumber)?.published ?? false, now),
  )
  if (states.includes("current")) return "current"
  // partial done = treat as current (trip is in progress through this hub)
  if (states.includes("done") && states.includes("upcoming")) return "current"
  if (states.every((s) => s === "done")) return "done"
  return "upcoming"
}

interface RenderedPin {
  kind: "single" | "hub"
  day: ItineraryDay
  hubDays?: ItineraryDay[]
  state: PinState
  highlight: boolean
}

function UsaMap({ summaries, onPinClick, onHubClick }: Props) {
  const now = useMemo(() => new Date(), [])
  const phase = getPhase(now)
  const currentN = getCurrentDayNumber(now)

  const pins: RenderedPin[] = useMemo(() => {
    const seen = new Set<string>()
    const out: RenderedPin[] = []
    for (const d of days) {
      if (d.hub) {
        if (seen.has(d.hub)) continue
        seen.add(d.hub)
        const hd = getHubDays(d.hub)
        out.push({
          kind: "hub",
          day: d,
          hubDays: hd,
          state: aggregateHubState(hd, summaries, now),
          highlight: hd.some((x) => summaries.get(x.dayNumber)?.highlight),
        })
      } else {
        const s = summaries.get(d.dayNumber)
        out.push({
          kind: "single",
          day: d,
          state: derivePinState(d, s?.published ?? false, now),
          highlight: s?.highlight ?? false,
        })
      }
    }
    return out
  }, [summaries, now])

  // Trail: split at the current day (or last day if trip is over).
  const splitIdx = useMemo(() => {
    if (phase === "before") return 0
    if (phase === "after") return days.length - 1
    if (currentN == null) return 0
    return days.findIndex((d) => d.dayNumber === currentN)
  }, [phase, currentN])

  const solidPath = useMemo(() => buildPolyline(days.slice(0, splitIdx + 1)), [splitIdx])
  const dashedPath = useMemo(
    () => buildPolyline(days.slice(Math.max(0, splitIdx))),
    [splitIdx],
  )

  return (
    <svg
      viewBox="0 0 1000 600"
      xmlns="http://www.w3.org/2000/svg"
      className="block w-full h-auto rounded-2xl border border-surface-border bg-surface text-foreground"
      aria-label="Mapa cesty USA"
    >
      {/* state labels in background */}
      {STATE_LABELS.map((s) => (
        <text
          key={s.name}
          x={s.x}
          y={s.y}
          textAnchor="middle"
          style={{ fill: "var(--muted-foreground)" }}
          fontSize={11}
          fontWeight={500}
          letterSpacing={1.5}
          opacity={0.35}
        >
          {s.name}
        </text>
      ))}

      {/* decorative Atlantic coast */}
      <path
        d={COAST_PATH}
        fill="none"
        style={{ stroke: "var(--muted-foreground)" }}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.25}
        strokeDasharray="3 6"
      />

      {/* city labels */}
      {cities.map((c) => (
        <g key={c.name}>
          <circle
            cx={c.mapX}
            cy={c.mapY}
            r={2.5}
            style={{ fill: "var(--muted-foreground)" }}
            opacity={0.55}
          />
          <text
            x={c.mapX + 7}
            y={c.mapY + 4}
            style={{ fill: "var(--muted-foreground)" }}
            fontSize={11}
            opacity={0.75}
          >
            {c.name}
          </text>
        </g>
      ))}

      {/* trail */}
      {dashedPath && (
        <path
          d={dashedPath}
          fill="none"
          style={{ stroke: "var(--muted-foreground)" }}
          strokeWidth={2}
          strokeDasharray="6 6"
          strokeLinecap="round"
          opacity={0.45}
        />
      )}
      {solidPath && (
        <path
          d={solidPath}
          fill="none"
          style={{ stroke: "var(--brand)" }}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.7}
        />
      )}

      {/* pins */}
      {pins.map((pin) =>
        pin.kind === "hub" ? (
          <HubPin
            key={pin.day.hub}
            pin={pin}
            onClick={() => onHubClick(pin.day.hub!)}
          />
        ) : (
          <SinglePin
            key={pin.day.dayNumber}
            pin={pin}
            onClick={() => onPinClick(pin.day.dayNumber)}
          />
        ),
      )}
    </svg>
  )
}

function SinglePin({ pin, onClick }: { pin: RenderedPin; onClick: () => void }) {
  const { day, state, highlight } = pin
  const radius = highlight ? 14 : 11
  const isUpcoming = state === "upcoming"

  return (
    <g
      onClick={onClick}
      style={{ cursor: isUpcoming ? "default" : "pointer" }}
      aria-label={`Den ${day.dayNumber} — ${day.place}`}
    >
      {state === "current" && (
        <circle
          cx={day.mapX}
          cy={day.mapY}
          r={radius + 8}
          fill="none"
          style={{ stroke: "var(--brand)" }}
          strokeWidth={2}
          opacity={0.55}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        style={{
          fill: isUpcoming ? "var(--muted)" : "var(--brand)",
          stroke: "var(--surface-border)",
        }}
        fillOpacity={isUpcoming ? 0.55 : 1}
        strokeWidth={1.5}
      />
      <text
        x={day.mapX}
        y={day.mapY + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
        style={{
          fill: isUpcoming ? "var(--muted-foreground)" : "var(--brand-foreground)",
        }}
      >
        {day.dayNumber}
      </text>
    </g>
  )
}

function HubPin({ pin, onClick }: { pin: RenderedPin; onClick: () => void }) {
  const { day, hubDays = [], state, highlight } = pin
  const radius = highlight ? 26 : 22
  const isUpcoming = state === "upcoming"

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      aria-label={`${day.place} — ${hubDays.length} dní`}
    >
      {state === "current" && (
        <circle
          cx={day.mapX}
          cy={day.mapY}
          r={radius + 8}
          fill="none"
          style={{ stroke: "var(--brand)" }}
          strokeWidth={2}
          opacity={0.55}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        style={{
          fill: isUpcoming ? "var(--muted)" : "var(--brand)",
          stroke: "var(--surface-border)",
        }}
        fillOpacity={isUpcoming ? 0.55 : 1}
        strokeWidth={1.5}
      />
      <text
        x={day.mapX}
        y={day.mapY + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        style={{
          fill: isUpcoming ? "var(--muted-foreground)" : "var(--brand-foreground)",
        }}
      >
        NYC
      </text>
      {/* day-count badge */}
      <g transform={`translate(${day.mapX + radius - 4} ${day.mapY - radius + 4})`}>
        <circle
          r={10}
          style={{ fill: "var(--badge)", stroke: "var(--surface)" }}
          strokeWidth={1.5}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={700}
          style={{ fill: "var(--badge-foreground)" }}
        >
          {hubDays.length}
        </text>
      </g>
    </g>
  )
}

export default UsaMap
