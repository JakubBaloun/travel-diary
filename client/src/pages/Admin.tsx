import { useEffect, useState } from "react"
import { type TripData, fetchTrips, deleteTrip } from "@/lib/api"
import AdminLogin from "@/components/admin/AdminLogin"
import TripForm from "@/components/admin/TripForm"
import AdminTripList from "@/components/admin/AdminTripList"

const ADMIN_PASSWORD = "admin"

type View = "list" | "form"

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("adminAuth") === "true",
  )
  const [view, setView] = useState<View>("list")
  const [trips, setTrips] = useState<TripData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null)

  useEffect(() => {
    if (!authenticated) return
    loadTrips()
  }, [authenticated])

  async function loadTrips() {
    setLoading(true)
    setError("")
    try {
      const data = await fetchTrips()
      setTrips(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neznámá chyba")
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingTrip(null)
    setView("form")
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu chceš smazat tento trip?")) return

    try {
      await deleteTrip(id, ADMIN_PASSWORD)
      await loadTrips()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />
  }

  if (view === "form") {
    return (
      <TripForm
        editingTrip={editingTrip}
        adminKey={ADMIN_PASSWORD}
        onSaved={async () => { await loadTrips(); setView("list") }}
        onCancel={() => setView("list")}
      />
    )
  }

  return (
    <AdminTripList
      trips={trips}
      loading={loading}
      error={error}
      onCreate={openCreate}
      onEdit={(trip) => { setEditingTrip(trip); setView("form") }}
      onDelete={handleDelete}
      onLogout={() => { localStorage.removeItem("adminAuth"); setAuthenticated(false); setView("list") }}
    />
  )
}

export default Admin
