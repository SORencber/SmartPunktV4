import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Download, TrendingUp, Users, Package, DollarSign } from 'lucide-react'

export function Reports() {
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
            Reports & Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze your business performance and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="last6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              $190,000
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.2% vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              631
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.8% vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              $301
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Growth</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              +23
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              New customers this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and order volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Chart visualization would be rendered here</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Revenue trending upward by 15.2%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Services */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
            <CardDescription>Most popular repair services by volume</CardDescription>
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
                        {service.service}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {service.count} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      ${service.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      revenue
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
            <CardTitle>Customer Analytics</CardTitle>
            <CardDescription>Customer behavior and retention metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {reportData.customerStats.totalCustomers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">New This Month</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Returning Customers</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Orders per Customer</p>
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