import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDashboardStats, getRecentOrders, cancelOrder } from '@/api/dashboard'
import { useSnackbar } from 'notistack'
import {
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Wrench
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { useTranslation } from 'react-i18next'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  activeCustomers: number
  pendingOrders: number
  completedToday: number
  lowStockItems: number
  totalRepairs?: number
  pendingRepairs?: number
  deliveredToday?: number
}

interface Order {
  _id: string
  customerName: string
  deviceType: string
  status: string
  total: number
  createdAt: string
  orderNumber?: string
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { enqueueSnackbar } = useSnackbar()
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, ordersResponse] = await Promise.all([
          getDashboardStats(),
          getRecentOrders()
        ])
        setStats((statsResponse as any).stats)
        setRecentOrders((ordersResponse as any).orders)
      } catch (error) {
        enqueueSnackbar("Error", {
          variant: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [enqueueSnackbar])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId, "Cancelled by branch staff")
      enqueueSnackbar("Order cancelled successfully", {
        variant: "success",
      })
      // Refresh dashboard data
      const ordersResponse = await getRecentOrders()
      setRecentOrders((ordersResponse as any).orders)
    } catch (error) {
      console.error('Failed to cancel order:', error)
      enqueueSnackbar("Failed to cancel order", {
        variant: "error",
      })
    }
  }

  const handleGenerateWarranty = async (order: Order) => {
    if (order.status !== 'delivered') {
      return enqueueSnackbar("Only delivered orders can have warranty", {
        variant: "error",
      })
    }

    enqueueSnackbar("Warranty certificate generated", {
      variant: "success",
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'in_progress': return 'İşlemde';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      case 'delivered': return 'Teslim Edildi';
      case 'waiting_for_parts': return 'Parça Bekliyor';
      case 'awaiting_approval': return 'Onay Bekliyor';
      default: return status || '-';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/50 dark:bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t('dashboard.welcome')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.totalOrders.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% {t('dashboard.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% {t('dashboard.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeCustomers')}</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.activeCustomers.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5% {t('dashboard.fromLastMonth')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingOrders')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.pendingOrders}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t('dashboard.requiresAttention')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.completedToday')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.completedToday}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t('dashboard.greatProgress')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.lowStockItems')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.lowStockItems}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {t('dashboard.needRestocking')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalRepairs')}</CardTitle>
            <Wrench className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.totalRepairs?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingRepairs')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.pendingRepairs?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.deliveredToday')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats?.deliveredToday?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
          <CardDescription>{t('dashboard.latestRepairOrders')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.orderNo')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.status')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.customer')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.total')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('dashboard.date')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800">
                {recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition"
                    onClick={() => window.location.href = `/orders/${order._id}`}
                  >
                    <td className="px-4 py-2 font-semibold">{order.orderNumber || order._id.slice(-6) || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={getStatusColor(order.status) + " px-2 py-1 rounded text-xs font-semibold"}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2">{order.customerName || '-'}</td>
                    <td className="px-4 py-2">{order.total != null ? formatCurrency(order.total) : '-'}</td>
                    <td className="px-4 py-2">{order.createdAt ? formatDate(order.createdAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}