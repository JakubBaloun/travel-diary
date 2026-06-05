import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ADMIN_PASSWORD = "admin"

interface AdminLoginProps {
  onLogin: () => void
}

function AdminLogin({ onLogin }: AdminLoginProps) {
  const [loginError, setLoginError] = useState(false)

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const password = data.get("password") as string

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true")
      setLoginError(false)
      onLogin()
    } else {
      setLoginError(true)
    }
  }

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
  )
}

export default AdminLogin
