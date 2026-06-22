import { useMemo, useRef } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  days,
  derivePinState,
  getHubDays,
  getHubLabel,
  type ItineraryDay,
  type PinState,
} from "@/data/itinerary";
import { STATE_PATHS, USA_BG_PATH } from "@/data/state-paths";
import { type DaySummary } from "@/lib/api";
import { useSvgPanZoom } from "./useSvgPanZoom";

interface Props {
  summaries: Map<number, DaySummary>;
  onPinClick: (dayNumber: number) => void;
  onHubClick: (hub: string) => void;
}

const STATE_FILL: Record<string, string> = {
  "23": "oklch(0.96 0.025 80)",
  "33": "oklch(0.95 0.03 50)",
  "50": "oklch(0.96 0.03 140)",
  "25": "oklch(0.95 0.03 30)",
  "09": "oklch(0.96 0.025 220)",
  "44": "oklch(0.96 0.025 280)",
  "36": "oklch(0.96 0.03 100)",
  "34": "oklch(0.96 0.025 250)",
  "42": "oklch(0.96 0.025 350)",
  "10": "oklch(0.96 0.03 190)",
  "24": "oklch(0.96 0.03 60)",
  "11": "oklch(0.93 0.035 350)",
  "51": "oklch(0.96 0.03 160)",
};

const INK = "oklch(0.32 0.06 50)";
const PAPER = "oklch(0.96 0.02 80)";
const OCEAN = "oklch(0.92 0.025 215)";
const ROUTE = "oklch(0.5 0.2 25)";
const PIN_PAPER = "oklch(0.985 0.005 70)";
const USA_BG_FILL = "oklch(0.9 0.012 75)";

const VIEW = { x: 692, y: -35, w: 400, h: 460 } as const;

// Vygeneruje zvlněný segment pouze mezi dvěma konkrétními body
function buildSmoothSegment(
  p1: ItineraryDay,
  p2: ItineraryDay,
  index: number,
): string {
  if (p1.mapX === p2.mapX && p1.mapY === p2.mapY) return "";

  function jitter(i: number, k: number): number {
    const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  const SUBDIVISIONS = 4;
  const AMPLITUDE = 0.06;

  const dx = p2.mapX - p1.mapX;
  const dy = p2.mapY - p1.mapY;
  const len = Math.hypot(dx, dy);

  if (len < 20) {
    return `M ${p1.mapX} ${p1.mapY} L ${p2.mapX} ${p2.mapY}`;
  }

  // TADY JE TA OPRAVA: p1 správně převádíme na formát { x, y }
  const expanded: { x: number; y: number }[] = [{ x: p1.mapX, y: p1.mapY }];
  const nx = -dy / len;
  const ny = dx / len;

  for (let k = 1; k <= SUBDIVISIONS; k++) {
    const t = k / (SUBDIVISIONS + 1);
    const sign = k % 2 === 0 ? 1 : -1;
    const mag = 0.5 + jitter(index, k) * 0.5;
    const offset = AMPLITUDE * len * sign * mag;
    expanded.push({
      x: p1.mapX + dx * t + nx * offset,
      y: p1.mapY + dy * t + ny * offset,
    });
  }
  // A tady na konci tlačíme p2 také jako správný objekt s x a y
  expanded.push({ x: p2.mapX, y: p2.mapY });

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

const PIN_INTERVAL_MS = 1000;
const PIN_FADE_MS = 350;

interface RenderedPin {
  kind: "single" | "hub";
  day: ItineraryDay;
  hubDays?: ItineraryDay[];
  state: PinState;
  highlight: boolean;
}

interface RouteSegment {
  d: string;
  delay: number;
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

  // Společný výpočet špendlíků i rozkouskované trasy
  const { pins, pinDelays, segments } = useMemo(() => {
    const seenHubs = new Set<string>();
    const pinsOut: RenderedPin[] = [];
    const delays: number[] = [];
    const segmentsOut: RouteSegment[] = [];

    let pinCount = 0;
    let prevDay: ItineraryDay | null = null;

    for (const d of publishedDays) {
      let isNewPin = false;

      if (d.hub) {
        if (!seenHubs.has(d.hub)) {
          seenHubs.add(d.hub);
          const hd = getHubDays(d.hub);
          pinsOut.push({
            kind: "hub",
            day: d,
            hubDays: hd,
            state: aggregateHubState(hd, summaries, now),
            highlight: hd.some((x) => summaries.get(x.dayNumber)?.highlight),
          });
          isNewPin = true;
        }
      } else {
        const s = summaries.get(d.dayNumber);
        pinsOut.push({
          kind: "single",
          day: d,
          state: derivePinState(d, s?.published ?? false, now),
          highlight: s?.highlight ?? false,
        });
        isNewPin = true;
      }

      if (isNewPin) {
        const currentDelay = pinCount * PIN_INTERVAL_MS;
        delays.push(currentDelay);

        // Pokud máme předchozí špendlík, vytvoříme samostatnou čáru mezi ním a současným
        if (prevDay) {
          const pathD = buildSmoothSegment(prevDay, d, pinCount);
          if (pathD) {
            segmentsOut.push({
              d: pathD,
              // Čára se začne kreslit v momentě, kdy se objevil předchozí špendlík
              delay: (pinCount - 1) * PIN_INTERVAL_MS,
            });
          }
        }

        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        prevDay = d;
        pinCount++;
      }
    }

    return {
      pins: pinsOut,
      pinDelays: delays,
      segments: segmentsOut,
    };
  }, [publishedDays, summaries, now]);

  function handlePinClick(dayNumber: number) {
    if (zoom.didMove()) return;
    onPinClick(dayNumber);
  }
  function handleHubClick(hub: string) {
    if (zoom.didMove()) return;
    onHubClick(hub);
  }

  return (
    <div className="relative lg:mx-auto lg:max-w-[520px]">
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
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="7"
            />
            <feDisplacementMap in="SourceGraphic" scale="0.9" />
          </filter>
          <filter id="wash" x="-3%" y="-3%" width="106%" height="106%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="3"
              seed="11"
            />
            <feDisplacementMap in="SourceGraphic" scale="4" />
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
          <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed="2"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.30   0 0 0 0 0.22   0 0 0 0 0.12   0 0 0 0.10 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <radialGradient id="paper-glow" cx="50%" cy="35%" r="80%">
            <stop offset="0%" stopColor={PAPER} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor="oklch(0.91 0.03 70)"
              stopOpacity="1"
            />
          </radialGradient>
        </defs>

        <rect
          x={VIEW.x}
          y={VIEW.y}
          width={VIEW.w}
          height={VIEW.h}
          fill="url(#paper-glow)"
        />
        <rect
          x={VIEW.x}
          y={VIEW.y}
          width={VIEW.w}
          height={VIEW.h}
          fill={OCEAN}
          opacity="0.55"
        />
        <rect
          x={VIEW.x}
          y={VIEW.y}
          width={VIEW.w}
          height={VIEW.h}
          fill="black"
          opacity="0.04"
          filter="url(#paper-grain)"
        />

        <g filter="url(#wash)">
          <path d={USA_BG_PATH} fill={USA_BG_FILL} opacity={0.95} />
        </g>
        <g filter="url(#ink-jitter)">
          <path
            d={USA_BG_PATH}
            fill="none"
            stroke={INK}
            strokeWidth={0.9}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.45}
          />
        </g>

        <g filter="url(#wash)">
          {STATE_PATHS.map((s) => (
            <path
              key={`fill-${s.id}`}
              d={s.d}
              fill={STATE_FILL[s.id] ?? "oklch(0.92 0.02 80)"}
              opacity={0.95}
            />
          ))}
        </g>

        <g
          filter="url(#ink-jitter)"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {STATE_PATHS.map((s) => (
            <path
              key={`stroke-${s.id}`}
              d={s.d}
              stroke={INK}
              strokeWidth={0.9}
              opacity={0.7}
            />
          ))}
        </g>

        {/* Vykreslení jednotlivých segmentů cesty. Každý se kreslí přesně 1 vteřinu. */}
        {segments.map((seg, idx) => (
          <path
            key={`seg-${idx}`}
            d={seg.d}
            fill="none"
            stroke={ROUTE}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.95}
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
              animation: `map-route-draw ${PIN_INTERVAL_MS}ms linear ${seg.delay}ms forwards`,
            }}
          />
        ))}

        {pins.map((pin, i) => {
          const key =
            pin.kind === "hub"
              ? `hub-${pin.day.hub}`
              : `day-${pin.day.dayNumber}`;
          const delay = pinDelays[i];
          return (
            <g
              key={key}
              style={{
                animation: `map-pin-fade-in ${PIN_FADE_MS}ms ease-out ${delay}ms both`,
              }}
            >
              {pin.kind === "hub" ? (
                <HubPin
                  pin={pin}
                  onClick={() => handleHubClick(pin.day.hub!)}
                />
              ) : (
                <SinglePin
                  pin={pin}
                  onClick={() => handlePinClick(pin.day.dayNumber)}
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-surface/90 p-0.5 shadow-md ring-1 ring-surface-border backdrop-blur sm:bottom-3 sm:right-3 sm:gap-1 sm:p-1">
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
  const radius = highlight ? 7 : 6;
  const isUpcoming = state === "upcoming";
  const isDone = state === "done";

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
          stroke={ROUTE}
          strokeWidth={1.5}
          opacity={0.55}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        fill={isDone ? ROUTE : PIN_PAPER}
        stroke={ROUTE}
        strokeWidth={1.2}
        strokeOpacity={0.95}
      />
      <text
        x={day.mapX}
        y={day.mapY + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={7.5}
        fontWeight={700}
        fill={isDone ? "oklch(0.98 0.005 70)" : ROUTE}
        style={{
          pointerEvents: "none",
          fontFamily: '"Caveat Variable", cursive',
        }}
      >
        {day.dayNumber}
      </text>
    </g>
  );
}

function HubPin({ pin, onClick }: { pin: RenderedPin; onClick: () => void }) {
  const { day, hubDays = [], state, highlight } = pin;
  const radius = highlight ? 9 : 8;
  const isDone = state === "done";
  const label = getHubLabel(day.hub!);

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
          stroke={ROUTE}
          strokeWidth={1.5}
          opacity={0.55}
          className="animate-ping"
        />
      )}
      <circle
        cx={day.mapX}
        cy={day.mapY}
        r={radius}
        fill={isDone ? ROUTE : PIN_PAPER}
        stroke={ROUTE}
        strokeWidth={1.3}
        strokeOpacity={0.95}
      />
      <text
        x={day.mapX}
        y={day.mapY + 0.8}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={7.5}
        fontWeight={700}
        fill={isDone ? "oklch(0.98 0.005 70)" : ROUTE}
        style={{
          pointerEvents: "none",
          fontFamily: '"Caveat Variable", cursive',
        }}
      >
        {label}
      </text>
    </g>
  );
}

export default UsaMap;
