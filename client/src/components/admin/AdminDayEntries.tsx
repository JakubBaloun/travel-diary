import { type FormEvent, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type DayData, type EntryData, createEntry, deleteEntry } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import PhotoGallery from "@/components/PhotoGallery"
import { ArrowLeft, X } from "lucide-react"

interface AdminDayEntriesProps {
  day: DayData
  entries: EntryData[]
  loading: boolean
  adminKey: string
  onBack: () => void
  onEntriesChanged: () => void
}

function AdminDayEntries({ day, entries, loading, adminKey, onBack, onEntriesChanged }: AdminDayEntriesProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [entryType, setEntryType] = useState<"text" | "photo">("text")
  const [content, setContent] = useState("")
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [caption, setCaption] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")

  function resetForm() {
    setContent("")
    setPhotoFiles([])
    setCaption("")
    setStatus("idle")
    setMessage("")
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      if (entryType === "text") {
        if (!content.trim()) {
          setStatus("error")
          setMessage("Text nesmí být prázdný")
          return
        }
        await createEntry(day.id, { type: "text", content: content.trim(), caption: caption || null }, undefined, adminKey)
      } else {
        if (photoFiles.length === 0) {
          setStatus("error")
          setMessage("Vyber prosím alespoň jednu fotku")
          return
        }
        await Promise.all(
          photoFiles.map((f) =>
            createEntry(day.id, { type: "photo", caption: caption || null }, f, adminKey)
          )
        )
      }

      resetForm()
      onEntriesChanged()
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  const photoEntries = entries.filter((e) => e.type === "photo")
  const textEntries = entries.filter((e) => e.type === "text")

  async function handleDelete(id: string) {
    if (!confirm("Opravdu chceš smazat tento záznam?")) return
    try {
      await deleteEntry(id, adminKey)
      onEntriesChanged()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Zpět na dny
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-badge text-lg font-bold text-badge-foreground">
            {day.dayNumber}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {day.title || `Den ${day.dayNumber}`}
            </h1>
            <p className="text-sm text-muted-foreground">{formatDate(day.date)}</p>
          </div>
        </div>
        {day.summary && (
          <p className="mt-2 text-sm text-muted-foreground">{day.summary}</p>
        )}
      </div>

      {day.coverPhotoUrl && (
        <div className="mb-8 overflow-hidden rounded-xl">
          <img src={day.coverPhotoUrl} alt="" className="aspect-[3/1] w-full object-cover" />
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Přidat záznam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={entryType === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setEntryType("text")}
            >
              Text
            </Button>
            <Button
              type="button"
              variant={entryType === "photo" ? "default" : "outline"}
              size="sm"
              onClick={() => setEntryType("photo")}
            >
              Foto
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {entryType === "text" ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="content" className="text-sm text-muted-foreground">Text</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">
                  Fotky (můžeš vybrat více)
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                    className="flex-1"
                  />
                  {photoFiles.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setPhotoFiles([]); if (fileRef.current) fileRef.current.value = "" }}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                {photoFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">{photoFiles.length} fotek vybráno</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="caption" className="text-sm text-muted-foreground">
                Popisek (volitelný)
              </label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={entryType === "photo" ? "Popis fotky" : "Popisek k textu"}
              />
            </div>

            {status === "error" && message && (
              <p className="text-sm text-destructive">{message}</p>
            )}

            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Ukládám..." : "Přidat"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <p className="text-center text-muted-foreground">Načítám...</p>
      )}

      {!loading && entries.length === 0 && (
        <p className="pb-10 text-center text-muted-foreground">Zatím žádné záznamy.</p>
      )}

      {photoEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Fotky</h2>
          <PhotoGallery
            photos={photoEntries.map((e) => ({ id: e.id, url: e.photoUrl!, caption: e.caption }))}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {photoEntries.map((e) => (
              <div
                key={e.id}
                className="group relative size-16 shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  src={e.photoUrl!}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDelete(e.id)}
                >
                  <X className="size-5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {textEntries.length > 0 && (
        <div className="flex flex-col gap-4 pb-10">
          <h2 className="text-lg font-semibold text-foreground">Texty</h2>
          {textEntries.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                {e.content && <p className="text-card-foreground/90">{e.content}</p>}
                {e.caption && (
                  <p className="mt-2 text-sm text-muted-foreground">{e.caption}</p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(e.id)}
                  >
                    Smazat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDayEntries
