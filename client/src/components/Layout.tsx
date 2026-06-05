import { Outlet } from "react-router-dom"
import Navbar from "@/components/Navbar"

function Layout() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-zinc-900 to-zinc-950">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default Layout
