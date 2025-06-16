import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wrench,
  Package,
  BookOpen,
  DollarSign,
  Shield,
  BarChart3,
  Building2,
  LucideIcon,
  Settings,
} from "lucide-react"
import { hasPermission } from '@/utils/permissions'

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: (NavItem | NavGroup)[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Müşteriler", href: "/customers", icon: Users },
  { title: "Siparişler", href: "/orders", icon: ShoppingCart },
  { title: "Katalog", href: "/catalog", icon: BookOpen },
  { title: "Ürünler", href: "/products", icon: Package },
  { title: "Envanter", href: "/inventory", icon: Package },
  { title: "Tamirler", href: "/repairs", icon: Wrench, roles: ["admin", "permission:repairs:read"] },
  { title: "Finans", href: "/finances", icon: DollarSign },
  { title: "Garanti", href: "/warranties", icon: Shield },
  { title: "Raporlar", href: "/reports", icon: BarChart3 },
  {
    title: "Yönetim",
    items: [
      {
        title: "Kullanıcılar",
        href: "/users",
        icon: Users,
        roles: ["admin"],
      },
      {
        title: "Roller",
        href: "/roles",
        icon: Shield,
        roles: ["admin"],
      },
      {
        title: "Şubeler",
        href: "/branches",
        icon: Building2,
        roles: ["admin"],
      },
      {
        title: "Ayarlar",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (href: string) => location.pathname === href

  const canAccess = (roles?: string[]) => {
    if (!roles) return true;
    if (user?.role === 'admin') return true;
    if (roles.includes('permission:repairs:read')) {
      return hasPermission(user, 'repairs', 'read');
    }
    return user?.role && roles.includes(user.role);
  }

  return (
    <div className="flex h-full w-64 flex-col gap-2 border-r bg-background">
      <div className="flex h-[52px] items-center justify-center border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            RepairFlow Pro
          </h2>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {navigation.map((item, index) => {
            if ("items" in item) {
              // This is a group
              return (
                <div key={index} className="space-y-1">
                  <h4 className="mb-2 px-2 text-sm font-semibold tracking-tight text-muted-foreground">
                    {item.title}
                  </h4>
                  {item.items.map((subItem) => {
                    if (!canAccess(subItem.roles)) return null
                    const Icon = subItem.icon
                    return (
                      <Button
                        key={subItem.href}
                        asChild
                        variant={isActive(subItem.href) ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        <Link to={subItem.href}>
                          <Icon className="mr-2 h-4 w-4" />
                          {subItem.title}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              )
            } else {
              // This is a single item
              if (!canAccess(item.roles)) return null
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Link to={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              )
            }
          })}
        </div>
      </ScrollArea>
    </div>
  )
}