import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface GalleryPhoto {
  id: string
  url: string
  caption: string | null
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[]
}

function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={photo.url}
              alt={photo.caption || ""}
              className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{photo.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 text-white/70 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="size-8" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/70 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev - 1 + photos.length) % photos.length : 0,
                  )
                }}
              >
                <ChevronLeft className="size-8" />
              </button>
              <button
                className="absolute right-4 text-white/70 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % photos.length : 0,
                  )
                }}
              >
                <ChevronRight className="size-8" />
              </button>
              <div className="absolute bottom-4 text-sm text-white/60">
                {lightboxIndex + 1} / {photos.length}
              </div>
            </>
          )}

          <img
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].caption || ""}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default PhotoGallery
