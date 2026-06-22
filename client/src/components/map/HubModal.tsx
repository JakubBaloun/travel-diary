import { useEffect } from "react"
import { X, ChevronRight, Lock } from "lucide-react"
import { getHubDays } from "@/data/itinerary"
import { type DaySummary } from "@/lib/api"
import { formatDate } from "@/lib/utils"

interface Props {
  hub: string
  summaries: Map<number, DaySummary>
  onSelect: (dayNumber: number) => void
  onClose: () => void
}

function HubModal({ hub, summaries, onSelect, onClose }: Props) {
  const hubDays = getHubDays(hub)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  const title = hubDays[0]?.place ?? "Zastávka"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-surface-border bg-surface text-surface-foreground shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-surface-border px-5 py-3">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{hubDays.length} dní</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Zavřít"
          >
            <X className="size-5" />
          </button>
        </header>

        <ul className="max-h-[60vh] overflow-y-auto py-2">
          {hubDays.map((d) => {
            const s = summaries.get(d.dayNumber)
            const published = s?.published ?? false
            const photoCount = s?.photoCount ?? 0
            return (
              <li key={d.dayNumber}>
                <button
                  onClick={() => published && onSelect(d.dayNumber)}
                  disabled={!published}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors enabled:hover:bg-muted disabled:opacity-50"
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
                      {formatDate(d.date)}
                      {published && photoCount > 0 && ` · ${photoCount} fotek`}
                    </p>
                  </div>
                  {published ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <Lock className="size-3.5 text-muted-foreground" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default HubModal
