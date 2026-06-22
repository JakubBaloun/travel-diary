import { useState } from "react"
import { type PhotoData } from "@/lib/api"
import Lightbox from "./Lightbox"

interface Props {
  photos: PhotoData[]
}

interface PhotoTileProps {
  photo: PhotoData
  className?: string
  onClick: () => void
}

function PhotoTile({ photo, className, onClick }: PhotoTileProps) {
  return (
    <figure className={className}>
      <button
        onClick={onClick}
        className="group block w-full overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={photo.caption ?? "Otevřít fotku"}
      >
        <img
          src={photo.urlMed}
          srcSet={`${photo.urlThumb} 400w, ${photo.urlMed} 1000w, ${photo.url} 1800w`}
          sizes="(min-width: 1024px) 800px, (min-width: 640px) 600px, 100vw"
          alt={photo.caption ?? ""}
          loading="lazy"
          decoding="async"
          width={photo.width}
          height={photo.height}
          className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </button>
      {photo.caption && (
        <figcaption className="mt-1.5 px-1 text-xs italic text-muted-foreground">
          {photo.caption}
        </figcaption>
      )}
    </figure>
  )
}

function EditorialGallery({ photos }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (photos.length === 0) return null

  // Walk photos in order, group consecutive non-wide into pairs.
  type Row = { kind: "wide"; photo: PhotoData } | { kind: "pair"; photos: PhotoData[] }
  const rows: Row[] = []
  let buffer: PhotoData[] = []
  for (const p of photos) {
    if (p.wide) {
      if (buffer.length) {
        rows.push({ kind: "pair", photos: buffer })
        buffer = []
      }
      rows.push({ kind: "wide", photo: p })
    } else {
      buffer.push(p)
      if (buffer.length === 2) {
        rows.push({ kind: "pair", photos: buffer })
        buffer = []
      }
    }
  }
  if (buffer.length) rows.push({ kind: "pair", photos: buffer })

  function open(photoId: string) {
    const idx = photos.findIndex((p) => p.id === photoId)
    if (idx >= 0) setLightboxIdx(idx)
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:gap-4">
        {rows.map((row, i) =>
          row.kind === "wide" ? (
            <PhotoTile
              key={row.photo.id}
              photo={row.photo}
              onClick={() => open(row.photo.id)}
            />
          ) : (
            <div
              key={`pair-${i}`}
              className={
                row.photos.length === 2
                  ? "grid grid-cols-2 gap-3 sm:gap-4"
                  : "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              }
            >
              {row.photos.map((p) => (
                <PhotoTile key={p.id} photo={p} onClick={() => open(p.id)} />
              ))}
            </div>
          ),
        )}
      </div>
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  )
}

export default EditorialGallery
