import { Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Vacations from "@/pages/Vacations"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/vacations" element={<Vacations />} />
    </Routes>
  )
}

export default App
