import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  type ActivityType,
  getActiveTimeline,
  getCurrentActivity,
} from "@/data/timeline"

const ACTIVITY_EMOJI: Record<ActivityType, string> = {
  flying: "✈️",
  driving: "🚗",
  train: "🚆",
  walking: "🚶",
  sightseeing: "🏛️",
  museum: "🖼️",
  shopping: "🛍️",
  hiking: "🥾",
  viewpoint: "🔭",
  sleeping: "😴",
  baseball: "⚾",
  fireworks: "🎆",
  exploring: "🗺️",
}

function daysLabel(days: number): string {
  if (days === 1) return "den"
  if (days >= 2 && days <= 4) return "dny"
  return "dní"
}

type Variant = "panel" | "chip"

interface DisplayData {
  type: ActivityType
  emoji: string
  primary: string
  secondary: string
  topLabel: string
}

function useDisplayData(): DisplayData | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const active = getActiveTimeline(now)
  if (!active) return null

  const { timeline, phase } = active

  if (phase === "upcoming") {
    const days = Math.ceil(
      (new Date(timeline.trip.start).getTime() - now) / 86_400_000,
    )
    return {
      type: "exploring",
      emoji: ACTIVITY_EMOJI.exploring,
      primary: `${days} ${daysLabel(days)}`,
      secondary: timeline.trip.name,
      topLabel: "Odlet za",
    }
  }

  const current = getCurrentActivity(timeline, now)
  if (!current) return null

  return {
    type: current.type,
    emoji: ACTIVITY_EMOJI[current.type],
    primary: current.label,
    secondary: current.location.name,
    topLabel: "Právě teď",
  }
}

export function LiveActivity({ variant = "panel" }: { variant?: Variant }) {
  const data = useDisplayData()
  if (!data) return null

  if (variant === "chip") {
    return (
      <div className="flex max-w-[280px] items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-brand-foreground shadow-xl shadow-black/25 ring-1 ring-foreground/10">
        <span
          className={`activity-icon activity-${data.type} text-2xl leading-none`}
        >
          {data.emoji}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-wide uppercase opacity-75">
            {data.topLabel}
          </div>
          <div className="truncate text-sm font-bold leading-tight">
            {data.primary}
          </div>
          <div className="truncate text-[11px] opacity-80">
            {data.secondary}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`activity-icon activity-${data.type} text-3xl leading-none`}
        >
          {data.emoji}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {data.topLabel}
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {data.primary}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {data.secondary}
          </div>
        </div>
      </div>
    </Card>
  )
}
