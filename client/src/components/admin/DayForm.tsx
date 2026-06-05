import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type DayData, createDay, updateDay } from "@/lib/api"
import { formatDate } from "@/lib/utils"

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

interface DayFormProps {
  tripId: string
  tripStartDate: string
  nextDayNumber: number
  editingDay: DayData | null
  adminKey: string
  onSaved: () => void
  onCancel: () => void
}

function DayForm({ tripId, tripStartDate, nextDayNumber, editingDay, adminKey, onSaved, onCancel }: DayFormProps) {
  const [editingId] = useState<string | null>(editingDay?.id ?? null)
  const [dayNumber, setDayNumber] = useState(editingDay?.dayNumber ?? nextDayNumber)
  const [date, setDate] = useState(editingDay?.date ?? addDays(tripStartDate, nextDayNumber - 1))
  const [title, setTitle] = useState(editingDay?.title ?? "")
  const [summary, setSummary] = useState(editingDay?.summary ?? "")
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(editingDay?.coverPhotoUrl ?? "")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")

  function handleDayNumberChange(value: number) {
    setDayNumber(value)
    if (!editingId) {
      setDate(addDays(tripStartDate, value - 1))
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      const data = {
        dayNumber,
        date,
        title: title || null,
        summary: summary || null,
        coverPhotoUrl: coverPhotoUrl || null,
      }

      if (editingId) {
        await updateDay(editingId, data, adminKey)
      } else {
        await createDay(tripId, data, adminKey)
      }

      setStatus("idle")
      onSaved()
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          {editingId ? "Upravit den" : "Nový den"}
        </h1>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Zpět
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Upravit den" : "Vytvořit den"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dayNumber" className="text-sm text-zinc-400">
                Číslo dne *
              </label>
              <Input
                id="dayNumber"
                type="number"
                min={1}
                value={dayNumber}
                onChange={(e) => handleDayNumberChange(Number(e.target.value))}
                required
              />
              {!editingId && (
                <p className="text-xs text-zinc-500">
                  Datum se dopočítá automaticky: {formatDate(date)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm text-zinc-400">
                Datum *
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dayTitle" className="text-sm text-zinc-400">
                Název (volitelný)
              </label>
              <Input
                id="dayTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="summary" className="text-sm text-zinc-400">
                Shrnutí (volitelné)
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="coverPhotoUrl" className="text-sm text-zinc-400">
                URL titulní fotky
              </label>
              <Input
                id="coverPhotoUrl"
                type="url"
                value={coverPhotoUrl}
                onChange={(e) => setCoverPhotoUrl(e.target.value)}
                placeholder="https://"
              />
            </div>

            {status === "error" && message && (
              <p className="text-sm text-red-400">{message}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={status === "loading"}
                className="flex-1"
              >
                {status === "loading"
                  ? "Ukládám..."
                  : editingId
                    ? "Uložit změny"
                    : "Vytvořit den"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Zrušit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DayForm
