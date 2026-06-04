import { isAuthenticated } from "@/lib/auth"
import { Navigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"

const vacations = [
  { id: 1, name: "Řecko 2024", image: "https://picsum.photos/seed/greece/600/600" },
  { id: 2, name: "Itálie 2025", image: "https://picsum.photos/seed/italy/600/600" },
  { id: 3, name: "Španělsko 2025", image: "https://picsum.photos/seed/spain/600/600" },
]

function Vacations() {
  if (!isAuthenticated()) return <Navigate to="/" replace />

  return (
    <div className="min-h-dvh bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
            Seznam
          </h1>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {vacations.map((v) => (
            <button key={v.id} className="group block w-full text-left focus-visible:outline-none">
              <Card className="relative overflow-hidden p-0 ring-1 ring-zinc-700/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-zinc-600/50 group-hover:shadow-2xl group-hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-zinc-400">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent" />
                </div>
                <CardContent className="absolute bottom-0 p-5">
                  <h2 className="text-lg font-semibold text-white drop-shadow-sm">
                    {v.name}
                  </h2>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Vacations
