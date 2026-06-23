import { useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export interface LightboxPhoto {
  id: string
  url: string
  caption: string | null
}

interface Props {
  photos: LightboxPhoto[]
  startIndex: number
  onClose: () => void
}

function Lightbox({ photos, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length)
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, photos.length])

  const photo = photos[index]
  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 hover:text-white"
        onClick={onClose}
        aria-label="Zavřít"
      >
        <X className="size-7" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/70 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i - 1 + photos.length) % photos.length)
            }}
            aria-label="Předchozí"
          >
            <ChevronLeft className="size-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/70 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i + 1) % photos.length)
            }}
            aria-label="Další"
          >
            <ChevronRight className="size-8" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/60">
            {index + 1} / {photos.length}
          </div>
        </>
      )}

      <figure
        className="flex max-h-full max-w-full flex-col items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.caption ?? ""}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
        {photo.caption && (
          <figcaption className="max-w-2xl text-center text-sm text-white/75">
            {photo.caption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

export default Lightbox
