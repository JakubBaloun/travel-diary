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
  /** Initial zoom factor applied to `base` on mount and on reset (1 = no zoom). */
  initialZoom?: number
  /** A movement larger than this many CSS pixels turns a tap into a pan. */
  panThreshold?: number
}

function vbToString(v: ViewBox) {
  return `${v.x} ${v.y} ${v.w} ${v.h}`
}

export function useSvgPanZoom({
  svgRef,
  base,
  minZoom = 1,
  maxZoom = 8,
  initialZoom = 1,
  panThreshold = 6,
}: Options) {
  const initial: ViewBox = {
    w: base.w / initialZoom,
    h: base.h / initialZoom,
    x: base.x + (base.w - base.w / initialZoom) / 2,
    y: base.y + (base.h - base.h / initialZoom) / 2,
  }
  const [vb, setVb] = useState<ViewBox>(initial)

  // Source of truth for the "current" viewBox during a gesture. State `vb`
  // lags behind during pan (we only commit at gesture end) so anything that
  // needs the live value reads this ref.
  const liveVbRef = useRef<ViewBox>(initial)

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gestureRef = useRef<{
    startVb: ViewBox
    startCenter: { x: number; y: number }
    startDistance: number
  } | null>(null)
  const movedRef = useRef(false)
  const moveStartRef = useRef<{ x: number; y: number } | null>(null)

  // rAF coalescing for high-frequency pointermove events.
  const rafIdRef = useRef<number | null>(null)
  const pendingVbRef = useRef<ViewBox | null>(null)

  const clamp = useCallback(
    (v: ViewBox): ViewBox => {
      const minW = base.w / maxZoom
      const maxW = base.w / minZoom
      const w = Math.min(Math.max(v.w, minW), maxW)
      const h = w * (base.h / base.w)
      // Keep the visible viewport fully inside the map — no white-space drift.
      const maxX = Math.max(base.x, base.x + base.w - w)
      const maxY = Math.max(base.y, base.y + base.h - h)
      return {
        x: Math.min(Math.max(v.x, base.x), maxX),
        y: Math.min(Math.max(v.y, base.y), maxY),
        w,
        h,
      }
    },
    [base, minZoom, maxZoom],
  )

  // Live update: writes the viewBox attribute directly on the SVG element and
  // coalesces multiple updates per animation frame. Skips React entirely, so
  // filter re-rasterization is the only cost during a drag.
  const applyVbLive = useCallback(
    (newVb: ViewBox) => {
      const clamped = clamp(newVb)
      pendingVbRef.current = clamped
      if (rafIdRef.current != null) return
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        const pending = pendingVbRef.current
        pendingVbRef.current = null
        if (!pending) return
        liveVbRef.current = pending
        const el = svgRef.current
        if (el) el.setAttribute("viewBox", vbToString(pending))
      })
    },
    [clamp, svgRef],
  )

  // Commit: cancels any pending rAF and pushes the final viewBox into React state
  // so the rest of the tree (e.g. `isZoomed`) reflects it.
  const commitVb = useCallback((newVb: ViewBox) => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    pendingVbRef.current = null
    liveVbRef.current = newVb
    setVb(newVb)
  }, [])

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

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
        ? {
            startVb: liveVbRef.current,
            startCenter: gs.center,
            startDistance: gs.distance,
          }
        : null
    },
    [],
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

      applyVbLive(newVb)
    },
    [applyVbLive, panThreshold, svgRef],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size === 0) {
        moveStartRef.current = null
        gestureRef.current = null
        // Sync React state to the final live position so isZoomed / consumers update.
        commitVb(liveVbRef.current)
        return
      }
      const gs = computeGestureState()
      gestureRef.current = gs
        ? {
            startVb: liveVbRef.current,
            startCenter: gs.center,
            startDistance: gs.distance,
          }
        : null
    },
    [commitVb],
  )

  // Wheel zoom uses a manual listener so we can preventDefault (React's wheel is passive).
  // Wheel events have no "end" event, so we debounce a commit to React state so
  // isZoomed / zoom-out enabled flip after the user stops scrolling.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let commitTimeoutId: number | undefined
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18
      const current = liveVbRef.current
      const rect = svg!.getBoundingClientRect()
      const centerVB = {
        x: current.x + ((e.clientX - rect.left) / rect.width) * current.w,
        y: current.y + ((e.clientY - rect.top) / rect.height) * current.h,
      }
      applyVbLive({
        x: centerVB.x - (centerVB.x - current.x) / factor,
        y: centerVB.y - (centerVB.y - current.y) / factor,
        w: current.w / factor,
        h: current.h / factor,
      })
      window.clearTimeout(commitTimeoutId)
      commitTimeoutId = window.setTimeout(() => setVb(liveVbRef.current), 120)
    }
    svg.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      window.clearTimeout(commitTimeoutId)
      svg.removeEventListener("wheel", handleWheel)
    }
  }, [applyVbLive, svgRef])

  const zoomBy = useCallback(
    (factor: number) => {
      const current = liveVbRef.current
      const cx = current.x + current.w / 2
      const cy = current.y + current.h / 2
      commitVb(
        clamp({
          x: cx - current.w / factor / 2,
          y: cy - current.h / factor / 2,
          w: current.w / factor,
          h: current.h / factor,
        }),
      )
    },
    [clamp, commitVb],
  )

  return {
    viewBox: vbToString(vb),
    didMove: () => movedRef.current,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    zoomIn: () => zoomBy(1.5),
    zoomOut: () => zoomBy(1 / 1.5),
    reset: () => commitVb(initial),
    isZoomed: vb.w < initial.w * 0.99,
  }
}
