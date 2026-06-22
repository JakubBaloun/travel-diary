import { useMemo, useRef } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"
import {
  days,
  derivePinState,
  getCurrentDayNumber,
  getHubDays,
  getHubLabel,
  getPhase,
  type ItineraryDay,
  type PinState,
} from "@/data/itinerary"
import { MAP_VIEWBOX, STATE_PATHS } from "@/data/state-paths"
import { type DaySummary } from "@/lib/api"
import { useSvgPanZoom } from "./useSvgPanZoom"

interface Props {
  summaries: Map<number, DaySummary>
  onPinClick: (dayNumber: number) => void
  onHubClick: (hub: string) => void
}

// Warm watercolor wash per state — desaturated, slightly varied so the palette feels
// hand-painted rather than algorithmic.
const STATE_FILL: Record<string, string> = {
  "23": "oklch(0.93 0.04 80)",
  "33": "oklch(0.91 0.05 50)",
  "50": "oklch(0.93 0.05 140)",
  "25": "oklch(0.91 0.05 30)",
  "09": "oklch(0.92 0.04 220)",
  "44": "oklch(0.93 0.04 280)",
  "36": "oklch(0.92 0.05 100)",
  "34": "oklch(0.92 0.04 250)",
  "42": "oklch(0.92 0.04 350)",
  "24": "oklch(0.93 0.05 60)",
  "11": "oklch(0.88 0.06 350)",
  "51": "oklch(0.93 0.05 160)",
}

const INK = "oklch(0.32 0.06 50)"
const INK_SOFT = "oklch(0.42 0.05 50)"
const PAPER = "oklch(0.96 0.02 80)"
const OCEAN = "oklch(0.92 0.025 215)"

function buildPolyline(pts: ItineraryDay[]): string {
  if (pts.length < 2) return ""
  return "M " + pts.map((p) => `${p.mapX} ${p.mapY}`).join(" L ")
}

function aggregateHubState(
  hd: ItineraryDay[],
  summaries: Map<number, DaySummary>,
  now: Date,
): PinState {
  const states = hd.map((d) =>
    derivePinState(d, summaries.get(d.dayNumber)?.published ?? false, now),
  )
  if (states.includes("current")) return "current"
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

  const svgRef = useRef<SVGSVGElement>(null)
  const zoom = useSvgPanZoom({
    svgRef,
    base: { x: 0, y: 0, w: MAP_VIEWBOX.w, h: MAP_VIEWBOX.h },
    maxZoom: 8,
  })

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

  // Swallow pin click if the gesture was a pan rather than a tap.
  function handlePinClick(dayNumber: number) {
    if (zoom.didMove()) return
    onPinClick(dayNumber)
  }
  function handleHubClick(hub: string) {
    if (zoom.didMove()) return
    onHubClick(hub)
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={zoom.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full select-none rounded-2xl shadow-xl shadow-black/15 ring-1 ring-black/5"
        aria-label="Mapa cesty"
        style={{ backgroundColor: PAPER, touchAction: "none" }}
        {...zoom.handlers}
      >
        <defs>
          <filter id="ink-jitter" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="0.9" />
          </filter>
          <filter id="wash" x="-3%" y="-3%" width="106%" height="106%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
          <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="2" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.30   0 0 0 0 0.22   0 0 0 0 0.12   0 0 0 0.10 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <radialGradient id="paper-glow" cx="50%" cy="35%" r="80%">
            <stop offset="0%" stopColor={PAPER} stopOpacity="1" />
            <stop offset="100%" stopColor="oklch(0.91 0.03 70)" stopOpacity="1" />
          </radialGradient>
        </defs>

        <rect
          x={0}
          y={0}
          width={MAP_VIEWBOX.w}
          height={MAP_VIEWBOX.h}
          fill="url(#paper-glow)"
        />
        <rect
          x={0}
          y={0}
          width={MAP_VIEWBOX.w}
          height={MAP_VIEWBOX.h}
          fill={OCEAN}
          opacity="0.55"
        />
        <rect
          x={0}
          y={0}
          width={MAP_VIEWBOX.w}
          height={MAP_VIEWBOX.h}
          fill="black"
          opacity="0.04"
          filter="url(#paper-grain)"
        />

        <g filter="url(#wash)">
          {STATE_PATHS.map((s) => (
            <path
              key={`fill-${s.id}`}
              d={s.d}
              fill={STATE_FILL[s.id] ?? "oklch(0.92 0.02 80)"}
              opacity={0.85}
            />
          ))}
        </g>

        <g filter="url(#ink-jitter)" fill="none" strokeLinejoin="round" strokeLinecap="round">
          {STATE_PATHS.map((s) => (
            <path
              key={`stroke-${s.id}`}
              d={s.d}
              stroke={INK}
              strokeWidth={1.2}
              opacity={0.85}
            />
          ))}
        </g>

        <g style={{ fontFamily: '"Caveat Variable", cursive' }}>
          {STATE_PATHS.map((s) => (
            <text
              key={`label-${s.id}`}
              x={s.label_x}
              y={s.label_y}
              textAnchor="middle"
              fontSize={s.label === "D.C." || s.label === "R.I." ? 14 : 22}
              fontWeight={500}
              opacity={0.5}
              fill={INK}
              style={{ pointerEvents: "none" }}
            >
              {s.label}
            </text>
          ))}
        </g>

        {dashedPath && (
          <path
            d={dashedPath}
            fill="none"
            stroke={INK_SOFT}
            strokeWidth={1.5}
            strokeDasharray="4 5"
            strokeLinecap="round"
            opacity={0.55}
          />
        )}
        {solidPath && (
          <path
            d={solidPath}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.8}
          />
        )}

        {pins.map((pin) =>
          pin.kind === "hub" ? (
            <HubPin
              key={pin.day.hub}
              pin={pin}
              onClick={() => handleHubClick(pin.day.hub!)}
            />
          ) : (
            <SinglePin
              key={pin.day.dayNumber}
              pin={pin}
              onClick={() => handlePinClick(pin.day.dayNumber)}
            />
          ),
        )}
      </svg>

      {/* Zoom controls overlay */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 rounded-xl bg-surface/90 p-1 shadow-md ring-1 ring-surface-border backdrop-blur">
        <ZoomBtn label="Přiblížit" onClick={zoom.zoomIn}>
          <Plus className="size-4" />
        </ZoomBtn>
        <ZoomBtn label="Oddálit" onClick={zoom.zoomOut} disabled={!zoom.isZoomed}>
          <Minus className="size-4" />
        </ZoomBtn>
        <ZoomBtn label="Reset" onClick={zoom.reset} disabled={!zoom.isZoomed}>
          <RotateCcw className="size-4" />
        </ZoomBtn>
      </div>
    </div>
  )
}

function ZoomBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-lg text-foreground/80 hover:bg-muted hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function SinglePin({ pin, onClick }: { pin: RenderedPin; onClick: () => void }) {
  const { day, state, highlight } = pin
  const radius = highlight ? 11 : 9
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
          r={radius + 7}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={1.5}
          opacity={0.55}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        fill={isUpcoming ? PAPER : "var(--brand)"}
        stroke={INK}
        strokeWidth={1.2}
      />
      <text
        x={day.mapX}
        y={day.mapY + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={700}
        fill={isUpcoming ? INK : "var(--brand-foreground)"}
        style={{ pointerEvents: "none", fontFamily: '"Caveat Variable", cursive' }}
      >
        {day.dayNumber}
      </text>
    </g>
  )
}

function HubPin({ pin, onClick }: { pin: RenderedPin; onClick: () => void }) {
  const { day, hubDays = [], state, highlight } = pin
  const radius = highlight ? 20 : 17
  const isUpcoming = state === "upcoming"
  const label = getHubLabel(day.hub!)

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
          r={radius + 7}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={1.5}
          opacity={0.55}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        fill={isUpcoming ? PAPER : "var(--brand)"}
        stroke={INK}
        strokeWidth={1.3}
      />
      <text
        x={day.mapX}
        y={day.mapY + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={700}
        fill={isUpcoming ? INK : "var(--brand-foreground)"}
        style={{ pointerEvents: "none", fontFamily: '"Caveat Variable", cursive' }}
      >
        {label}
      </text>
    </g>
  )
}

export default UsaMap
