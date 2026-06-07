import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { type TripWithDays, fetchTripBySlug } from "@/lib/api"
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

function TripDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripWithDays | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetchTripBySlug(slug)
      .then(setTrip)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!isAuthenticated()) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-4xl px-6 pt-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/trips")}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Zpět
      </Button>

      {loading && (
        <p className="text-center text-muted-foreground">Načítám...</p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {trip && (
        <>
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {trip.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </p>
            {trip.description && (
              <p className="mt-4 text-foreground/85">{trip.description}</p>
            )}
          </div>

          {trip.days.length === 0 ? (
            <p className="text-center text-muted-foreground">Zatím žádné dny.</p>
          ) : (
            <div className="grid gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
              {trip.days.map((d) => (
                <button
                  key={d.id}
                  className="group block w-full text-left focus-visible:outline-none"
                  onClick={() =>
                    navigate(`/trips/${trip.slug}/days/${d.dayNumber}`)
                  }
                >
                  <Card className="overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:ring-ring/60 group-hover:shadow-lg group-hover:shadow-black/20">
                    <div className="aspect-[3/1] overflow-hidden">
                      <img
                        src={
                          d.coverPhotoUrl ||
                          trip.coverPhotoUrl ||
                          `https://picsum.photos/seed/${trip.slug}-${d.dayNumber}/600/200`
                        }
                        alt=""
                        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                      />
                    </div>
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-badge text-sm font-bold text-badge-foreground">
                          {d.dayNumber}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-card-foreground">
                            {d.title || `Den ${d.dayNumber}`}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(d.date)}
                          </p>
                        </div>
                      </div>
                      {d.summary && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {d.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TripDetail;
