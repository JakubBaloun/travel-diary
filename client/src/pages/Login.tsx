import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ghost } from "lucide-react"
import { checkPassword, login } from "@/lib/auth"

function Login() {
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const password = data.get("password") as string

    if (checkPassword(password)) {
      login()
      navigate("/trips")
    } else {
      setError(true)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
      <a
        href="/admin"
        className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-xl text-zinc-600 opacity-40 transition-all hover:scale-110 hover:opacity-100 hover:text-zinc-300"
        title="🤫"
      >
        <Ghost className="size-6" />
      </a>

      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-zinc-800/50 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Travel Diary
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Zadej heslo pro přístup
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <Input
            name="password"
            type="password"
            placeholder="••••••••"
            className="text-center"
            onChange={() => setError(false)}
          />
          {error && (
            <p className="text-center text-xs text-red-400">
              Špatné heslo
            </p>
          )}
          <Button type="submit" className="w-full">
            Vstoupit
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Login
