import { Outlet } from "react-router-dom"
import Navbar from "@/components/Navbar"

function Layout() {
  return (
    <div className="min-h-dvh bg-page text-foreground">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default Layout
