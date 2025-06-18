import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Download, TrendingUp, Users, Package, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

export function Reports() {
  const { t } = useTranslation();
  const reportData = {
    salesByMonth: [
      { month: 'Jan', revenue: 25000, orders: 85 },
      { month: 'Feb', revenue: 28000, orders: 92 },
      { month: 'Mar', revenue: 32000, orders: 108 },
      { month: 'Apr', revenue: 29000, orders: 96 },
      { month: 'May', revenue: 35000, orders: 115 },
      { month: 'Jun', revenue: 41000, orders: 135 }
    ],
    topServices: [
      { service: 'Screen Repair', count: 156, revenue: 31200 },
      { service: 'Battery Replacement', count: 89, revenue: 17800 },
      { service: 'Charging Port Fix', count: 67, revenue: 13400 },
      { service: 'Water Damage', count: 45, revenue: 18000 },
      { service: 'Software Issues', count: 34, revenue: 6800 }
    ],
    customerStats: {
      totalCustomers: 456,
      newThisMonth: 23,
      returningCustomers: 167,
      averageOrdersPerCustomer: 2.3
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('reports.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="last6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30days">{t('reports.last30days')}</SelectItem>
              <SelectItem value="last3months">{t('reports.last3months')}</SelectItem>
              <SelectItem value="last6months">{t('reports.last6months')}</SelectItem>
              <SelectItem value="lastyear">{t('reports.lastyear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            {t('reports.export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              $190,000
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('reports.revenueGrowth')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalOrders')}</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              631
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('reports.ordersGrowth')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.avgOrderValue')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              $301
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('reports.avgOrderGrowth')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.customerGrowth')}</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              +23
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('reports.newCustomers')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>{t('reports.revenueTrend')}</CardTitle>
          <CardDescription>{t('reports.revenueTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
            <ChartContainer config={{ revenue: { color: '#6366f1', label: t('reports.totalRevenue') } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reportData.salesByMonth}
                  margin={{ top: 24, right: 32, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                  <ChartTooltip />
                  <ChartLegend verticalAlign="top" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Services */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>{t('reports.topServices')}</CardTitle>
            <CardDescription>{t('reports.topServicesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topServices.map((service, index) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {t(`reports.serviceNames.${service.service}`)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {service.count} {t('reports.orders')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      ${service.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('reports.revenue')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Analytics */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>{t('reports.customerAnalytics')}</CardTitle>
            <CardDescription>{t('reports.customerAnalyticsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('reports.totalCustomers')}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {reportData.customerStats.totalCustomers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('reports.newThisMonth')}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {reportData.customerStats.newThisMonth}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('reports.returningCustomers')}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {reportData.customerStats.returningCustomers}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('reports.avgOrdersPerCustomer')}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {reportData.customerStats.averageOrdersPerCustomer}
                </p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}