import raw from "./itinerary.json"

export interface ItineraryDay {
  dayNumber: number
  date: string
  place: string
  title: string
  emoji: string
  mapX: number
  mapY: number
  hub?: string
}

export interface City {
  name: string
  mapX: number
  mapY: number
}

export interface Trip {
  name: string
  start: string
  end: string
  departure: string
}

export type TripPhase = "before" | "during" | "after"
export type PinState = "done" | "current" | "upcoming"

export const trip: Trip = raw.trip
export const cities: City[] = raw.cities
export const days: ItineraryDay[] = raw.days as ItineraryDay[]

export function getDay(dayNumber: number): ItineraryDay | undefined {
  return days.find((d) => d.dayNumber === dayNumber)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function getPhase(now: Date = new Date()): TripPhase {
  const today = startOfDay(now)
  const start = parseDate(trip.start)
  const end = parseDate(trip.end)
  if (today < start) return "before"
  if (today > end) return "after"
  return "during"
}

export function getDaysUntilStart(now: Date = new Date()): number {
  const today = startOfDay(now).getTime()
  const start = parseDate(trip.start).getTime()
  return Math.max(0, Math.round((start - today) / 86_400_000))
}

export function getCurrentDayNumber(now: Date = new Date()): number | null {
  const today = startOfDay(now).getTime()
  for (const d of days) {
    if (parseDate(d.date).getTime() === today) return d.dayNumber
  }
  return null
}

/** Pin state derived from today vs day.date + published flag. */
export function derivePinState(
  day: ItineraryDay,
  published: boolean,
  now: Date = new Date(),
): PinState {
  if (!published) return "upcoming"
  const today = startOfDay(now).getTime()
  const dayDate = parseDate(day.date).getTime()
  if (dayDate < today) return "done"
  if (dayDate === today) return "current"
  return "upcoming"
}

/** Days that share a hub key (e.g. all NYC days). Returns [] if the day isn't part of a hub. */
export function getHubDays(hub: string): ItineraryDay[] {
  return days.filter((d) => d.hub === hub)
}

/** Short label shown on the map's hub pin. Falls back to the first 3 chars uppercased. */
const HUB_LABELS: Record<string, string> = {
  nyc: "NYC",
  boston: "BOS",
}

export function getHubLabel(hub: string): string {
  return HUB_LABELS[hub] ?? hub.slice(0, 3).toUpperCase()
}
