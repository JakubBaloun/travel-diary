import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { type DayData, type TripWithDays, createDay } from "@/lib/api"
import { formatDate } from "@/lib/utils"

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

interface AdminDayListProps {
  trip: TripWithDays
  days: DayData[]
  loading: boolean
  error: string
  onCreate: () => void
  onEdit: (day: DayData) => void
  onDelete: (id: string) => void
  onOpenEntries: (day: DayData) => void
  onBack: () => void
  adminKey: string
  onDaysChanged: () => void
}

function AdminDayList({ trip, days, loading, error, onCreate, onEdit, onDelete, onOpenEntries, onBack, adminKey, onDaysChanged }: AdminDayListProps) {
  const [showBulk, setShowBulk] = useState(false)
  const [bulkCount, setBulkCount] = useState(3)
  const [bulkStatus, setBulkStatus] = useState<"idle" | "loading" | "error">("idle")
  const [bulkMessage, setBulkMessage] = useState("")

  const nextDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.dayNumber)) + 1 : 1

  async function handleBulkCreate() {
    setBulkStatus("loading")
    setBulkMessage("")

    try {
      for (let i = 0; i < bulkCount; i++) {
        const dayNum = nextDayNumber + i
        await createDay(trip.id, {
          dayNumber: dayNum,
          date: addDays(trip.startDate, dayNum - 1),
        }, adminKey)
      }
      setBulkStatus("idle")
      setShowBulk(false)
      onDaysChanged()
    } catch (err) {
      setBulkStatus("error")
      setBulkMessage(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {trip.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreate}>Přidat den</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowBulk(!showBulk)}>
            Přidat více
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            Zpět na přehled
          </Button>
        </div>
      </div>

      {showBulk && (
        <Card size="sm" className="mb-6">
          <CardContent className="flex items-end gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Počet dní</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={bulkCount}
                onChange={(e) => setBulkCount(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Od dne {nextDayNumber}</p>
              <p>Od {formatDate(addDays(trip.startDate, nextDayNumber - 1))}</p>
            </div>
            <Button
              onClick={handleBulkCreate}
              disabled={bulkStatus === "loading"}
              size="sm"
            >
              {bulkStatus === "loading" ? "Vytvářím..." : "Vytvořit"}
            </Button>
            {bulkStatus === "error" && (
              <p className="text-xs text-destructive">{bulkMessage}</p>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <p className="text-center text-muted-foreground">Načítám...</p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {!loading && days.length === 0 && (
        <p className="text-center text-muted-foreground">Zatím žádné dny.</p>
      )}

      <div className="grid gap-3 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => (
          <button
            key={d.id}
            className="group block w-full text-left focus-visible:outline-none"
            onClick={() => onOpenEntries(d)}
          >
            <Card className="overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:ring-ring/60 group-hover:shadow-lg group-hover:shadow-black/20">
              <div className="aspect-[3/1] overflow-hidden">
                <img
                  src={d.coverPhotoUrl || trip.coverPhotoUrl || `https://picsum.photos/seed/${trip.slug}-${d.dayNumber}/600/200`}
                  alt=""
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                />
              </div>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-badge text-sm font-bold text-badge-foreground">
                    {d.dayNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{formatDate(d.date)}</p>
                    <h3 className="truncate font-semibold text-card-foreground">
                      {d.title || `Den ${d.dayNumber}`}
                    </h3>
                  </div>
                </div>
                {d.summary && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{d.summary}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEdit(d) }}
                  >
                    Editovat
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDelete(d.id) }}
                  >
                    Smazat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AdminDayList
