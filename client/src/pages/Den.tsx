import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Navigate } from "react-router-dom"
import { ArrowLeft, ChevronLeft, ChevronRight, Map as MapIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchDay,
  fetchDaySummaries,
  type DayData,
  type DaySummary,
} from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"
import { getDay } from "@/data/itinerary"
import { formatDate } from "@/lib/utils"
import EditorialGallery from "@/components/day/EditorialGallery"
import StoryText from "@/components/day/StoryText"

function Den() {
  const { dayNumber: dayParam } = useParams<{ dayNumber: string }>()
  const navigate = useNavigate()
  const dayNumber = Number(dayParam)
  const itinerary = getDay(dayNumber)

  const [day, setDay] = useState<DayData | null>(null)
  const [summaries, setSummaries] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!Number.isFinite(dayNumber) || !itinerary) return
    let aborted = false
    Promise.all([fetchDay(dayNumber), fetchDaySummaries()])
      .then(([d, sums]) => {
        if (aborted) return
        setDay(d)
        setSummaries(sums)
        setLoading(false)
      })
      .catch((e) => {
        if (aborted) return
        setError(e instanceof Error ? e.message : "Chyba")
        setLoading(false)
      })
    return () => {
      aborted = true
    }
  }, [dayNumber, itinerary])

  const { prevN, nextN } = useMemo(() => {
    const published = summaries
      .filter((s) => s.published)
      .map((s) => s.dayNumber)
      .sort((a, b) => a - b)
    const idx = published.indexOf(dayNumber)
    return {
      prevN: idx > 0 ? published[idx - 1] : null,
      nextN: idx >= 0 && idx < published.length - 1 ? published[idx + 1] : null,
    }
  }, [summaries, dayNumber])

  if (!isAuthenticated()) return <Navigate to="/" replace />
  if (!itinerary) return <Navigate to="/mapa" replace />

  const hero = day?.heroPhotoId
    ? day.photos.find((p) => p.id === day.heroPhotoId)
    : day?.photos[0]
  const otherPhotos = day
    ? hero
      ? day.photos.filter((p) => p.id !== hero.id)
      : day.photos
    : []

  return (
    <article className="pb-16">
      {/* Hero */}
      <header className="relative">
        {hero ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[16/9]">
            <img
              src={hero.urlMed}
              srcSet={`${hero.urlThumb} 400w, ${hero.urlMed} 1000w, ${hero.url} 1800w`}
              sizes="100vw"
              alt={hero.caption ?? ""}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="bg-image-overlay absolute inset-0" />
          </div>
        ) : (
          <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-page text-7xl sm:text-9xl">
            <span>{itinerary.emoji}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-8 sm:pb-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 text-white drop-shadow-lg">
              <span className="flex size-11 items-center justify-center rounded-full bg-badge text-base font-bold text-badge-foreground">
                {itinerary.dayNumber}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide opacity-85">
                  {formatDate(itinerary.date)} · {itinerary.place}
                </p>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  <span className="mr-2">{itinerary.emoji}</span>
                  {itinerary.title}
                </h1>
              </div>
              {day?.highlight && (
                <span
                  className="ml-auto flex items-center gap-1 rounded-full bg-brand/90 px-2.5 py-1 text-xs font-semibold text-brand-foreground"
                  title="Highlight"
                >
                  <Sparkles className="size-3.5" />
                  Top
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/mapa")}
          className="absolute left-3 top-3 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white sm:left-6 sm:top-6"
        >
          <ArrowLeft className="mr-1 size-4" />
          Mapa
        </Button>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        {loading && <p className="text-center text-muted-foreground">Načítám…</p>}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        {day && (
          <>
            {day.story && <StoryText text={day.story} className="mb-8" />}
            {otherPhotos.length > 0 && <EditorialGallery photos={otherPhotos} />}

            <footer className="mt-12 flex items-center justify-between gap-2 border-t border-surface-border pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => prevN && navigate(`/den/${prevN}`)}
                disabled={!prevN}
              >
                <ChevronLeft className="mr-1 size-4" />
                {prevN ? `Den ${prevN}` : "Předchozí"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/mapa")}
                title="Mapa"
              >
                <MapIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextN && navigate(`/den/${nextN}`)}
                disabled={!nextN}
              >
                {nextN ? `Den ${nextN}` : "Další"}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </footer>
          </>
        )}
      </div>
    </article>
  )
}

export default Den
