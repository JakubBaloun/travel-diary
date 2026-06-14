import usa2026 from "./usa-2026-timeline.json"

export type ActivityType =
  | "flying"
  | "driving"
  | "train"
  | "walking"
  | "sightseeing"
  | "museum"
  | "shopping"
  | "hiking"
  | "viewpoint"
  | "sleeping"
  | "baseball"
  | "fireworks"
  | "exploring"

export interface ActivityLocation {
  name: string
  lat: number
  lng: number
}

export interface Activity {
  start: string
  end: string
  type: ActivityType
  label: string
  location: ActivityLocation
}

export interface Timeline {
  trip: {
    slug: string
    name: string
    timezone: string
    start: string
    end: string
  }
  activityTypes: ActivityType[]
  activities: Activity[]
}

const TIMELINES: Record<string, Timeline> = {
  "usa-2026": usa2026 as Timeline,
}

export function getTimeline(slug: string): Timeline | null {
  return TIMELINES[slug] ?? null
}

export type TimelinePhase = "active" | "upcoming"

export interface ActiveTimeline {
  timeline: Timeline
  phase: TimelinePhase
}

export function getActiveTimeline(nowMs: number): ActiveTimeline | null {
  const all = Object.values(TIMELINES)

  const active = all.find((t) => {
    const start = new Date(t.trip.start).getTime()
    const end = new Date(t.trip.end).getTime()
    return start <= nowMs && nowMs < end
  })
  if (active) return { timeline: active, phase: "active" }

  const upcoming = all
    .filter((t) => new Date(t.trip.start).getTime() > nowMs)
    .sort(
      (a, b) =>
        new Date(a.trip.start).getTime() - new Date(b.trip.start).getTime(),
    )[0]
  if (upcoming) return { timeline: upcoming, phase: "upcoming" }

  return null
}

export function getCurrentActivity(
  timeline: Timeline,
  nowMs: number,
): Activity | null {
  return (
    timeline.activities.find(
      (a) =>
        new Date(a.start).getTime() <= nowMs &&
        nowMs < new Date(a.end).getTime(),
    ) ?? null
  )
}
