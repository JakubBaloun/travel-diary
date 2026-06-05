import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type TripData } from "@/lib/api"

interface AdminTripListProps {
  trips: TripData[]
  loading: boolean
  error: string
  onCreate: () => void
  onEdit: (trip: TripData) => void
  onDelete: (id: string) => void
  onLogout: () => void
  onOpenDays: (trip: TripData) => void
}

function AdminTripList({ trips, loading, error, onCreate, onEdit, onDelete, onLogout, onOpenDays }: AdminTripListProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Admin
        </h1>
        <div className="flex gap-2">
          <Button onClick={onCreate}>Přidat trip</Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Odhlásit admina
          </Button>
        </div>
      </div>

      {loading && <p className="text-center text-zinc-400">Načítám...</p>}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      {!loading && trips.length === 0 && (
        <p className="text-center text-zinc-500">Zatím žádné tripy.</p>
      )}

      <div className="flex flex-col gap-3 pb-10">
        {trips.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-slate-800">{t.title}</h3>
                <p className="text-sm text-zinc-500">
                  {t.startDate} – {t.endDate}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenDays(t)}
                >
                  Dny
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(t)}
                >
                  Editovat
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(t.id)}
                >
                  Smazat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminTripList
