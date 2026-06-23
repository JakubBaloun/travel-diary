import { Outlet, useLocation } from "react-router-dom"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

function Layout() {
  const { pathname } = useLocation()
  const showNavbar = pathname !== "/mapa"

  return (
    <div className="flex min-h-dvh flex-col bg-page text-foreground">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
