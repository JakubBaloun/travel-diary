import { useState } from "react"
import { isAdminAuthenticated, logoutAdmin } from "@/lib/auth"
import AdminLogin from "@/components/admin/AdminLogin"
import AdminDayList from "@/components/admin/AdminDayList"
import AdminDayEdit from "@/components/admin/AdminDayEdit"

function Admin() {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated)
  const [editingDay, setEditingDay] = useState<number | null>(null)

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />
  }

  if (editingDay != null) {
    return (
      <AdminDayEdit
        key={editingDay}
        dayNumber={editingDay}
        onBack={() => setEditingDay(null)}
      />
    )
  }

  return (
    <AdminDayList
      onSelectDay={setEditingDay}
      onLogout={() => {
        logoutAdmin()
        setAuthenticated(false)
      }}
    />
  )
}

export default Admin
