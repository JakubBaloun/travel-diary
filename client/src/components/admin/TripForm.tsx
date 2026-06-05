import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type TripData, createTrip, updateTrip } from "@/lib/api"
import DateRangePicker from "@/components/ui/date-range-picker"

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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      const data = {
        title,
        slug,
        description: description || null,
        coverPhotoUrl: coverPhotoUrl || null,
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
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
              <label htmlFor="title" className="text-sm text-zinc-400">
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
              <label htmlFor="slug" className="text-sm text-zinc-400">
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
              <label htmlFor="description" className="text-sm text-zinc-400">
                Popis
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
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
              <label
                htmlFor="coverPhotoUrl"
                className="text-sm text-zinc-400"
              >
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
