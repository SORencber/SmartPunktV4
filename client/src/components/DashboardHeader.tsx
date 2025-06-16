// @ts-nocheck
import { Bell, Search, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Orders', href: '/orders' },
  { name: 'Customers', href: '/customers' },
  { name: 'Reports', href: '/reports' },
  { name: 'Finances', href: '/finances' },
  { name: 'Settings', href: '/settings' },
  { name: 'Logs', href: '/logs', adminOnly: true },
]

export function DashboardHeader() {
  const { logout, user, currentBranch } = useAuth()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              className="bg-slate-100/80 dark:bg-slate-800/80 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {currentBranch && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">{currentBranch.name}</span>
            </div>
          )}
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
