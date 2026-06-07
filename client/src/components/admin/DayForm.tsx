import { type FormEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type DayData, createDay, updateDay, uploadPhoto } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { ImagePlus, Replace, Trash2 } from "lucide-react"

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
  onSaved: () => void
  onCancel: () => void
}

function DayForm({ tripId, tripStartDate, nextDayNumber, editingDay, onSaved, onCancel }: DayFormProps) {
  const [editingId] = useState<string | null>(editingDay?.id ?? null)
  const [dayNumber, setDayNumber] = useState(editingDay?.dayNumber ?? nextDayNumber)
  const [date, setDate] = useState(editingDay?.date ?? addDays(tripStartDate, nextDayNumber - 1))
  const [title, setTitle] = useState(editingDay?.title ?? "")
  const [summary, setSummary] = useState(editingDay?.summary ?? "")
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(editingDay?.coverPhotoUrl ?? "")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!coverFile) {
      setPreviewUrl("")
      return
    }
    const url = URL.createObjectURL(coverFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  const displayPhoto = previewUrl || coverPhotoUrl

  function handleDayNumberChange(value: number) {
    setDayNumber(value)
    if (!editingId) {
      setDate(addDays(tripStartDate, value - 1))
    }
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCoverFile(file)
    e.target.value = ""
  }

  function handleRemovePhoto() {
    setCoverFile(null)
    setCoverPhotoUrl("")
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      let finalPhotoUrl: string | null = coverPhotoUrl || null
      if (coverFile) {
        finalPhotoUrl = await uploadPhoto(coverFile)
      }

      const data = {
        dayNumber,
        date,
        title: title || null,
        summary: summary || null,
        coverPhotoUrl: finalPhotoUrl,
      }

      if (editingId) {
        await updateDay(editingId, data)
      } else {
        await createDay(tripId, data)
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
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
              <label htmlFor="dayNumber" className="text-sm text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
                  Datum se dopočítá automaticky: {formatDate(date)}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm text-muted-foreground">
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
              <label htmlFor="dayTitle" className="text-sm text-muted-foreground">
                Název (volitelný)
              </label>
              <Input
                id="dayTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="summary" className="text-sm text-muted-foreground">
                Shrnutí (volitelné)
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">
                Titulní fotka
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilePick}
              />

              {displayPhoto ? (
                <div className="overflow-hidden rounded-lg border border-input">
                  <div className="aspect-[3/2] overflow-hidden bg-muted">
                    <img
                      src={displayPhoto}
                      alt="Náhled titulní fotky"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-input bg-muted/40 px-3 py-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {coverFile ? coverFile.name : "Současná fotka"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Replace />
                        Změnit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemovePhoto}
                      >
                        <Trash2 />
                        Odstranit
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-transparent text-muted-foreground transition-colors hover:border-ring hover:bg-muted/40 hover:text-foreground focus-visible:border-ring focus-visible:outline-none"
                >
                  <ImagePlus className="size-6" />
                  <span className="text-sm">Vybrat fotku z počítače</span>
                </button>
              )}
            </div>

            {status === "error" && message && (
              <p className="text-sm text-destructive">{message}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={status === "loading"}
                className="flex-1"
              >
                {status === "loading"
                  ? coverFile
                    ? "Nahrávám fotku..."
                    : "Ukládám..."
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
