import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { isAuthenticated, logout } from "@/lib/auth"
import { fetchDaySummaries, type DaySummary } from "@/lib/api"
import { days } from "@/data/itinerary"
import UsaMap from "@/components/map/UsaMap"
import HubModal from "@/components/map/HubModal"
import Hero from "@/components/home/Hero"
import DayCarousel from "@/components/home/DayCarousel"
import TripStatus from "@/components/home/TripStatus"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import { Button } from "@/components/ui/button"

function Mapa() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<Map<number, DaySummary>>(new Map())
  const [error, setError] = useState("")
  const [openHub, setOpenHub] = useState<string | null>(null)

  useEffect(() => {
    fetchDaySummaries()
      .then((list) => {
        const m = new Map<number, DaySummary>()
        for (const s of list) m.set(s.dayNumber, s)
        setSummaries(m)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (!isAuthenticated()) return <Navigate to="/" replace />

  function handlePinClick(dayNumber: number) {
    const s = summaries.get(dayNumber)
    if (!s || !s.published) return
    navigate(`/den/${dayNumber}`)
  }

  function handleLogout() {
    logout()
    localStorage.removeItem("adminAuth")
    navigate("/")
  }

  return (
    <div className="pb-10">
      <div className="relative">
        <Hero />
        <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full bg-black/25 p-0.5 ring-1 ring-white/10 backdrop-blur-md sm:right-5 sm:top-5">
          <ThemeSwitcher triggerClassName="text-white/85 hover:bg-white/15 hover:text-white" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            aria-label="Odhlásit"
            title="Odhlásit"
            className="text-white/85 hover:bg-white/15 hover:text-white"
          >
            <LogOut />
          </Button>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-5xl sm:mt-8">
        <DayCarousel days={days} summaries={summaries} onSelect={handlePinClick} />
        <div className="mt-6 sm:mt-8">
          <TripStatus />
        </div>
        <div className="mt-4 px-4 sm:mt-6 sm:px-6 lg:px-0">
          <UsaMap
            summaries={summaries}
            onPinClick={handlePinClick}
            onHubClick={setOpenHub}
          />
          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
      {openHub && (
        <HubModal
          hub={openHub}
          summaries={summaries}
          onSelect={(n) => {
            setOpenHub(null)
            handlePinClick(n)
          }}
          onClose={() => setOpenHub(null)}
        />
      )}
    </div>
  )
}

export default Mapa
