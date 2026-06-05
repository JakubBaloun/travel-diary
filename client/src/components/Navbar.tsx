import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    localStorage.removeItem("adminAuth")
    navigate("/")
  }

  return (
    <nav className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold tracking-tight text-zinc-100">
          Travel Diary
        </span>
        <div className="flex gap-1">
          <Button
            variant={location.pathname === "/trips" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/trips")}
          >
            Tripy
          </Button>
          <Button
            variant={location.pathname === "/admin" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/admin")}
          >
            Admin
          </Button>
        </div>
      </div>
      <Button variant="outline" size="xs" onClick={handleLogout}>
        Odhlásit
      </Button>
    </nav>
  )
}

export default Navbar
