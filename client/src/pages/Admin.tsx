import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type TripData,
  createTrip,
  updateTrip,
  deleteTrip,
  fetchTrips,
} from "@/lib/api";

const ADMIN_PASSWORD = "admin";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

type View = "list" | "form";

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("adminAuth") === "true",
  );
  const [loginError, setLoginError] = useState(false);

  const [view, setView] = useState<View>("list");
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authenticated) return;
    loadTrips();
  }, [authenticated]);

  async function loadTrips() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTrips();
      setTrips(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setCoverPhotoUrl("");
    setStatus("idle");
    setMessage("");
    setView("form");
  }

  function openEdit(trip: TripData) {
    setEditingId(trip.id);
    setTitle(trip.title);
    setSlug(trip.slug);
    setDescription("");
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setCoverPhotoUrl(trip.coverPhotoUrl || "");
    setStatus("idle");
    setMessage("");
    setView("form");
  }

  function cancelForm() {
    setView("list");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const data = {
        title,
        slug,
        description: description || null,
        coverPhotoUrl: coverPhotoUrl || null,
        startDate,
        endDate,
      };

      if (editingId) {
        await updateTrip(editingId, data, ADMIN_PASSWORD);
        setMessage("Trip byl úspěšně upraven!");
      } else {
        await createTrip(data, ADMIN_PASSWORD);
        setMessage("Trip byl úspěšně vytvořen!");
      }

      setStatus("idle");
      await loadTrips();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Neznámá chyba");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu chceš smazat tento trip?")) return;

    try {
      await deleteTrip(id, ADMIN_PASSWORD);
      await loadTrips();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Neznámá chyba");
    }
  }

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      setAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminAuth");
    setAuthenticated(false);
    setView("list");
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center pt-20">
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
                <p className="text-center text-xs text-red-400">Špatné heslo</p>
              )}
              <Button type="submit" className="w-full">
                Vstoupit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="mx-auto max-w-lg px-6 pt-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {editingId ? "Upravit trip" : "Nový trip"}
          </h1>
          <Button variant="ghost" size="sm" onClick={cancelForm}>
            Zpět
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Upravit trip" : "Vytvořit trip"}
            </CardTitle>
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
                <label
                  htmlFor="coverPhotoUrl"
                  className="text-sm text-zinc-400"
                >
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
                    status === "error" ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex-1"
                >
                  {status === "loading"
                    ? "Ukládám..."
                    : editingId
                      ? "Uložit změny"
                      : "Vytvořit trip"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Zrušit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Admin
        </h1>
        <div className="flex gap-2">
          <Button onClick={openCreate}>Přidat trip</Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Odhlásit admina
          </Button>
        </div>
      </div>

      {loading && <p className="text-center text-zinc-400">Načítám...</p>}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      {!loading && trips.length === 0 && (
        <p className="text-center text-zinc-500">Zatím žádné tripy.</p>
      )}

      <div className="flex flex-col gap-3 pb-10">
        {trips.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-slate-800">{t.title}</h3>
                <p className="text-sm text-zinc-500">
                  {t.startDate} – {t.endDate}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(t)}
                >
                  Editovat
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(t.id)}
                >
                  Smazat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Admin;
