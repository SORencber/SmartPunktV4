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
import { useEffect, useState } from 'react';
import { getSettings } from '@/api/settings';
import { useTranslation } from 'react-i18next';

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
  { title: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "customers", href: "/customers", icon: Users },
  { title: "orders", href: "/orders", icon: ShoppingCart },
  { title: "catalog", href: "/catalog", icon: BookOpen },
  { title: "products", href: "/products", icon: Package },
  { title: "inventory", href: "/inventory", icon: Package },
  { title: "repairs", href: "/repairs", icon: Wrench, roles: ["admin", "permission:repairs:read"] },
  { title: "finances", href: "/finances", icon: DollarSign },
  { title: "warranties", href: "/warranties", icon: Shield },
  { title: "reports", href: "/reports", icon: BarChart3 },
  {
    title: "management",
    items: [
      {
        title: "users",
        href: "/users",
        icon: Users,
        roles: ["admin"],
      },
      {
        title: "roles",
        href: "/roles",
        icon: Shield,
        roles: ["admin"],
      },
      {
        title: "branches",
        href: "/branches",
        icon: Building2,
        roles: ["admin"],
      },
      {
        title: "settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const { t, i18n } = useTranslation();

  // Business name state
  const [businessName, setBusinessName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getSettings().then(s => setBusinessName(s.businessName || 'RepairFlow Pro')).finally(() => setLoading(false));
  }, []);

  const isActive = (href: string) => location.pathname === href

  const canAccess = (roles?: string[]) => {
    if (!roles) return true;
    if (user?.role === 'admin') return true;
    if (roles.includes('permission:repairs:read')) {
      return hasPermission(user, 'repairs', 'read');
    }
    return user?.role && roles.includes(user.role);
  }

  // Language selector
  const languages = [
    { code: 'tr', label: '🇹🇷 Türkçe' },
    { code: 'en', label: '🇺🇸 English' },
    { code: 'de', label: '🇩🇪 Deutsch' },
  ];
  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className="flex h-full w-64 flex-col gap-2 border-r bg-background">
      <div className="flex h-[52px] items-center justify-center border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {loading ? '...' : (businessName || 'RepairFlow Pro')}
          </h2>
        </div>
      </div>
      {/* Language selector */}
      <div className="flex justify-center py-2">
        <select
          value={i18n.language}
          onChange={e => handleLangChange(e.target.value)}
          className="rounded px-2 py-1 border border-gray-300 text-sm"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {navigation.map((item, index) => {
            if ("items" in item) {
              // This is a group
              return (
                <div key={index} className="space-y-1">
                  <h4 className="mb-2 px-2 text-sm font-semibold tracking-tight text-muted-foreground">
                    {t(`sidebar.${item.title}`)}
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
                          {t(`sidebar.${subItem.title}`)}
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
                    {t(`sidebar.${item.title}`)}
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