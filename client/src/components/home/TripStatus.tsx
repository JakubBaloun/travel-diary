import { useMemo } from "react"
import { CalendarDays, MapPin } from "lucide-react"
import {
  days,
  getCurrentDayNumber,
  getDaysUntilStart,
  getPhase,
  trip,
} from "@/data/itinerary"

function pluralDays(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return "dní"
  const mod10 = n % 10
  if (mod10 === 1) return "den"
  if (mod10 >= 2 && mod10 <= 4) return "dny"
  return "dní"
}

function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${d}. ${m}. ${y}`
}

function TripStatus() {
  const phase = useMemo(() => getPhase(), [])

  if (phase === "before") {
    const n = getDaysUntilStart()
    return (
      <Pill
        icon={<CalendarDays className="size-4" />}
        primary={`Odlet za ${n} ${pluralDays(n)}`}
        secondary={shortDate(trip.start)}
      />
    )
  }

  if (phase === "during") {
    const current = getCurrentDayNumber()
    if (current == null) return null
    return (
      <Pill
        icon={<MapPin className="size-4" />}
        primary={`Den ${current} z ${days.length}`}
      />
    )
  }

  return null
}

function Pill({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode
  primary: string
  secondary?: string
}) {
  return (
    <div className="flex justify-center px-4 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-3.5 py-1.5 text-sm text-surface-foreground shadow-sm">
        <span className="text-brand">{icon}</span>
        <span className="font-semibold">{primary}</span>
        {secondary && (
          <>
            <span aria-hidden className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{secondary}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default TripStatus
