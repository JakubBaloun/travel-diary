import { Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Vacations from "@/pages/Vacations"
import Admin from "@/pages/Admin"
import Layout from "@/components/Layout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/trips" element={<Vacations />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
