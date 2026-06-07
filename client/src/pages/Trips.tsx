import { useEffect, useState } from "react"
import { isAuthenticated } from "@/lib/auth"
import { Navigate } from "react-router-dom"
import { type TripData, fetchTrips } from "@/lib/api"
import TripCard from "@/components/trips/TripCard"

function Trips() {
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
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Seznam
        </h1>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground">Načítám...</p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-8 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </div>
    </div>
  )
}

export default Trips
