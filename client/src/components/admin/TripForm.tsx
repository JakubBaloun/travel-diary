import { type FormEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type TripData, createTrip, updateTrip, uploadPhoto } from "@/lib/api"
import DateRangePicker from "@/components/ui/date-range-picker"
import { ImagePlus, Replace, Trash2 } from "lucide-react"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface TripFormProps {
  editingTrip: TripData | null
  adminKey: string
  onSaved: () => void
  onCancel: () => void
}

function TripForm({ editingTrip, adminKey, onSaved, onCancel }: TripFormProps) {
  const [editingId] = useState<string | null>(editingTrip?.id ?? null)
  const [title, setTitle] = useState(editingTrip?.title ?? "")
  const [slug, setSlug] = useState(editingTrip?.slug ?? "")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState(editingTrip?.startDate ?? "")
  const [endDate, setEndDate] = useState(editingTrip?.endDate ?? "")
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(editingTrip?.coverPhotoUrl ?? "")
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

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
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
        finalPhotoUrl = await uploadPhoto(coverFile, adminKey)
      }

      const data = {
        title,
        slug,
        description: description || null,
        coverPhotoUrl: finalPhotoUrl,
        startDate,
        endDate,
      }

      if (editingId) {
        await updateTrip(editingId, data, adminKey)
      } else {
        await createTrip(data, adminKey)
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
          {editingId ? "Upravit trip" : "Nový trip"}
        </h1>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Zpět
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Upravit trip" : "Vytvořit trip"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm text-muted-foreground">
                Název *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="slug" className="text-sm text-muted-foreground">
                Slug *
              </label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm text-muted-foreground">
                Popis
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
              />
            </div>

            <DateRangePicker
              value={{ from: startDate, to: endDate }}
              onChange={({ from, to }) => {
                setStartDate(from)
                setEndDate(to)
              }}
            />

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
                    : "Vytvořit trip"}
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

export default TripForm
