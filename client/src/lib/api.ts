const API_BASE = "http://localhost:8080/api"

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
