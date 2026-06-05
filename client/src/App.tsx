import { Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Vacations from "@/pages/Vacations"
import Admin from "@/pages/Admin"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/trips" element={<Vacations />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

export default App
