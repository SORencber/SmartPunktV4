import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { DashboardHeader } from "./DashboardHeader"
import { TooltipProvider } from "./ui/tooltip"

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-white/50 via-blue-50/30 to-indigo-100/50 dark:from-slate-800/50 dark:via-slate-700/30 dark:to-indigo-900/50">
              <div className="container mx-auto p-6">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}