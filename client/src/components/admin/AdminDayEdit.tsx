import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  MessageSquare,
  Maximize2,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  deletePhoto,
  fetchAdminDay,
  reorderDayPhotos,
  updateDayContent,
  updatePhoto,
  uploadDayPhoto,
  type DayData,
  type PhotoData,
} from "@/lib/api"
import { getDay } from "@/data/itinerary"
import { formatDate } from "@/lib/utils"

interface Props {
  dayNumber: number
  onBack: () => void
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

function AdminDayEdit({ dayNumber, onBack }: Props) {
  const itinerary = getDay(dayNumber)
  const [day, setDay] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [story, setStory] = useState("")
  const [storyStatus, setStoryStatus] = useState<SaveStatus>("idle")
  const lastSavedStory = useRef<string>("")

  const [uploadActive, setUploadActive] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const [captionEditId, setCaptionEditId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState("")

  useEffect(() => {
    let aborted = false
    fetchAdminDay(dayNumber)
      .then((d) => {
        if (aborted) return
        setDay(d)
        setStory(d.story ?? "")
        lastSavedStory.current = d.story ?? ""
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
  }, [dayNumber])

  // Debounced autosave for story.
  useEffect(() => {
    if (!day) return
    if (story === lastSavedStory.current) return
    setStoryStatus("saving")
    const t = setTimeout(async () => {
      try {
        const updated = await updateDayContent(dayNumber, { story: story || "" })
        lastSavedStory.current = updated.story ?? ""
        setDay((d) => (d ? { ...d, story: updated.story } : d))
        setStoryStatus("saved")
        setTimeout(() => setStoryStatus((s) => (s === "saved" ? "idle" : s)), 1500)
      } catch {
        setStoryStatus("error")
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [story, day, dayNumber])

  if (!itinerary) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" /> Zpět
        </Button>
        <p className="mt-6 text-center text-destructive">Neznámý den.</p>
      </div>
    )
  }

  async function togglePublished() {
    if (!day) return
    try {
      const updated = await updateDayContent(dayNumber, { published: !day.published })
      setDay(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    }
  }

  async function toggleHighlight() {
    if (!day) return
    try {
      const updated = await updateDayContent(dayNumber, { highlight: !day.highlight })
      setDay(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    setUploadTotal(arr.length)
    setUploadActive(arr.length)
    setUploadErrors([])
    for (const file of arr) {
      try {
        const photo = await uploadDayPhoto(dayNumber, file)
        setDay((d) => (d ? { ...d, photos: [...d.photos, photo] } : d))
      } catch (e) {
        setUploadErrors((es) => [...es, `${file.name}: ${e instanceof Error ? e.message : "chyba"}`])
      } finally {
        setUploadActive((c) => c - 1)
      }
    }
    if (fileRef.current) fileRef.current.value = ""
    setTimeout(() => {
      setUploadTotal(0)
    }, 1200)
  }

  async function movePhoto(photoId: string, direction: -1 | 1) {
    if (!day) return
    const idx = day.photos.findIndex((p) => p.id === photoId)
    const target = idx + direction
    if (idx < 0 || target < 0 || target >= day.photos.length) return
    const newPhotos = [...day.photos]
    ;[newPhotos[idx], newPhotos[target]] = [newPhotos[target], newPhotos[idx]]
    const reindexed = newPhotos.map((p, i) => ({ ...p, sortOrder: i }))
    setDay({ ...day, photos: reindexed })
    try {
      await reorderDayPhotos(
        dayNumber,
        reindexed.map((p) => p.id),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reorder selhal")
      // refetch on failure
      const fresh = await fetchAdminDay(dayNumber)
      setDay(fresh)
    }
  }

  async function toggleWide(photo: PhotoData) {
    try {
      const updated = await updatePhoto(photo.id, { wide: !photo.wide })
      setDay((d) =>
        d ? { ...d, photos: d.photos.map((p) => (p.id === photo.id ? updated : p)) } : d,
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    }
  }

  async function setHero(photo: PhotoData) {
    if (!day) return
    try {
      const isCurrentHero = day.heroPhotoId === photo.id
      const updated = await updateDayContent(
        dayNumber,
        isCurrentHero ? { clearHeroPhoto: true } : { heroPhotoId: photo.id },
      )
      setDay(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    }
  }

  async function removePhoto(photo: PhotoData) {
    if (!confirm("Smazat fotku?")) return
    try {
      await deletePhoto(photo.id)
      setDay((d) =>
        d
          ? {
              ...d,
              photos: d.photos.filter((p) => p.id !== photo.id),
              heroPhotoId: d.heroPhotoId === photo.id ? null : d.heroPhotoId,
            }
          : d,
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    }
  }

  async function saveCaption(photo: PhotoData) {
    try {
      const next = captionDraft.trim()
      const updated = await updatePhoto(
        photo.id,
        next === "" ? { clearCaption: true } : { caption: next },
      )
      setDay((d) =>
        d ? { ...d, photos: d.photos.map((p) => (p.id === photo.id ? updated : p)) } : d,
      )
      setCaptionEditId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Chyba")
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-3 pb-32 pt-3 sm:px-6 sm:pt-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          Zpět
        </Button>
        <a
          href={`/den/${dayNumber}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Náhled"
        >
          <ExternalLink className="size-4" />
          Náhled
        </a>
      </header>

      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-badge text-base font-bold text-badge-foreground">
          {itinerary.dayNumber}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {formatDate(itinerary.date)} · {itinerary.place}
          </p>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="mr-1.5">{itinerary.emoji}</span>
            {itinerary.title}
          </h1>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Načítám…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {day && (
        <>
          {/* Toggles */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={togglePublished}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                day.published
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {day.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {day.published ? "Publikováno" : "Nepublikováno"}
            </button>
            <button
              onClick={toggleHighlight}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                day.highlight
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <Sparkles className="size-4" />
              {day.highlight ? "Highlight" : "Nezvýrazněno"}
            </button>
          </div>

          {/* Story */}
          <section className="mb-6">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="story" className="text-sm font-medium">
                Story
              </label>
              <span className="text-xs text-muted-foreground">
                {storyStatus === "saving" && "Ukládám…"}
                {storyStatus === "saved" && "Uloženo ✓"}
                {storyStatus === "error" && (
                  <span className="text-destructive">Chyba ukládání</span>
                )}
              </span>
            </div>
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              placeholder="Co se dnes stalo…"
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Podporuje **tučně**, *kurzíva*, prázdný řádek = nový odstavec.
            </p>
          </section>

          {/* Photos */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">
                Fotky <span className="text-muted-foreground">({day.photos.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                {uploadTotal > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nahrávám {uploadTotal - uploadActive}/{uploadTotal}…
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadActive > 0}
                >
                  <ImagePlus className="mr-1 size-4" />
                  Přidat
                </Button>
              </div>
            </div>

            {uploadErrors.length > 0 && (
              <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {uploadErrors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}

            {day.photos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground">
                Žádné fotky. Klikni „Přidat" a vyber z mobilu.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {day.photos.map((photo, idx) => {
                  const isHero = day.heroPhotoId === photo.id
                  const isFirst = idx === 0
                  const isLast = idx === day.photos.length - 1
                  return (
                    <li
                      key={photo.id}
                      className="rounded-xl border border-surface-border bg-card p-2"
                    >
                      <div className="flex items-start gap-2">
                        <img
                          src={photo.urlThumb}
                          alt=""
                          loading="lazy"
                          className="size-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <IconBtn
                              label={isHero ? "Odstranit jako hero" : "Nastavit jako hero"}
                              active={isHero}
                              onClick={() => setHero(photo)}
                            >
                              <Star className={`size-4 ${isHero ? "fill-current" : ""}`} />
                            </IconBtn>
                            <IconBtn
                              label="Wide layout"
                              active={photo.wide}
                              onClick={() => toggleWide(photo)}
                            >
                              <Maximize2 className="size-4" />
                            </IconBtn>
                            <IconBtn
                              label="Posunout nahoru"
                              disabled={isFirst}
                              onClick={() => movePhoto(photo.id, -1)}
                            >
                              <ArrowUp className="size-4" />
                            </IconBtn>
                            <IconBtn
                              label="Posunout dolů"
                              disabled={isLast}
                              onClick={() => movePhoto(photo.id, 1)}
                            >
                              <ArrowDown className="size-4" />
                            </IconBtn>
                            <IconBtn
                              label="Popisek"
                              onClick={() => {
                                setCaptionEditId(photo.id)
                                setCaptionDraft(photo.caption ?? "")
                              }}
                            >
                              <MessageSquare className="size-4" />
                            </IconBtn>
                            <IconBtn
                              label="Smazat"
                              destructive
                              onClick={() => removePhoto(photo)}
                            >
                              <Trash2 className="size-4" />
                            </IconBtn>
                          </div>

                          {captionEditId === photo.id ? (
                            <div className="flex flex-col gap-1.5">
                              <textarea
                                value={captionDraft}
                                onChange={(e) => setCaptionDraft(e.target.value)}
                                rows={2}
                                placeholder="Popisek fotky…"
                                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none dark:bg-input/30"
                              />
                              <div className="flex gap-1.5">
                                <Button size="sm" onClick={() => saveCaption(photo)}>
                                  Uložit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCaptionEditId(null)}
                                >
                                  Zrušit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            photo.caption && (
                              <p className="text-xs italic text-muted-foreground">
                                {photo.caption}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  active,
  disabled,
  destructive,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  destructive?: boolean
}) {
  const base =
    "flex size-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
  const tone = destructive
    ? "text-destructive hover:bg-destructive/10"
    : active
    ? "bg-brand text-brand-foreground"
    : "text-muted-foreground hover:bg-muted hover:text-foreground"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  )
}

export default AdminDayEdit
