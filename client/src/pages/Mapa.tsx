import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { isAuthenticated } from "@/lib/auth"
import { fetchDaySummaries, type DaySummary } from "@/lib/api"
import UsaMap from "@/components/map/UsaMap"
import HubModal from "@/components/map/HubModal"

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

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-4 sm:pt-8">
      <UsaMap
        summaries={summaries}
        onPinClick={handlePinClick}
        onHubClick={setOpenHub}
      />
      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
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
