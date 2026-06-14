import { Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Trips from "@/pages/Trips"
import TripDetail from "@/pages/TripDetail"
import DayDetail from "@/pages/DayDetail"
import Admin from "@/pages/Admin"
import Layout from "@/components/Layout"
import TripLayout from "@/components/TripLayout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/trips" element={<Trips />} />
        <Route element={<TripLayout />}>
          <Route path="/trips/:slug" element={<TripDetail />} />
          <Route path="/trips/:slug/days/:dayNumber" element={<DayDetail />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
