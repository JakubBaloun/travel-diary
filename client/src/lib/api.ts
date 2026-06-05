const API_BASE = "http://localhost:8080/api"
const ACCESS_KEY = "my-access-key"

export interface TripData {
  id: string
  title: string
  slug: string
  coverPhotoUrl: string | null
  startDate: string
  endDate: string
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
