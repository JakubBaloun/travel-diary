import { useEffect, useState } from "react"
import { isAuthenticated } from "@/lib/auth"
import { Navigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { type TripData, fetchTrips } from "@/lib/api"

function Vacations() {
  const [trips, setTrips] = useState<TripData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (!isAuthenticated()) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-5xl px-6 pt-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Seznam
        </h1>
      </div>

      {loading && <p className="text-center text-zinc-400">Načítám...</p>}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <div className="grid gap-8 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((t) => (
          <button key={t.id} className="group block w-full text-left focus-visible:outline-none">
            <Card className="relative overflow-hidden p-0 ring-1 ring-zinc-700/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-zinc-600/50 group-hover:shadow-2xl group-hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-zinc-400">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={t.coverPhotoUrl || `https://picsum.photos/seed/${t.slug}/600/600`}
                  alt={t.title}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent" />
              </div>
              <CardContent className="absolute bottom-0 p-5">
                <h2 className="text-lg font-semibold text-white drop-shadow-sm">
                  {t.title}
                </h2>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Vacations
