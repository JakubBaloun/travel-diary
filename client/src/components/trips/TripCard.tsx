import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { type TripData } from "@/lib/api"

interface TripCardProps {
  trip: TripData
}

function TripCard({ trip }: TripCardProps) {
  const navigate = useNavigate()

  return (
    <button
      className="group block w-full text-left focus-visible:outline-none"
      onClick={() => navigate(`/trips/${trip.slug}`)}
    >
      <Card className="relative overflow-hidden p-0 ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-ring/60 group-hover:shadow-2xl group-hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-ring">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={
              trip.coverPhotoUrl ||
              `https://picsum.photos/seed/${trip.slug}/600/600`
            }
            alt={trip.title}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-image-overlay" />
        </div>
        <CardContent className="absolute bottom-0 p-5">
          <h2 className="text-lg font-semibold text-white drop-shadow-md">
            {trip.title}
          </h2>
        </CardContent>
      </Card>
    </button>
  )
}

export default TripCard
