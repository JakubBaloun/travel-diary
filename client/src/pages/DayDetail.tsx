import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Zpět na trip
      </Button>

      {loading && (
        <p className="text-center text-muted-foreground">Načítám...</p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

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
              <span className="flex size-12 items-center justify-center rounded-full bg-badge text-lg font-bold text-badge-foreground">
                {day.dayNumber}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {day.title || `Den ${day.dayNumber}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(day.date)}
                </p>
              </div>
            </div>
            {day.summary && (
              <p className="mt-4 text-foreground/85">{day.summary}</p>
            )}
          </div>

          {(!day.entries || day.entries.length === 0) ? (
            <p className="text-center text-muted-foreground">
              Zatím žádné záznamy.
            </p>
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
                          photos={photos.map((e) => ({
                            id: e.id,
                            url: e.photoUrl!,
                            caption: e.caption,
                          }))}
                        />
                      </div>
                    )}
                    {texts.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {texts.map((e) => (
                          <Card key={e.id}>
                            <CardContent className="p-4">
                              {e.content && (
                                <p className="text-card-foreground/90">
                                  {e.content}
                                </p>
                              )}
                              {e.caption && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {e.caption}
                                </p>
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
