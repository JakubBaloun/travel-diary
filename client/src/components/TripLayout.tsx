import { Outlet } from "react-router-dom"
import { LiveActivity } from "@/components/trips/LiveActivity"

function TripLayout() {
  return (
    <>
      <Outlet />
      <aside className="fixed top-24 right-3 z-20 hidden w-[180px] xl:block">
        <LiveActivity variant="panel" />
      </aside>
      <div className="fixed right-4 bottom-6 z-30 xl:hidden">
        <LiveActivity variant="chip" />
      </div>
    </>
  )
}

export default TripLayout
