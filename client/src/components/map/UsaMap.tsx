import { useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  days,
  derivePinState,
  getHubDays,
  getHubLabel,
  type ItineraryDay,
  type PinState,
} from "@/data/itinerary";
import {
  CANADA_PATH,
  MEXICO_PATH,
  STATE_PATHS,
  USA_OUTLINE_PATH,
} from "@/data/state-paths";
import { type DaySummary } from "@/lib/api";
import { useSvgPanZoom } from "./useSvgPanZoom";

interface Props {
  summaries: Map<number, DaySummary>;
  onPinClick: (dayNumber: number) => void;
  onHubClick: (hub: string) => void;
}

const VIEW = { x: 692, y: -35, w: 400, h: 460 } as const;

function aggregateHubState(
  hd: ItineraryDay[],
  summaries: Map<number, DaySummary>,
  now: Date,
): PinState {
  const states = hd.map((d) =>
    derivePinState(d, summaries.get(d.dayNumber)?.published ?? false, now),
  );
  if (states.includes("current")) return "current";
  if (states.includes("done") && states.includes("upcoming")) return "current";
  if (states.every((s) => s === "done")) return "done";
  return "upcoming";
}

interface RenderedPin {
  kind: "single" | "hub";
  day: ItineraryDay;
  hubDays?: ItineraryDay[];
  state: PinState;
  highlight: boolean;
}

// Wavy bezier between two consecutive pins. Deterministic jitter so the wave
// shape is stable across renders.
function buildSmoothSegment(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  seed: number,
): string {
  if (p1.x === p2.x && p1.y === p2.y) return "";

  function jitter(i: number, k: number): number {
    const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  const SUBDIVISIONS = 4;
  const AMPLITUDE = 0.06;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);

  if (len < 20) {
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }

  const expanded: { x: number; y: number }[] = [p1];
  const nx = -dy / len;
  const ny = dx / len;

  for (let k = 1; k <= SUBDIVISIONS; k++) {
    const t = k / (SUBDIVISIONS + 1);
    const sign = k % 2 === 0 ? 1 : -1;
    const mag = 0.5 + jitter(seed, k) * 0.5;
    const offset = AMPLITUDE * len * sign * mag;
    expanded.push({
      x: p1.x + dx * t + nx * offset,
      y: p1.y + dy * t + ny * offset,
    });
  }
  expanded.push(p2);

  const tension = 0.7;
  let d = `M ${expanded[0].x} ${expanded[0].y}`;
  for (let i = 0; i < expanded.length - 1; i++) {
    const p0 = expanded[i - 1] ?? expanded[i];
    const pt1 = expanded[i];
    const pt2 = expanded[i + 1];
    const p3 = expanded[i + 2] ?? pt2;
    const c1x = pt1.x + ((pt2.x - p0.x) * tension) / 3;
    const c1y = pt1.y + ((pt2.y - p0.y) * tension) / 3;
    const c2x = pt2.x - ((p3.x - pt1.x) * tension) / 3;
    const c2y = pt2.y - ((p3.y - pt1.y) * tension) / 3;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${pt2.x.toFixed(1)} ${pt2.y.toFixed(1)}`;
  }
  return d;
}

function UsaMap({ summaries, onPinClick, onHubClick }: Props) {
  const now = useMemo(() => new Date(), []);

  const svgRef = useRef<SVGSVGElement>(null);
  const zoom = useSvgPanZoom({
    svgRef,
    base: { x: VIEW.x, y: VIEW.y, w: VIEW.w, h: VIEW.h },
    maxZoom: 8,
    initialZoom: 1.5,
  });

  const publishedDays = useMemo(
    () => days.filter((d) => summaries.get(d.dayNumber)?.published),
    [summaries],
  );

  const { pins, segments } = useMemo(() => {
    const seenHubs = new Set<string>();
    const pinsOut: RenderedPin[] = [];
    const points: { x: number; y: number }[] = [];

    for (const d of publishedDays) {
      if (d.hub) {
        if (seenHubs.has(d.hub)) continue;
        seenHubs.add(d.hub);
        const hd = getHubDays(d.hub);
        pinsOut.push({
          kind: "hub",
          day: d,
          hubDays: hd,
          state: aggregateHubState(hd, summaries, now),
          highlight: hd.some((x) => summaries.get(x.dayNumber)?.highlight),
        });
        points.push({ x: d.mapX, y: d.mapY });
      } else {
        const s = summaries.get(d.dayNumber);
        pinsOut.push({
          kind: "single",
          day: d,
          state: derivePinState(d, s?.published ?? false, now),
          highlight: s?.highlight ?? false,
        });
        points.push({ x: d.mapX, y: d.mapY });
      }
    }

    const segs: string[] = [];
    for (let i = 1; i < points.length; i++) {
      const seg = buildSmoothSegment(points[i - 1], points[i], i);
      if (seg) segs.push(seg);
    }

    return { pins: pinsOut, segments: segs };
  }, [publishedDays, summaries, now]);

  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const hoveredStateInfo = useMemo(
    () =>
      hoveredState ? STATE_PATHS.find((s) => s.id === hoveredState) : null,
    [hoveredState],
  );

  function handlePinClick(dayNumber: number) {
    if (zoom.didMove()) return;
    onPinClick(dayNumber);
  }
  function handleHubClick(hub: string) {
    if (zoom.didMove()) return;
    onHubClick(hub);
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={zoom.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full select-none rounded-2xl bg-card ring-1 ring-border lg:max-h-[600px]"
        aria-label="Mapa cesty"
        style={{ touchAction: "none" }}
        {...zoom.handlers}
      >
        {/* Land backdrop — USA + Canada + Mexico get a subtle muted tint so
            the landmass reads against the page background. NE state fills sit
            on top with the full muted colour for emphasis. */}
        <g
          fill="var(--muted)"
          opacity={0.45}
          stroke="none"
          pointerEvents="none"
        >
          <path d={USA_OUTLINE_PATH} />
          <path d={CANADA_PATH} />
          <path d={MEXICO_PATH} />
        </g>

        {/* Canada + Mexico outline only (USA outline is re-stroked thicker
            below). */}
        <g
          stroke="var(--border)"
          strokeWidth={0.6}
          strokeLinejoin="round"
          fill="none"
          pointerEvents="none"
        >
          <path d={CANADA_PATH} />
          <path d={MEXICO_PATH} />
        </g>

        <g stroke="var(--border)" strokeWidth={0.6} strokeLinejoin="round">
          {STATE_PATHS.map((s) => {
            const active = hoveredState === s.id;
            return (
              <path
                key={s.id}
                d={s.d}
                fill={active ? "var(--accent)" : "var(--muted)"}
                onMouseEnter={() => setHoveredState(s.id)}
                onMouseLeave={() =>
                  setHoveredState((cur) => (cur === s.id ? null : cur))
                }
                style={{ transition: "fill 120ms ease-out" }}
              />
            );
          })}
        </g>

        {/* Country outline drawn on top so the US-CA / US-MX / coastline
            border reads thicker than the internal state/province borders. */}
        <path
          d={USA_OUTLINE_PATH}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          pointerEvents="none"
        />

        {segments.map((d, i) => (
          <path
            key={`seg-${i}`}
            d={d}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
            pointerEvents="none"
          />
        ))}

        {pins.map((pin) =>
          pin.kind === "hub" ? (
            <HubPin
              key={`hub-${pin.day.hub}`}
              pin={pin}
              onClick={() => handleHubClick(pin.day.hub!)}
            />
          ) : (
            <SinglePin
              key={`day-${pin.day.dayNumber}`}
              pin={pin}
              onClick={() => handlePinClick(pin.day.dayNumber)}
            />
          ),
        )}

        {hoveredStateInfo && (
          <g pointerEvents="none">
            <text
              x={hoveredStateInfo.label_x}
              y={hoveredStateInfo.label_y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fontWeight={600}
              letterSpacing={0.4}
              fill="var(--foreground)"
              opacity={0.85}
              style={{ textTransform: "uppercase" }}
            >
              {hoveredStateInfo.label}
            </text>
          </g>
        )}
      </svg>

      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-surface/90 p-0.5 shadow-sm ring-1 ring-surface-border backdrop-blur sm:bottom-3 sm:right-3 sm:gap-1 sm:p-1">
        <ZoomBtn label="Přiblížit" onClick={zoom.zoomIn}>
          <Plus className="size-3.5 sm:size-4" />
        </ZoomBtn>
        <ZoomBtn
          label="Oddálit"
          onClick={zoom.zoomOut}
          disabled={!zoom.isZoomed}
        >
          <Minus className="size-3.5 sm:size-4" />
        </ZoomBtn>
        <ZoomBtn label="Reset" onClick={zoom.reset} disabled={!zoom.isZoomed}>
          <RotateCcw className="size-3.5 sm:size-4" />
        </ZoomBtn>
      </div>
    </div>
  );
}

function ZoomBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:bg-muted hover:text-foreground disabled:opacity-30 sm:size-9 sm:rounded-lg"
    >
      {children}
    </button>
  );
}

function SinglePin({
  pin,
  onClick,
}: {
  pin: RenderedPin;
  onClick: () => void;
}) {
  const { day, state, highlight } = pin;
  const radius = highlight ? 6 : 5;
  const isUpcoming = state === "upcoming";
  const isCurrent = state === "current";
  const filled = state === "done" || isCurrent;

  return (
    <g
      onClick={onClick}
      style={{ cursor: isUpcoming ? "default" : "pointer" }}
      aria-label={`Den ${day.dayNumber} — ${day.place}`}
    >
      {isCurrent && (
        <circle
          cx={day.mapX}
          cy={day.mapY}
          r={radius + 4}
          fill="var(--primary)"
          opacity={0.3}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        fill={filled ? "var(--primary)" : "var(--card)"}
        stroke="var(--primary)"
        strokeWidth={1.2}
      />
      <text
        x={day.mapX}
        y={day.mapY + 0.2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={5.5}
        fontWeight={700}
        fill={filled ? "var(--primary-foreground)" : "var(--primary)"}
        style={{ pointerEvents: "none" }}
      >
        {day.dayNumber}
      </text>
    </g>
  );
}

function HubPin({ pin, onClick }: { pin: RenderedPin; onClick: () => void }) {
  const { day, hubDays = [], state, highlight } = pin;
  const radius = highlight ? 8 : 7;
  const isCurrent = state === "current";
  const filled = state === "done" || isCurrent;
  const label = getHubLabel(day.hub!);

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      aria-label={`${day.place} — ${hubDays.length} dní`}
    >
      {isCurrent && (
        <circle
          cx={day.mapX}
          cy={day.mapY}
          r={radius + 4}
          fill="var(--primary)"
          opacity={0.3}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        fill={filled ? "var(--primary)" : "var(--card)"}
        stroke="var(--primary)"
        strokeWidth={1.4}
      />
      <text
        x={day.mapX}
        y={day.mapY + 0.3}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={6.5}
        fontWeight={700}
        fill={filled ? "var(--primary-foreground)" : "var(--primary)"}
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

export default UsaMap;
