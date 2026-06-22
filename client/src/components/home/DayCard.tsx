import type { ItineraryDay } from "@/data/itinerary"

interface DayCardProps {
  day: ItineraryDay
  photoUrl: string | null
  onClick: () => void
}

function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${d}.${m}.${y}`
}

function shortPlace(place: string): string {
  return place.split(",")[0].trim()
}

function DayCard({ day, photoUrl, onClick }: DayCardProps) {
  const hasPhoto = photoUrl !== null
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[3/4] w-[240px] shrink-0 snap-start overflow-hidden rounded-xl bg-muted text-left shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[260px] lg:w-[280px]"
    >
      {hasPhoto && (
        <>
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
        </>
      )}

      <span
        className={`absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-badge text-sm font-bold text-badge-foreground ${hasPhoto ? "shadow-md" : ""}`}
      >
        {day.dayNumber}
      </span>

      <div
        className={`absolute inset-x-0 bottom-0 p-4 ${hasPhoto ? "text-white" : "text-foreground"}`}
      >
        <p
          className={`text-[11px] font-medium tracking-wide ${hasPhoto ? "opacity-85" : "opacity-70"}`}
        >
          {shortDate(day.date)} · {shortPlace(day.place)}
        </p>
        <h3
          className={`mt-1 line-clamp-2 text-lg font-bold leading-tight ${hasPhoto ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : ""}`}
        >
          <span className="mr-1.5">{day.emoji}</span>
          {day.title}
        </h3>
      </div>
    </button>
  )
}

export default DayCard
