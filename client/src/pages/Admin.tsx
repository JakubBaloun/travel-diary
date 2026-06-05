import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createTrip } from "@/lib/api"

const ADMIN_PASSWORD = "admin"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function Admin() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("adminAuth") === "true",
  )
  const [loginError, setLoginError] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  )
  const [message, setMessage] = useState("")

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("")

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      await createTrip(
        {
          title,
          slug,
          description: description || null,
          coverPhotoUrl: coverPhotoUrl || null,
          startDate,
          endDate,
        },
        ADMIN_PASSWORD,
      )
      setStatus("success")
      setMessage("Trip byl úspěšně vytvořen!")
      setTitle("")
      setSlug("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setCoverPhotoUrl("")
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Neznámá chyba")
    }
  }

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const password = data.get("password") as string

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true")
      setAuthenticated(true)
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminAuth")
    setAuthenticated(false)
    setStatus("idle")
    setMessage("")
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin přístup</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <Input
                name="password"
                type="password"
                placeholder="Admin heslo"
                onChange={() => setLoginError(false)}
              />
              {loginError && (
                <p className="text-center text-xs text-red-400">
                  Špatné heslo
                </p>
              )}
              <Button type="submit" className="w-full">
                Vstoupit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Admin — Nový trip
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/trips")}>
              Zpět
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Odhlásit
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vytvořit trip</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-sm text-zinc-400">
                  Název *
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="slug" className="text-sm text-zinc-400">
                  Slug *
                </label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm text-zinc-400">
                  Popis
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="startDate" className="text-sm text-zinc-400">
                  Datum začátku *
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="endDate" className="text-sm text-zinc-400">
                  Datum konce *
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="coverPhotoUrl" className="text-sm text-zinc-400">
                  URL titulní fotky
                </label>
                <Input
                  id="coverPhotoUrl"
                  type="url"
                  value={coverPhotoUrl}
                  onChange={(e) => setCoverPhotoUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>

              {message && (
                <p
                  className={`text-sm ${
                    status === "success" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {message}
                </p>
              )}

              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? "Vytvářím..." : "Vytvořit trip"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Admin
