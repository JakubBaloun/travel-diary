import { Routes, Route, Navigate, useParams } from "react-router-dom"
import Login from "@/pages/Login"
import Mapa from "@/pages/Mapa"
import Den from "@/pages/Den"
import Layout from "@/components/Layout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/den/:dayNumber" element={<DenRoute />} />
        <Route path="/admin" element={<ComingSoon label="Admin — přijde v PR 5" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Remount Den when dayNumber changes so internal state resets cleanly.
function DenRoute() {
  const { dayNumber } = useParams()
  return <Den key={dayNumber} />
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 text-center text-muted-foreground">
      {label}
    </div>
  )
}

export default App
