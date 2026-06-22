import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { fetchDaySummaries, type DaySummary } from "@/lib/api"
import { days } from "@/data/itinerary"
import { formatDate } from "@/lib/utils"
import UsaMap from "@/components/map/UsaMap"
import HubModal from "@/components/map/HubModal"

function Mapa() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<Map<number, DaySummary>>(new Map())
  const [error, setError] = useState("")
  const [openHub, setOpenHub] = useState<string | null>(null)

  useEffect(() => {
    fetchDaySummaries()
      .then((list) => {
        const m = new Map<number, DaySummary>()
        for (const s of list) m.set(s.dayNumber, s)
        setSummaries(m)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (!isAuthenticated()) return <Navigate to="/" replace />

  function handlePinClick(dayNumber: number) {
    const s = summaries.get(dayNumber)
    if (!s || !s.published) return
    navigate(`/den/${dayNumber}`)
  }

  return (
    <div className="mx-auto px-2 pb-10 pt-3 sm:max-w-2xl sm:px-4 sm:pt-8 lg:max-w-4xl">
      <header className="mb-3 px-1 sm:mb-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          USA · Boston → New York
        </h1>
      </header>
      <UsaMap
        summaries={summaries}
        onPinClick={handlePinClick}
        onHubClick={setOpenHub}
      />
      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
      <PublishedList summaries={summaries} onSelect={handlePinClick} />
      {openHub && (
        <HubModal
          hub={openHub}
          summaries={summaries}
          onSelect={(n) => {
            setOpenHub(null)
            handlePinClick(n)
          }}
          onClose={() => setOpenHub(null)}
        />
      )}
    </div>
  )
}

interface PublishedListProps {
  summaries: Map<number, DaySummary>
  onSelect: (dayNumber: number) => void
}

function PublishedList({ summaries, onSelect }: PublishedListProps) {
  const published = days
    .filter((d) => summaries.get(d.dayNumber)?.published)
    .sort((a, b) => a.dayNumber - b.dayNumber)

  if (published.length === 0) return null

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-surface-border bg-surface text-surface-foreground">
      <ul className="divide-y divide-surface-border">
        {published.map((d) => (
          <li key={d.dayNumber}>
            <button
              onClick={() => onSelect(d.dayNumber)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-badge text-sm font-bold text-badge-foreground">
                {d.dayNumber}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  <span className="mr-1">{d.emoji}</span>
                  {d.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(d.date)} · {d.place}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Mapa
