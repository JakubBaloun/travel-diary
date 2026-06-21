import { Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/Login"
import Layout from "@/components/Layout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/mapa" element={<ComingSoon label="Mapa — přijde v PR 3" />} />
        <Route path="/den/:dayNumber" element={<ComingSoon label="Den — přijde v PR 4" />} />
        <Route path="/admin" element={<ComingSoon label="Admin — přijde v PR 5" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 text-center text-muted-foreground">
      {label}
    </div>
  )
}

export default App
