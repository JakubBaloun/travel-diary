import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ItineraryDay } from "@/data/itinerary"
import type { DaySummary } from "@/lib/api"
import DayCard from "./DayCard"

interface DayCarouselProps {
  days: ItineraryDay[]
  summaries: Map<number, DaySummary>
  onSelect: (dayNumber: number) => void
}

function DayCarousel({ days, summaries, onSelect }: DayCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ progress: 0, scrollable: false })

  const published = days
    .filter((d) => summaries.get(d.dayNumber)?.published)
    .sort((a, b) => b.dayNumber - a.dayNumber)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    function update() {
      if (!el) return
      const max = el.scrollWidth - el.clientWidth
      const scrollable = max > 1
      const progress = scrollable ? el.scrollLeft / max : 0
      setScrollState({ progress, scrollable })
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [published.length])

  if (published.length === 0) return null

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-card]")
    const gap = 16
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.8
    el.scrollBy({ left: step * direction, behavior: "smooth" })
  }

  return (
    <section className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {published.map((day) => {
          const summary = summaries.get(day.dayNumber)
          return (
            <div key={day.dayNumber} data-card>
              <DayCard
                day={day}
                photoUrl={summary?.heroThumbUrl ?? null}
                onClick={() => onSelect(day.dayNumber)}
              />
            </div>
          )
        })}
      </div>

      {scrollState.scrollable && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Předchozí"
            className="absolute left-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface p-2 text-surface-foreground shadow-md transition hover:bg-muted sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Další"
            className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface p-2 text-surface-foreground shadow-md transition hover:bg-muted sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-surface-border">
            <div
              className="h-full w-1/3 rounded-full bg-foreground/60"
              style={{ transform: `translateX(${scrollState.progress * 200}%)` }}
            />
          </div>
        </>
      )}
    </section>
  )
}

export default DayCarousel
