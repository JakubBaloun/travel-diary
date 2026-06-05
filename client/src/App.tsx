import { Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Trips from "@/pages/Trips"
import Admin from "@/pages/Admin"
import Layout from "@/components/Layout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/trips" element={<Trips />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
