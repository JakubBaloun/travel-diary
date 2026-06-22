import { Outlet, useLocation } from "react-router-dom"
import Navbar from "@/components/Navbar"

function Layout() {
  const { pathname } = useLocation()
  const showNavbar = pathname !== "/mapa"

  return (
    <div className="min-h-dvh bg-page pb-[env(safe-area-inset-bottom)] text-foreground">
      {showNavbar && <Navbar />}
      <Outlet />
    </div>
  )
}

export default Layout
