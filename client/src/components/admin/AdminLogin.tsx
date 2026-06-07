import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAdmin } from "@/lib/auth";

interface AdminLoginProps {
  onLogin: () => void;
}

function AdminLogin({ onLogin }: AdminLoginProps) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;

    setSubmitting(true);
    setError("");
    try {
      await loginAdmin(password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba přihlášení");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin přístup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-3" autoComplete="off">
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
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
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLogin;
