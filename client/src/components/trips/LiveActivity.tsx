import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  getCurrentDayNumber,
  getDay,
  getDaysUntilStart,
  getPhase,
  trip,
} from "@/data/itinerary"

export type LiveActivityVariant = "panel" | "chip"

interface LiveActivityData {
  emoji: string
  topLabel: string
  primary: string
  secondary: string
}

function pickDaysWord(n: number): string {
  if (n === 1) return "den"
  if (n >= 2 && n <= 4) return "dny"
  return "dní"
}

function useDisplayData(): LiveActivityData | null {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const phase = getPhase(now)

  if (phase === "before") {
    const days = getDaysUntilStart(now)
    return {
      emoji: "✈️",
      topLabel: "Odlet za",
      primary: `${days} ${pickDaysWord(days)}`,
      secondary: trip.name,
    }
  }

  if (phase === "during") {
    const n = getCurrentDayNumber(now)
    const day = n ? getDay(n) : undefined
    if (!day) return null
    return {
      emoji: day.emoji,
      topLabel: `Den ${day.dayNumber} · live`,
      primary: day.title,
      secondary: day.place,
    }
  }

  return null
}

export function LiveActivityView({
  data,
  variant = "panel",
}: {
  data: LiveActivityData
  variant?: LiveActivityVariant
}) {
  if (variant === "chip") {
    return (
      <div className="flex max-w-[280px] items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-brand-foreground shadow-xl shadow-black/25 ring-1 ring-foreground/10">
        <span className="text-2xl leading-none">{data.emoji}</span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-wide uppercase opacity-75">
            {data.topLabel}
          </div>
          <div className="truncate text-sm font-bold leading-tight">{data.primary}</div>
          {data.secondary && (
            <div className="truncate text-[11px] opacity-80">{data.secondary}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none">{data.emoji}</span>
        <div className="min-w-0">
          <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {data.topLabel}
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {data.primary}
          </div>
          {data.secondary && (
            <div className="truncate text-[11px] text-muted-foreground">
              {data.secondary}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function LiveActivity({
  variant = "panel",
}: {
  variant?: LiveActivityVariant
}) {
  const data = useDisplayData()
  if (!data) return null
  return <LiveActivityView data={data} variant={variant} />
}
