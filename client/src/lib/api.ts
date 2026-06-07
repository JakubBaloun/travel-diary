import { getReaderToken, getAdminToken, logout, logoutAdmin } from "./auth"

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api"

type AuthMode = "reader" | "admin"

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null
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

export interface TripData {
  id: string
  title: string
  slug: string
  coverPhotoUrl: string | null
  startDate: string
  endDate: string
}

export interface EntryData {
  id: string
  dayId: string
  type: "text" | "photo"
  content: string | null
  photoUrl: string | null
  caption: string | null
  sortOrder: number
}

export interface DayData {
  id: string
  tripId: string
  dayNumber: number
  date: string
  title: string | null
  summary: string | null
  coverPhotoUrl: string | null
  entries?: EntryData[]
}

export interface DayWithEntries extends DayData {
  entries: EntryData[]
}

export interface TripWithDays extends TripData {
  description: string | null
  days: DayData[]
}

export function fetchDayBySlug(slug: string, dayNumber: number): Promise<DayWithEntries> {
  return apiFetch<DayWithEntries>(`/trips/${slug}/days/${dayNumber}`)
}

export function fetchTripBySlug(slug: string): Promise<TripWithDays> {
  return apiFetch<TripWithDays>(`/trips/${slug}`)
}

export function fetchTrips(): Promise<TripData[]> {
  return apiFetch<TripData[]>(`/trips`)
}

export async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("photo", file)
  const data = await apiFetch<{ url: string }>(`/admin/upload`, {
    method: "POST",
    body: formData,
    auth: "admin",
  })
  return data.url
}

export function createTrip(data: {
  title: string
  slug: string
  description?: string | null
  coverPhotoUrl?: string | null
  startDate: string
  endDate: string
}): Promise<TripData> {
  return apiFetch<TripData>(`/admin/trips`, { method: "POST", body: data, auth: "admin" })
}

export function updateTrip(
  id: string,
  data: {
    title: string
    slug: string
    description?: string | null
    coverPhotoUrl?: string | null
    startDate: string
    endDate: string
  },
): Promise<TripData> {
  return apiFetch<TripData>(`/admin/trips/${id}`, { method: "PATCH", body: data, auth: "admin" })
}

export function fetchTripById(id: string): Promise<TripWithDays> {
  return apiFetch<TripWithDays>(`/admin/trips/${id}`, { auth: "admin" })
}

export function createDay(
  tripId: string,
  data: {
    dayNumber: number
    date: string
    title?: string | null
    summary?: string | null
    coverPhotoUrl?: string | null
  },
): Promise<DayData> {
  return apiFetch<DayData>(`/admin/trips/${tripId}/days`, {
    method: "POST",
    body: data,
    auth: "admin",
  })
}

export function updateDay(
  id: string,
  data: {
    dayNumber?: number
    date?: string
    title?: string | null
    summary?: string | null
    coverPhotoUrl?: string | null
  },
): Promise<DayData> {
  return apiFetch<DayData>(`/admin/days/${id}`, { method: "PATCH", body: data, auth: "admin" })
}

export function deleteDay(id: string): Promise<void> {
  return apiFetch<void>(`/admin/days/${id}`, { method: "DELETE", auth: "admin" })
}

export function createEntry(
  dayId: string,
  data: { type: "text"; content: string; caption?: string | null } | { type: "photo"; caption?: string | null },
  file?: File,
): Promise<EntryData> {
  if (data.type === "photo" && file) {
    const formData = new FormData()
    formData.append("photo", file)
    formData.append("type", "photo")
    if (data.caption) formData.append("caption", data.caption)
    return apiFetch<EntryData>(`/admin/days/${dayId}/entries`, {
      method: "POST",
      body: formData,
      auth: "admin",
    })
  }
  return apiFetch<EntryData>(`/admin/days/${dayId}/entries`, {
    method: "POST",
    body: data,
    auth: "admin",
  })
}

export function updateEntry(
  id: string,
  data: { content?: string | null; caption?: string | null; sortOrder?: number },
): Promise<EntryData> {
  return apiFetch<EntryData>(`/admin/entries/${id}`, {
    method: "PATCH",
    body: data,
    auth: "admin",
  })
}

export function deleteEntry(id: string): Promise<void> {
  return apiFetch<void>(`/admin/entries/${id}`, { method: "DELETE", auth: "admin" })
}

export function deleteTrip(id: string): Promise<void> {
  return apiFetch<void>(`/admin/trips/${id}`, { method: "DELETE", auth: "admin" })
}
