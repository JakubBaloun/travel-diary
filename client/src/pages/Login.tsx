import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Ghost } from "lucide-react";
import { login } from "@/lib/auth";

function Login() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;

    setSubmitting(true);
    setError("");
    try {
      await login(password);
      navigate("/mapa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba přihlášení");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-page p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-foreground">
      <div className="absolute right-3 top-3">
        <ThemeSwitcher />
      </div>

      <a
        href="/admin"
        className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-xl text-muted-foreground opacity-40 transition-all hover:scale-110 hover:text-foreground hover:opacity-100"
        title="🤫"
      >
        <Ghost className="size-6" />
      </a>

      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-surface-border bg-surface p-8 text-surface-foreground shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Travel Diary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zadej heslo pro přístup
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3" autoComplete="off">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            className="text-center"
            onChange={() => setError("")}
            disabled={submitting}
          />
          {error && (
            <p className="text-center text-xs text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Přihlašuji..." : "Vstoupit"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
