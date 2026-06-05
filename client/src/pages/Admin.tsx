import { useEffect, useState } from "react"
import { type DayData, type EntryData, type TripData, type TripWithDays, fetchTrips, fetchTripById, fetchDayBySlug, deleteTrip, deleteDay } from "@/lib/api"
import AdminLogin from "@/components/admin/AdminLogin"
import TripForm from "@/components/admin/TripForm"
import AdminTripList from "@/components/admin/AdminTripList"
import AdminDayList from "@/components/admin/AdminDayList"
import DayForm from "@/components/admin/DayForm"
import AdminDayEntries from "@/components/admin/AdminDayEntries"

const ADMIN_PASSWORD = "admin"

type View = "list" | "form" | "days" | "dayForm" | "dayEntries"

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("adminAuth") === "true",
  )
  const [view, setView] = useState<View>("list")
  const [trips, setTrips] = useState<TripData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null)

  const [selectedTrip, setSelectedTrip] = useState<TripWithDays | null>(null)
  const [days, setDays] = useState<DayData[]>([])
  const [daysLoading, setDaysLoading] = useState(false)
  const [daysError, setDaysError] = useState("")
  const [editingDay, setEditingDay] = useState<DayData | null>(null)

  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [entries, setEntries] = useState<EntryData[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState("")

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

  async function openDays(trip: TripData) {
    setDaysLoading(true)
    setDaysError("")
    try {
      const data = await fetchTripById(trip.id, ADMIN_PASSWORD)
      setSelectedTrip(data)
      setDays(data.days)
      setView("days")
    } catch (e) {
      setDaysError(e instanceof Error ? e.message : "Neznámá chyba")
    } finally {
      setDaysLoading(false)
    }
  }

  async function reloadDays() {
    if (!selectedTrip) return
    setDaysLoading(true)
    setDaysError("")
    try {
      const data = await fetchTripById(selectedTrip.id, ADMIN_PASSWORD)
      setDays(data.days)
      setSelectedTrip(data)
    } catch (e) {
      setDaysError(e instanceof Error ? e.message : "Neznámá chyba")
    } finally {
      setDaysLoading(false)
    }
  }

  function openCreateDay() {
    setEditingDay(null)
    setView("dayForm")
  }

  function openEditDay(day: DayData) {
    setEditingDay(day)
    setView("dayForm")
  }

  async function handleDeleteDay(id: string) {
    if (!confirm("Opravdu chceš smazat tento den?")) return

    try {
      await deleteDay(id, ADMIN_PASSWORD)
      await reloadDays()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  async function openDayEntries(day: DayData) {
    if (!selectedTrip) return
    setEntriesLoading(true)
    setEntriesError("")
    try {
      const data = await fetchDayBySlug(selectedTrip.slug, day.dayNumber)
      setSelectedDay(data)
      setEntries(data.entries || [])
      setView("dayEntries")
    } catch (e) {
      setEntriesError(e instanceof Error ? e.message : "Neznámá chyba")
    } finally {
      setEntriesLoading(false)
    }
  }

  async function reloadEntries() {
    if (!selectedTrip || !selectedDay) return
    setEntriesLoading(true)
    setEntriesError("")
    try {
      const data = await fetchDayBySlug(selectedTrip.slug, selectedDay.dayNumber)
      setSelectedDay(data)
      setEntries(data.entries || [])
    } catch (e) {
      setEntriesError(e instanceof Error ? e.message : "Neznámá chyba")
    } finally {
      setEntriesLoading(false)
    }
  }

  function backToDays() {
    setView("days")
    setSelectedDay(null)
    setEntries([])
  }

  function backToList() {
    setView("list")
    setSelectedTrip(null)
    setDays([])
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

  if (view === "days" && selectedTrip) {
    return (
      <AdminDayList
        trip={selectedTrip}
        days={days}
        loading={daysLoading}
        error={daysError}
        onCreate={openCreateDay}
        onEdit={openEditDay}
        onDelete={handleDeleteDay}
        onOpenEntries={openDayEntries}
        onBack={backToList}
        adminKey={ADMIN_PASSWORD}
        onDaysChanged={reloadDays}
      />
    )
  }

  if (view === "dayEntries" && selectedDay) {
    return (
      <AdminDayEntries
        day={selectedDay}
        entries={entries}
        loading={entriesLoading}
        adminKey={ADMIN_PASSWORD}
        onBack={backToDays}
        onEntriesChanged={reloadEntries}
      />
    )
  }

  if (view === "dayForm" && selectedTrip) {
    return (
      <DayForm
        tripId={selectedTrip.id}
        tripStartDate={selectedTrip.startDate}
        nextDayNumber={
          selectedTrip.days.length > 0
            ? Math.max(...selectedTrip.days.map((d) => d.dayNumber)) + 1
            : 1
        }
        editingDay={editingDay}
        adminKey={ADMIN_PASSWORD}
        onSaved={async () => { await reloadDays(); setView("days") }}
        onCancel={() => setView("days")}
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
      onOpenDays={openDays}
    />
  )
}

export default Admin
