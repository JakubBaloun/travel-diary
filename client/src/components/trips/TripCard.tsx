import { Card, CardContent } from "@/components/ui/card"
import { type TripData } from "@/lib/api"

interface TripCardProps {
  trip: TripData
}

function TripCard({ trip }: TripCardProps) {
  return (
    <button className="group block w-full text-left focus-visible:outline-none">
      <Card className="relative overflow-hidden p-0 ring-1 ring-zinc-700/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-zinc-600/50 group-hover:shadow-2xl group-hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-zinc-400">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={trip.coverPhotoUrl || `https://picsum.photos/seed/${trip.slug}/600/600`}
            alt={trip.title}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent" />
        </div>
        <CardContent className="absolute bottom-0 p-5">
          <h2 className="text-lg font-semibold text-white drop-shadow-sm">
            {trip.title}
          </h2>
        </CardContent>
      </Card>
    </button>
  )
}

export default TripCard
