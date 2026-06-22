import { useNavigate } from "react-router-dom"
import { Compass, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import { logout } from "@/lib/auth"

function Navbar() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    localStorage.removeItem("adminAuth")
    navigate("/")
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-surface-border bg-surface pt-[env(safe-area-inset-top)] text-surface-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate("/mapa")}
          className="group flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-badge text-badge-foreground transition-transform group-hover:rotate-12">
            <Compass className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Travel Diary
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            aria-label="Odhlásit"
            title="Odhlásit"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
