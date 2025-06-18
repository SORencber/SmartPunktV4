import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { 
  Search, 
  Package, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe
} from 'lucide-react'
import { useSnackbar } from 'notistack'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

interface TrackingOrder {
  orderNumber: string
  status: string
  device: {
    type: string
    brand: string
    model: string
    condition?: string
  }
  serviceType: string
  createdAt: string
  estimatedCompletion?: string
  actualCompletion?: string
  payment: {
    amount: number
    status: string
    paidAmount: number
    dueAmount: number
  }
  warranty: {
    isEnabled: boolean
    period: number
    startDate?: string
    endDate?: string
  }
  statusHistory: Array<{
    status: string
    date: string
    notes?: string
    user?: {
      fullName?: string
      email?: string
    }
  }>
  branch: {
    name: string
    address: string
    phone: string
  }
  customer: {
    name: string
    phone: string
  }
  assignedTechnician?: string
}

export function Tracking() {
  const [searchType, setSearchType] = useState<'barcode' | 'orderNumber'>('barcode')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const { t, i18n } = useTranslation()
  const { enqueueSnackbar } = useSnackbar()

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ]

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      enqueueSnackbar('Lütfen bir arama değeri girin', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const endpoint = searchType === 'barcode' 
        ? `/api/public/track/barcode/${searchValue}`
        : `/api/public/track/order/${searchValue}`
      
      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success) {
        setOrder(data.order)
        enqueueSnackbar('Sipariş bulundu', { variant: 'success' })
      } else {
        setOrder(null)
        enqueueSnackbar(data.message, { variant: 'error' })
      }
    } catch (error) {
      console.error('Search error:', error)
      enqueueSnackbar('Arama sırasında bir hata oluştu', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'waiting_parts': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'delivered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'in_progress': return <AlertCircle className="w-4 h-4" />
      case 'waiting_parts': return <Package className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: i18n.language === 'tr' ? 'TRY' : i18n.language === 'de' ? 'EUR' : 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
            <SelectTrigger className="w-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center">
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Section */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('tracking.title')}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {t('tracking.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="searchType" className="text-sm font-medium">
                    {t('tracking.searchType')}
                  </Label>
                  <Select value={searchType} onValueChange={(value: 'barcode' | 'orderNumber') => setSearchType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barcode">{t('tracking.searchByBarcode')}</SelectItem>
                      <SelectItem value="orderNumber">{t('tracking.searchByOrderNumber')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-2">
                  <Label htmlFor="searchValue" className="text-sm font-medium">
                    {searchType === 'barcode' ? 'Barkod / Barcode' : (i18n.language === 'tr' ? 'Sipariş Numarası' : i18n.language === 'de' ? 'Auftragsnummer' : 'Order Number')}
                  </Label>
                  <Input
                    id="searchValue"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t('tracking.searchPlaceholder')}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={loading}
                  />
                </div>
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !searchValue.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <LoadingSpinner size="sm" text={i18n.language === 'tr' ? 'Aranıyor...' : i18n.language === 'de' ? 'Suchen...' : 'Searching...'} />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {t('tracking.searchButton')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="grid gap-6">
            {/* Order Status Card */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">{t('tracking.orderDetails')}</CardTitle>
                  <Badge className={`${getStatusColor(order.status)} flex items-center gap-2`}>
                    {getStatusIcon(order.status)}
                    {t('status.' + order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Sipariş Numarası' : i18n.language === 'de' ? 'Auftragsnummer' : 'Order Number'}
                    </p>
                    <p className="font-semibold">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Oluşturulma Tarihi' : i18n.language === 'de' ? 'Erstellungsdatum' : 'Created Date'}
                    </p>
                    <p className="font-semibold">{formatDate(order.createdAt)}</p>
                  </div>
                  {order.estimatedCompletion && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {i18n.language === 'tr' ? 'Tahmini Tamamlanma' : i18n.language === 'de' ? 'Geschätzte Fertigstellung' : 'Estimated Completion'}
                      </p>
                      <p className="font-semibold">{formatDate(order.estimatedCompletion)}</p>
                    </div>
                  )}
                  {order.assignedTechnician && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {i18n.language === 'tr' ? 'Teknisyen' : i18n.language === 'de' ? 'Techniker' : 'Technician'}
                      </p>
                      <p className="font-semibold">{order.assignedTechnician}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Device Information */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('tracking.deviceInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Cihaz Türü' : i18n.language === 'de' ? 'Gerätetyp' : 'Device Type'}
                    </p>
                    <p className="font-semibold">{order.device.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Marka' : i18n.language === 'de' ? 'Marke' : 'Brand'}
                    </p>
                    <p className="font-semibold">{order.device.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Model' : i18n.language === 'de' ? 'Modell' : 'Model'}
                    </p>
                    <p className="font-semibold">{order.device.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Servis Türü' : i18n.language === 'de' ? 'Service-Typ' : 'Service Type'}
                    </p>
                    <p className="font-semibold">{order.serviceType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Information */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t('tracking.paymentInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {i18n.language === 'tr' ? 'Toplam Tutar' : i18n.language === 'de' ? 'Gesamtbetrag' : 'Total Amount'}
                      </span>
                      <span className="font-semibold">{formatCurrency(order.payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {i18n.language === 'tr' ? 'Ödenen' : i18n.language === 'de' ? 'Bezahlt' : 'Paid'}
                      </span>
                      <span className="font-semibold text-green-600">{formatCurrency(order.payment.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {i18n.language === 'tr' ? 'Kalan' : i18n.language === 'de' ? 'Verbleibend' : 'Remaining'}
                      </span>
                      <span className="font-semibold text-red-600">{formatCurrency(order.payment.dueAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {i18n.language === 'tr' ? 'Ödeme Durumu' : i18n.language === 'de' ? 'Zahlungsstatus' : 'Payment Status'}
                      </span>
                      <Badge variant="secondary">
                        {t('paymentStatus.' + order.payment.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warranty Information */}
              {order.warranty.isEnabled && (
                <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {t('tracking.warrantyInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {i18n.language === 'tr' ? 'Garanti Süresi' : i18n.language === 'de' ? 'Garantiedauer' : 'Warranty Period'}
                        </p>
                        <p className="font-semibold">{order.warranty.period} {i18n.language === 'tr' ? 'gün' : i18n.language === 'de' ? 'Tage' : 'days'}</p>
                      </div>
                      {order.warranty.startDate && (
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {i18n.language === 'tr' ? 'Başlangıç Tarihi' : i18n.language === 'de' ? 'Startdatum' : 'Start Date'}
                          </p>
                          <p className="font-semibold">{formatDate(order.warranty.startDate)}</p>
                        </div>
                      )}
                      {order.warranty.endDate && (
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {i18n.language === 'tr' ? 'Bitiş Tarihi' : i18n.language === 'de' ? 'Enddatum' : 'End Date'}
                          </p>
                          <p className="font-semibold">{formatDate(order.warranty.endDate)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Branch Information */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t('tracking.branchInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Şube Adı' : i18n.language === 'de' ? 'Filialname' : 'Branch Name'}
                    </p>
                    <p className="font-semibold">{order.branch.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Adres' : i18n.language === 'de' ? 'Adresse' : 'Address'}
                    </p>
                    <p className="font-semibold">{order.branch.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {i18n.language === 'tr' ? 'Telefon' : i18n.language === 'de' ? 'Telefon' : 'Phone'}
                    </p>
                    <p className="font-semibold">{order.branch.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t('tracking.statusHistory')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.statusHistory.map((status, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex-shrink-0">
                          {getStatusIcon(status.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusColor(status.status)}>
                              {t('status.' + status.status)}
                            </Badge>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(status.date)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {status.user && (status.user.fullName || status.user.email) ? `${status.user.fullName || ''} ${status.user.email ? `<${status.user.email}>` : ''}` : 'Kullanıcı Bilgisi Yok'}
                          </p>
                          {status.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {status.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tracking
