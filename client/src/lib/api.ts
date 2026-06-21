import { getReaderToken, getAdminToken, logout, logoutAdmin } from "./auth"

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api"

type AuthMode = "reader" | "admin"

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | object | null
  auth?: AuthMode
}

interface ServerErrorBody {
  statusCode?: number
  message?: string
  error?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

function authHeader(mode: AuthMode): Record<string, string> {
  const token = mode === "admin" ? getAdminToken() : getReaderToken() ?? getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorized(mode: AuthMode) {
  if (typeof window === "undefined") return
  const path = window.location.pathname

  if (mode === "admin") {
    logoutAdmin()
    if (!path.startsWith("/admin")) window.location.assign("/admin")
    return
  }

  if (!path.startsWith("/admin")) {
    logout()
    if (path !== "/") window.location.assign("/")
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `HTTP ${res.status}`
  let code = res.statusText || "HttpError"
  try {
    const data = (await res.json()) as ServerErrorBody
    if (data?.message) message = data.message
    if (data?.error) code = data.error
  } catch {
    try {
      const text = await res.text()
      if (text) message = text
    } catch {
      /* ignore */
    }
  }
  return new ApiError(message, res.status, code)
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = "reader", body, headers, ...rest } = options

  const finalHeaders: Record<string, string> = { ...authHeader(auth) }
  for (const [k, v] of Object.entries((headers as Record<string, string> | undefined) ?? {})) {
    finalHeaders[k] = v
  }

  let finalBody: BodyInit | undefined
  if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
    finalBody = body
  } else if (body != null) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json"
    finalBody = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  })

  if (res.status === 401) handleUnauthorized(auth)
  if (!res.ok) throw await parseError(res)

  if (res.status === 204) return undefined as T
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) return undefined as T
  return (await res.json()) as T
}

export interface PhotoData {
  id: string
  dayNumber: number
  url: string
  urlMed: string
  urlThumb: string
  width: number
  height: number
  wide: boolean
  sortOrder: number
  caption: string | null
}

export interface DaySummary {
  dayNumber: number
  published: boolean
  highlight: boolean
  photoCount: number
  /** Null for non-published days when fetched via the reader endpoint. */
  heroThumbUrl: string | null
}

export interface DayData {
  dayNumber: number
  story: string | null
  published: boolean
  highlight: boolean
  heroPhotoId: string | null
  photos: PhotoData[]
}

// --- Public (reader) ---

export function fetchDaySummaries(): Promise<DaySummary[]> {
  return apiFetch<DaySummary[]>(`/days/summary`)
}

export function fetchDay(dayNumber: number): Promise<DayData> {
  return apiFetch<DayData>(`/days/${dayNumber}`)
}

// --- Admin ---

export function fetchAdminDaySummaries(): Promise<DaySummary[]> {
  return apiFetch<DaySummary[]>(`/admin/days/summary`, { auth: "admin" })
}

export function fetchAdminDay(dayNumber: number): Promise<DayData> {
  return apiFetch<DayData>(`/admin/days/${dayNumber}`, { auth: "admin" })
}

export interface UpdateDayContentPayload {
  story?: string | null
  published?: boolean
  highlight?: boolean
  heroPhotoId?: string | null
  clearHeroPhoto?: boolean
}

export function updateDayContent(
  dayNumber: number,
  data: UpdateDayContentPayload,
): Promise<DayData> {
  return apiFetch<DayData>(`/admin/days/${dayNumber}`, {
    method: "PUT",
    body: data,
    auth: "admin",
  })
}

export function uploadDayPhoto(
  dayNumber: number,
  file: File,
  caption?: string,
): Promise<PhotoData> {
  const fd = new FormData()
  fd.append("photo", file)
  if (caption) fd.append("caption", caption)
  return apiFetch<PhotoData>(`/admin/days/${dayNumber}/photos`, {
    method: "POST",
    body: fd,
    auth: "admin",
  })
}

export function reorderDayPhotos(dayNumber: number, order: string[]): Promise<void> {
  return apiFetch<void>(`/admin/days/${dayNumber}/photos/order`, {
    method: "PUT",
    body: { order },
    auth: "admin",
  })
}

export interface UpdatePhotoPayload {
  caption?: string | null
  wide?: boolean
  clearCaption?: boolean
}

export function updatePhoto(id: string, data: UpdatePhotoPayload): Promise<PhotoData> {
  return apiFetch<PhotoData>(`/admin/photos/${id}`, {
    method: "PATCH",
    body: data,
    auth: "admin",
  })
}

export function deletePhoto(id: string): Promise<void> {
  return apiFetch<void>(`/admin/photos/${id}`, { method: "DELETE", auth: "admin" })
}
