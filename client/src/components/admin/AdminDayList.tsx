import { useEffect, useState } from "react"
import { ChevronRight, Eye, EyeOff, LogOut, Sparkles, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchAdminDaySummaries,
  updateDayContent,
  type DaySummary,
} from "@/lib/api"
import { days } from "@/data/itinerary"
import { formatDate } from "@/lib/utils"

interface Props {
  onSelectDay: (dayNumber: number) => void
  onLogout: () => void
}

function AdminDayList({ onSelectDay, onLogout }: Props) {
  const [summaries, setSummaries] = useState<Map<number, DaySummary>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<Set<number>>(new Set())

  useEffect(() => {
    let aborted = false
    fetchAdminDaySummaries()
      .then((list) => {
        if (aborted) return
        const m = new Map<number, DaySummary>()
        for (const s of list) m.set(s.dayNumber, s)
        setSummaries(m)
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
  }, [])

  async function togglePublished(n: number, value: boolean) {
    setBusy((b) => new Set(b).add(n))
    try {
      const updated = await updateDayContent(n, { published: value })
      setSummaries((m) => {
        const next = new Map(m)
        const cur = next.get(n)
        next.set(n, {
          dayNumber: n,
          published: updated.published,
          highlight: updated.highlight,
          photoCount: cur?.photoCount ?? updated.photos.length,
          heroThumbUrl: cur?.heroThumbUrl ?? null,
        })
        return next
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    } finally {
      setBusy((b) => {
        const next = new Set(b)
        next.delete(n)
        return next
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-3 pb-16 pt-4 sm:px-6 sm:pt-8">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Admin</h1>
          <p className="text-xs text-muted-foreground">USA Léto 2026 · 15 dní</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onLogout} aria-label="Odhlásit" title="Odhlásit">
          <LogOut />
        </Button>
      </header>

      {loading && <p className="text-center text-muted-foreground">Načítám…</p>}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <ul className="flex flex-col gap-2">
        {days.map((d) => {
          const s = summaries.get(d.dayNumber)
          const published = s?.published ?? false
          const highlight = s?.highlight ?? false
          const photoCount = s?.photoCount ?? 0
          const heroThumb = s?.heroThumbUrl ?? null
          const isBusy = busy.has(d.dayNumber)

          return (
            <li key={d.dayNumber}>
              <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-card p-3">
                <button
                  onClick={() => onSelectDay(d.dayNumber)}
                  className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none"
                >
                  {heroThumb ? (
                    <img
                      src={heroThumb}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                      {d.emoji}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-badge text-[10px] font-bold text-badge-foreground">
                        {d.dayNumber}
                      </span>
                      <p className="truncate text-sm font-semibold">{d.title}</p>
                      {highlight && (
                        <Sparkles className="size-3.5 shrink-0 text-brand" aria-label="Highlight" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(d.date)} · {d.place}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {photoCount > 0 ? `${photoCount} fotek` : "bez fotek"}
                      {!published && " · nepublikováno"}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => togglePublished(d.dayNumber, !published)}
                  disabled={isBusy}
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                    published
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  aria-label={published ? "Skrýt" : "Publikovat"}
                  title={published ? "Publikované — klikni pro skrytí" : "Skryté — klikni pro publikování"}
                >
                  {published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>

                <button
                  onClick={() => onSelectDay(d.dayNumber)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Upravit"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {!loading && summaries.size === 0 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <ImageIcon className="mx-auto mb-1 size-4" />
          Zatím žádný obsah — klikni na den a začni postovat.
        </p>
      )}
    </div>
  )
}

export default AdminDayList
