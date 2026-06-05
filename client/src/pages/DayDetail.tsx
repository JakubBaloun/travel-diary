import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { isAuthenticated } from "@/lib/auth"
import { Navigate } from "react-router-dom"
import { type DayWithEntries, fetchDayBySlug } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import PhotoGallery from "@/components/PhotoGallery"
import { ArrowLeft } from "lucide-react"

function DayDetail() {
  const { slug, dayNumber } = useParams<{ slug: string; dayNumber: string }>()
  const navigate = useNavigate()
  const [day, setDay] = useState<DayWithEntries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!slug || !dayNumber) return
    fetchDayBySlug(slug, Number(dayNumber))
      .then(setDay)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug, dayNumber])

  if (!isAuthenticated()) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-3xl px-6 pt-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/trips/${slug}`)}
        className="mb-6 text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="mr-1 size-4" />
        Zpět na trip
      </Button>

      {loading && <p className="text-center text-zinc-400">Načítám...</p>}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      {day && (
        <>
          {day.coverPhotoUrl && (
            <div className="mb-8 overflow-hidden rounded-xl">
              <img
                src={day.coverPhotoUrl}
                alt=""
                className="aspect-[3/1] w-full object-cover"
              />
            </div>
          )}

          <div className="mb-10">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-zinc-700/50 text-lg font-bold text-zinc-200">
                {day.dayNumber}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                  {day.title || `Den ${day.dayNumber}`}
                </h1>
                <p className="text-sm text-zinc-500">{formatDate(day.date)}</p>
              </div>
            </div>
            {day.summary && (
              <p className="mt-4 text-zinc-300">{day.summary}</p>
            )}
          </div>

          {(!day.entries || day.entries.length === 0) ? (
            <p className="text-center text-zinc-500">Zatím žádné záznamy.</p>
          ) : (
            <div className="pb-10">
              {(() => {
                const photos = day.entries!.filter((e) => e.type === "photo")
                const texts = day.entries!.filter((e) => e.type === "text")

                return (
                  <>
                    {photos.length > 0 && (
                      <div className="mb-8">
                        <PhotoGallery
                          photos={photos.map((e) => ({ id: e.id, url: e.photoUrl!, caption: e.caption }))}
                        />
                      </div>
                    )}
                    {texts.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {texts.map((e) => (
                          <Card key={e.id}>
                            <CardContent className="p-4">
                              {e.content && <p className="text-zinc-300">{e.content}</p>}
                              {e.caption && (
                                <p className="mt-2 text-sm text-zinc-500">{e.caption}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DayDetail
