const READER_TOKEN_KEY = "auth_token"
const ADMIN_TOKEN_KEY = "admin_token"
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api"

export function getReaderToken(): string | null {
  return localStorage.getItem(READER_TOKEN_KEY)
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getReaderToken() !== null || getAdminToken() !== null
}

export function isAdminAuthenticated(): boolean {
  return getAdminToken() !== null
}

async function postLogin(path: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error("Špatné heslo")
    if (res.status === 429) throw new Error("Příliš mnoho pokusů, zkus to za chvíli")
    throw new Error(`HTTP ${res.status}`)
  }
  const data = (await res.json()) as { token: string }
  return data.token
}

export async function login(password: string): Promise<void> {
  const token = await postLogin("/auth/login", password.toLowerCase())
  localStorage.setItem(READER_TOKEN_KEY, token)
}

export async function loginAdmin(password: string): Promise<void> {
  const token = await postLogin("/auth/admin/login", password.toLowerCase())
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function logout(): void {
  localStorage.removeItem(READER_TOKEN_KEY)
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem("adminAuth")
  localStorage.removeItem("admin_key")
}
