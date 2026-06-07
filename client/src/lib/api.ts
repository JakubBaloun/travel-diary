import { getReaderToken, getAdminToken, logout, logoutAdmin } from "./auth"

const API_BASE = "http://localhost:8080/api"

function readerAuthHeader(): Record<string, string> {
  const token = getReaderToken() ?? getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function adminAuthHeader(): Record<string, string> {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readerFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...(init?.headers || {}), ...readerAuthHeader() },
  })
  if (res.status === 401) {
    const path = typeof window !== "undefined" ? window.location.pathname : ""
    if (!path.startsWith("/admin")) {
      logout()
      if (typeof window !== "undefined" && path !== "/") {
        window.location.assign("/")
      }
    }
  }
  return res
}

async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...(init?.headers || {}), ...adminAuthHeader() },
  })
  if (res.status === 401) {
    logoutAdmin()
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
      window.location.assign("/admin")
    }
  }
  return res
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

export async function fetchDayBySlug(slug: string, dayNumber: number): Promise<DayWithEntries> {
  const res = await readerFetch(`${API_BASE}/trips/${slug}/days/${dayNumber}`)
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function fetchTripBySlug(slug: string): Promise<TripWithDays> {
  const res = await readerFetch(`${API_BASE}/trips/${slug}`)
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function fetchTrips(): Promise<TripData[]> {
  const res = await readerFetch(`${API_BASE}/trips`)
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("photo", file)

  const res = await adminFetch(`${API_BASE}/admin/upload`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  const data = (await res.json()) as { url: string }
  return data.url
}

export async function createTrip(data: {
  title: string
  slug: string
  description?: string | null
  coverPhotoUrl?: string | null
  startDate: string
  endDate: string
}) {
  const res = await adminFetch(`${API_BASE}/admin/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function updateTrip(
  id: string,
  data: {
    title: string
    slug: string
    description?: string | null
    coverPhotoUrl?: string | null
    startDate: string
    endDate: string
  },
) {
  const res = await adminFetch(`${API_BASE}/admin/trips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function fetchTripById(id: string): Promise<TripWithDays> {
  const res = await adminFetch(`${API_BASE}/admin/trips/${id}`)
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function createDay(
  tripId: string,
  data: {
    dayNumber: number
    date: string
    title?: string | null
    summary?: string | null
    coverPhotoUrl?: string | null
  },
) {
  const res = await adminFetch(`${API_BASE}/admin/trips/${tripId}/days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function updateDay(
  id: string,
  data: {
    dayNumber?: number
    date?: string
    title?: string | null
    summary?: string | null
    coverPhotoUrl?: string | null
  },
) {
  const res = await adminFetch(`${API_BASE}/admin/days/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function deleteDay(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/days/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
}

export async function createEntry(
  dayId: string,
  data: { type: "text"; content: string; caption?: string | null } | { type: "photo"; caption?: string | null },
  file?: File,
) {
  if (data.type === "photo" && file) {
    const formData = new FormData()
    formData.append("photo", file)
    formData.append("type", "photo")
    if (data.caption) formData.append("caption", data.caption)
    const res = await adminFetch(`${API_BASE}/admin/days/${dayId}/entries`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
    return res.json()
  }

  const res = await adminFetch(`${API_BASE}/admin/days/${dayId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function updateEntry(
  id: string,
  data: { content?: string | null; caption?: string | null; sortOrder?: number },
) {
  const res = await adminFetch(`${API_BASE}/admin/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  return res.json()
}

export async function deleteEntry(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/entries/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
}

export async function deleteTrip(id: string) {
  const res = await adminFetch(`${API_BASE}/admin/trips/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
}
