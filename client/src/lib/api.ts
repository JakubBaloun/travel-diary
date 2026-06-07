const API_BASE = "http://localhost:8080/api"
const ACCESS_KEY = "travel"

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

export async function fetchDayBySlug(slug: string, dayNumber: number): Promise<DayWithEntries> {
  const res = await fetch(`${API_BASE}/trips/${slug}/days/${dayNumber}`, {
    headers: { "x-access-key": ACCESS_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export interface TripWithDays extends TripData {
  description: string | null
  days: DayData[]
}

export async function fetchTripBySlug(slug: string): Promise<TripWithDays> {
  const res = await fetch(`${API_BASE}/trips/${slug}`, {
    headers: { "x-access-key": ACCESS_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function fetchTrips(): Promise<TripData[]> {
  const res = await fetch(`${API_BASE}/trips`, {
    headers: { "x-access-key": ACCESS_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function uploadPhoto(file: File, adminKey: string): Promise<string> {
  const formData = new FormData()
  formData.append("photo", file)

  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: "POST",
    headers: { "x-admin-key": adminKey },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  const data = (await res.json()) as { url: string }
  return data.url
}

export async function createTrip(
  data: {
    title: string
    slug: string
    description?: string | null
    coverPhotoUrl?: string | null
    startDate: string
    endDate: string
  },
  adminKey: string,
) {
  const res = await fetch(`${API_BASE}/admin/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

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
  adminKey: string,
) {
  const res = await fetch(`${API_BASE}/admin/trips/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function fetchTripById(id: string, adminKey: string): Promise<TripWithDays> {
  const res = await fetch(`${API_BASE}/admin/trips/${id}`, {
    headers: { "x-admin-key": adminKey },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

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
  adminKey: string,
) {
  const res = await fetch(`${API_BASE}/admin/trips/${tripId}/days`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

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
  adminKey: string,
) {
  const res = await fetch(`${API_BASE}/admin/days/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function deleteDay(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/admin/days/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
}

export async function createEntry(
  dayId: string,
  data: { type: "text"; content: string; caption?: string | null } | { type: "photo"; caption?: string | null },
  file?: File,
  adminKey?: string,
) {
  if (data.type === "photo" && file) {
    const formData = new FormData()
    formData.append("photo", file)
    formData.append("type", "photo")
    if (data.caption) formData.append("caption", data.caption)
    const res = await fetch(`${API_BASE}/admin/days/${dayId}/entries`, {
      method: "POST",
      headers: { "x-admin-key": adminKey ?? "" },
      body: formData,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `HTTP ${res.status}`)
    }
    return res.json()
  }

  const res = await fetch(`${API_BASE}/admin/days/${dayId}/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey ?? "",
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function updateEntry(
  id: string,
  data: { content?: string | null; caption?: string | null; sortOrder?: number },
  adminKey: string,
) {
  const res = await fetch(`${API_BASE}/admin/entries/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function deleteEntry(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/admin/entries/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
}

export async function deleteTrip(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/admin/trips/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
}
