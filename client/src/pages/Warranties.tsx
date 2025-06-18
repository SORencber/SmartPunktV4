import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/formatters'
import { Shield, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Warranties() {
  const { t } = useTranslation();
  const warranties = [
    {
      id: 'WRT-001',
      customerName: 'John Doe',
      deviceType: 'iPhone 14',
      serviceName: 'Screen Replacement',
      issueDate: '2024-01-01T00:00:00Z',
      expiryDate: '2024-07-01T00:00:00Z',
      status: 'active',
      orderId: 'ORD-123'
    },
    {
      id: 'WRT-002',
      customerName: 'Jane Smith',
      deviceType: 'MacBook Pro',
      serviceName: 'Battery Replacement',
      issueDate: '2023-12-15T00:00:00Z',
      expiryDate: '2024-06-15T00:00:00Z',
      status: 'expiring',
      orderId: 'ORD-124'
    },
    {
      id: 'WRT-003',
      customerName: 'Bob Wilson',
      deviceType: 'iPad Air',
      serviceName: 'Charging Port Repair',
      issueDate: '2023-08-20T00:00:00Z',
      expiryDate: '2024-02-20T00:00:00Z',
      status: 'expired',
      orderId: 'ORD-125'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'expiring':
        return <Clock className="w-4 h-4" />
      case 'expired':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t('warranties.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {t('warranties.subtitle')}
        </p>
      </div>

      {/* Warranty Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('warranties.active')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {warranties.filter(w => w.status === 'active').length}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t('warranties.currentlyCovered')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('warranties.expiringSoon')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {warranties.filter(w => w.status === 'expiring').length}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t('warranties.within30days')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('warranties.totalIssued')}</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {warranties.length}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t('warranties.allTime')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warranties List */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>{t('warranties.certificates')}</CardTitle>
          <CardDescription>{t('warranties.certificatesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {warranties.map((warranty) => {
              const daysRemaining = getDaysRemaining(warranty.expiryDate)
              
              return (
                <div
                  key={warranty.id}
                  className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-700/70 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {warranty.id}
                        </h3>
                        <Badge className={getStatusColor(warranty.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(warranty.status)}
                            <span className="capitalize">{t(`warranties.status.${warranty.status}`)}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {warranty.customerName} • {warranty.deviceType}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('warranties.service')}: {warranty.serviceName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {t('warranties.expires')}: {formatDate(warranty.expiryDate)}
                    </div>
                    {warranty.status === 'active' && (
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {t('warranties.daysRemaining', { count: daysRemaining })}
                      </p>
                    )}
                    {warranty.status === 'expiring' && (
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        {t('warranties.expiresIn', { count: daysRemaining })}
                      </p>
                    )}
                    {warranty.status === 'expired' && (
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {t('warranties.expiredAgo', { count: Math.abs(daysRemaining) })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}