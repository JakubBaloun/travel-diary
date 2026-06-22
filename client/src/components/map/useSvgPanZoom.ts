import { type RefObject, useCallback, useEffect, useRef, useState } from "react"

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

interface Options {
  /** Ref to the <svg> element. Provided by caller so the hook itself doesn't return a ref. */
  svgRef: RefObject<SVGSVGElement | null>
  base: ViewBox
  /** Minimum zoom level (1 = no zoom out below original). */
  minZoom?: number
  /** Maximum zoom level (e.g. 8 = up to 8× zoomed in). */
  maxZoom?: number
  /** A movement larger than this many CSS pixels turns a tap into a pan. */
  panThreshold?: number
}

export function useSvgPanZoom({
  svgRef,
  base,
  minZoom = 1,
  maxZoom = 8,
  panThreshold = 6,
}: Options) {
  const [vb, setVb] = useState<ViewBox>(base)

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gestureRef = useRef<{
    startVb: ViewBox
    startCenter: { x: number; y: number }
    startDistance: number
  } | null>(null)
  const movedRef = useRef(false)
  const moveStartRef = useRef<{ x: number; y: number } | null>(null)

  const clamp = useCallback(
    (v: ViewBox): ViewBox => {
      const minW = base.w / maxZoom
      const maxW = base.w / minZoom
      const w = Math.min(Math.max(v.w, minW), maxW)
      const h = w * (base.h / base.w)
      // Keep the visible viewport fully inside the map — no white-space drift.
      // When the viewport equals the map (zoomed out fully) the only valid offset is (0, 0).
      const maxX = Math.max(0, base.w - w)
      const maxY = Math.max(0, base.h - h)
      return {
        x: Math.min(Math.max(v.x, 0), maxX),
        y: Math.min(Math.max(v.y, 0), maxY),
        w,
        h,
      }
    },
    [base, minZoom, maxZoom],
  )

  function computeGestureState() {
    const pts = Array.from(pointersRef.current.values())
    if (pts.length === 0) return null
    if (pts.length === 1) return { center: pts[0], distance: 0 }
    const [a, b] = pts
    return {
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(b.x - a.x, b.y - a.y),
    }
  }

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      moveStartRef.current = { x: e.clientX, y: e.clientY }
      movedRef.current = false
      const gs = computeGestureState()
      gestureRef.current = gs
        ? { startVb: vb, startCenter: gs.center, startDistance: gs.distance }
        : null
    },
    [vb],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!pointersRef.current.has(e.pointerId)) return
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (moveStartRef.current) {
        const dx = e.clientX - moveStartRef.current.x
        const dy = e.clientY - moveStartRef.current.y
        if (Math.hypot(dx, dy) > panThreshold) movedRef.current = true
      }

      const gs = computeGestureState()
      const last = gestureRef.current
      const el = svgRef.current
      if (!gs || !last || !el) return

      const rect = el.getBoundingClientRect()
      const scaleX = last.startVb.w / rect.width
      const scaleY = last.startVb.h / rect.height
      const dCx = gs.center.x - last.startCenter.x
      const dCy = gs.center.y - last.startCenter.y

      let newVb: ViewBox = {
        x: last.startVb.x - dCx * scaleX,
        y: last.startVb.y - dCy * scaleY,
        w: last.startVb.w,
        h: last.startVb.h,
      }

      if (last.startDistance > 0 && gs.distance > 0) {
        const ratio = gs.distance / last.startDistance
        const centerVB = {
          x: newVb.x + ((gs.center.x - rect.left) / rect.width) * newVb.w,
          y: newVb.y + ((gs.center.y - rect.top) / rect.height) * newVb.h,
        }
        newVb = {
          x: centerVB.x - (centerVB.x - newVb.x) / ratio,
          y: centerVB.y - (centerVB.y - newVb.y) / ratio,
          w: newVb.w / ratio,
          h: newVb.h / ratio,
        }
      }

      setVb(clamp(newVb))
    },
    [clamp, panThreshold, svgRef],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size === 0) {
        moveStartRef.current = null
        gestureRef.current = null
        return
      }
      const gs = computeGestureState()
      gestureRef.current = gs
        ? { startVb: vb, startCenter: gs.center, startDistance: gs.distance }
        : null
    },
    [vb],
  )

  // Wheel zoom uses a manual listener so we can preventDefault (React's wheel is passive).
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18
      const rect = svg!.getBoundingClientRect()
      const centerVB = {
        x: vb.x + ((e.clientX - rect.left) / rect.width) * vb.w,
        y: vb.y + ((e.clientY - rect.top) / rect.height) * vb.h,
      }
      setVb(
        clamp({
          x: centerVB.x - (centerVB.x - vb.x) / factor,
          y: centerVB.y - (centerVB.y - vb.y) / factor,
          w: vb.w / factor,
          h: vb.h / factor,
        }),
      )
    }
    svg.addEventListener("wheel", handleWheel, { passive: false })
    return () => svg.removeEventListener("wheel", handleWheel)
  }, [vb, clamp, svgRef])

  const zoomBy = useCallback(
    (factor: number) => {
      const cx = vb.x + vb.w / 2
      const cy = vb.y + vb.h / 2
      setVb(
        clamp({
          x: cx - vb.w / factor / 2,
          y: cy - vb.h / factor / 2,
          w: vb.w / factor,
          h: vb.h / factor,
        }),
      )
    },
    [vb, clamp],
  )

  return {
    viewBox: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    didMove: () => movedRef.current,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    zoomIn: () => zoomBy(1.5),
    zoomOut: () => zoomBy(1 / 1.5),
    reset: () => setVb(base),
    isZoomed: vb.w < base.w * 0.99,
  }
}
