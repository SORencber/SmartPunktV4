import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getOrderById, updateOrderStatus, cancelOrder } from '@/api/orders'
import { useSnackbar } from 'notistack'
import { ArrowLeft, Calendar, User, Smartphone, Package, DollarSign, Clock, Printer, Barcode, Edit, MoreVertical, Loader2, Shield } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes';
import { getBrands, type Brand } from '@/api/brands';
import { getModels, type Model } from '@/api/models';
import { useTranslation } from 'react-i18next';

interface Order {
  _id: string
  orderNumber: string
  orderId?: string
  customerId: {
    _id: string
    name: string
    phone: string
    email?: string
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  device: {
    brand: string
    model: string
    serialNumber?: string
    issue: string
    notes?: string
    deviceTypeId?: string
    brandId?: string
    modelId?: string
  }
  status: string
  statusHistory: Array<{
    status: string
    timestamp: string
    notes?: string
    user?: {
      fullName?: string
      email?: string
    }
  }>
  products?: Array<{
    productId?: {
      _id?: string
      name?: string
      price?: number
    }
    quantity?: number
  }>
  items?: Array<{
    _id?: string
    name?: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  payment: {
    totalAmount?: number
    depositAmount?: number
    remainingAmount?: number
    status: string
    method?: string
  }
  loanedDevice?: {
    deviceTypeId?: string
    brandId?: string
    modelId?: string
  }
  isLoanedDeviceGiven?: boolean
  estimatedTime: string
  notes?: string
  createdAt: string
  updatedAt: string
  branch?: {
    name: string
  }
  totalCentralPayment?: number
  totalBranchProfit?: number
  warranty?: {
    issued: boolean
    certificateNumber: string
    warrantyStartDate: string
    warrantyEndDate: string
    terms?: {
      period: string
      coverage: string
      claimProcess: string
    }
  }
}

export function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const warrantyRef = useRef<HTMLDivElement>(null)
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])

  const { enqueueSnackbar } = useSnackbar()
  const { t } = useTranslation();

  useEffect(() => {
    loadOrder()
    getDeviceTypes().then(r => r.success && setDeviceTypes(r.data))
    getBrands().then(r => r.success && setBrands(r.data))
    getModels().then(r => r.success && setModels(r.data))
  }, [id])

  const loadOrder = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await getOrderById(id)
      setOrder(response.order as Order)
    } catch (error) {
      console.error('Failed to load order:', error)
      enqueueSnackbar('Failed to load order details', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus) return

    try {
      setUpdating(true)
      await updateOrderStatus(order._id, { status: selectedStatus, notes: statusNotes })
      enqueueSnackbar('Order status updated successfully', { variant: 'success' })
      await loadOrder()
      setShowStatusDialog(false)
      setSelectedStatus('')
      setStatusNotes('')
    } catch (error) {
      console.error('Failed to update status:', error)
      enqueueSnackbar('Failed to update order status', { variant: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!order) return

    try {
      setUpdating(true)
      await cancelOrder(order._id, 'Cancelled by branch staff')
      enqueueSnackbar('Order cancelled successfully', { variant: 'success' })
      await loadOrder()
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Failed to cancel order:', error)
      enqueueSnackbar('Failed to cancel order', { variant: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Order-${order?.orderId || order?.orderNumber}`,
    onBeforeGetContent: () => {
      if (receiptRef.current) {
        setTimeout(() => {
          receiptRef.current?.classList.remove('hidden');
          receiptRef.current?.classList.add('print:block');
        }, 0);
      }
    },
    onAfterPrint: () => {
      if (receiptRef.current) {
        receiptRef.current.classList.add('hidden');
        receiptRef.current.classList.remove('print:block');
      }
    },
    pageStyle: `
      @page {
        size: 210mm 297mm;
        margin: 0;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .receipt-content, .receipt-content * {
          visibility: visible;
        }
        .receipt-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          margin: 0;
          background: white;
          box-sizing: border-box;
        }
      }
    `,
  } as any)

  const handleWarrantyPrint = useReactToPrint({
    contentRef: warrantyRef,
    documentTitle: `Warranty-${order?.orderId || order?.orderNumber}`,
    onBeforeGetContent: () => {
      if (warrantyRef.current) {
        setTimeout(() => {
          warrantyRef.current?.classList.remove('hidden');
          warrantyRef.current?.classList.add('print:block');
        }, 0);
      }
    },
    onAfterPrint: () => {
      if (warrantyRef.current) {
        warrantyRef.current.classList.add('hidden');
        warrantyRef.current.classList.remove('print:block');
      }
    },
    pageStyle: `
      @page {
        size: 210mm 297mm;
        margin: 0;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .warranty-content, .warranty-content * {
          visibility: visible;
        }
        .warranty-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          margin: 0;
          background: white;
          box-sizing: border-box;
        }
      }
    `,
  } as any)

  const getDisplayName = (val:any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.tr || val.en || val.de || Object.values(val)[0] || '';
    }
    return String(val);
  };

  const getDeviceTypeName = (id?: string) => {
    const dt = deviceTypes.find(dt => dt._id === id);
    return dt ? getDisplayName(dt.name) : '-';
  };
  const getBrandName = (id?: string) => {
    const b = brands.find(b => b._id === id);
    return b ? getDisplayName(b.name) : '-';
  };
  const getModelName = (id?: string) => {
    const m = models.find(m => m._id === id);
    return m ? getDisplayName(m.name) : '-';
  };

  const statusOptions = [
    { value: 'pending', label: t('orders.status.pending') },
    { value: 'shipped', label: t('orders.status.shipped') },
    { value: 'delivered', label: t('orders.status.delivered') },
    { value: 'completed', label: t('orders.status.completed') },
    { value: 'cancelled', label: t('orders.status.cancelled') },
  ];

  const getStatusLabel = (status: string) => {
    if (status === 'in progress' || status === 'shipped') return t('orders.status.shipped');
    if (status === 'delivered') return t('orders.status.delivered');
    return statusOptions.find(opt => opt.value === status)?.label || getDisplayName(status);
  };
  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleStatusUpdateDirect = async (status: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      // Kargoda seçildiyse backend'e 'shipped' gönder
      const backendStatus = status === 'in progress' ? 'shipped' : status;
      await updateOrderStatus(order._id, { status: backendStatus });
      // Eğer tamamlandı ise ödeme durumunu da güncelle
      enqueueSnackbar('Order status updated successfully', { variant: 'success' });
      await loadOrder();
    } catch (error) {
      enqueueSnackbar('Failed to update order status', { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  // Yardımcı fonksiyonlar (CreateOrder'dan alınanlar)
  const getDisplayNameDe = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.de || val.en || val.tr || '';
    }
    return String(val);
  };
  function findNameByIdDe(arr: any[], id: string | undefined) {
    if (!id) return '';
    const obj = arr.find((o) => o._id === id);
    return obj ? getDisplayNameDe((obj as any).name || obj) : '';
  }
  const normalizeId = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.$oid || val._id || undefined;
    }
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">{t('orders.notFound')}</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          {t('orders.backToOrders')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orders.back')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowBarcodeDialog(true)}>
              <Barcode className="h-4 w-4 mr-2" />
              {t('orders.showBarcode')}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('orders.print')}
            </Button>
            {order.status === 'completed' && (
              <Button variant="outline" onClick={handleWarrantyPrint}>
                <Shield className="h-4 w-4 mr-2" />
                {t('orders.printWarranty')}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <>
                    <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                      {t('orders.updateStatus')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
                      {t('orders.cancelOrder')}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate(`/customers/${order.customerId._id}`)}>
                  {t('orders.viewCustomer')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="bg-blue-600 text-white border-blue-500">
          <CardHeader>
            <CardTitle className="text-white">{t('orders.summary')}</CardTitle>
            <CardDescription className="text-blue-100">{t('orders.summaryDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Order Status Badge */}
            <div className="col-span-2 flex items-center mb-2">
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-100">{t('orders.orderNo')}</p>
              <p className="font-medium text-white">{order.orderNumber || order.orderId || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-100">{t('orders.branch')}</p>
              <p className="font-medium text-white">{getDisplayName(order.branch?.name)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-100">{t('orders.createdAt')}</p>
              <p className="font-medium text-white">{formatDate(order.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-blue-500">
          <CardHeader>
            <CardTitle className="text-white">{t('orders.productsAndPayment')}</CardTitle>
            <CardDescription className="text-blue-100">{t('orders.productsAndPaymentDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Device Info */}
            <div className="mb-2">
              <div className="font-semibold text-white">{t('orders.device')}</div>
              <div className="text-blue-100 text-sm">
                {getDeviceTypeName(order.device?.deviceTypeId)} / {getBrandName(order.device?.brandId)} {getModelName(order.device?.modelId)}
              </div>
            </div>
            <div className="space-y-2">
              {(order.items ?? []).map((it: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">
                      {getDisplayNameDe(it.name)}
                    </p>
                    <p className="text-sm text-blue-100">
                      {it.quantity} × {formatCurrency(it.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium text-white">
                    {formatCurrency(it.totalPrice)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="font-medium text-white">{t('orders.totalAmount')}</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(order.payment.totalAmount ?? 0)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">{t('orders.deposit')}</p>
              <p className="font-medium text-white">
                {formatCurrency(order.payment.depositAmount ?? 0)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">{t('orders.remaining')}</p>
              <p className="font-medium text-white">
                {formatCurrency(order.payment.remainingAmount ?? 0)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">{t('orders.totalCentralPayment')}</p>
              <p className="font-medium text-white">{order.totalCentralPayment !== undefined ? formatCurrency(order.totalCentralPayment) : '-'}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">{t('orders.totalBranchProfit')}</p>
              <p className="font-medium text-white">{order.totalBranchProfit !== undefined ? formatCurrency(order.totalBranchProfit) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-blue-500">
          <CardHeader>
            <CardTitle className="text-white">{t('orders.customerInfo')}</CardTitle>
            <CardDescription className="text-blue-100">{t('orders.customerInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium text-white">{t('orders.customer')}</h3>
              <p className="text-blue-100">{getDisplayName(order.customerId.name)}</p>
              <p className="text-blue-100">{order.customerId.phone}</p>
              {order.customerId.email && (
                <p className="text-blue-100">{order.customerId.email}</p>
              )}
              {order.customerId.address && (
                <p className="text-blue-100">
                  {[
                    order.customerId.address.street,
                    order.customerId.address.city,
                    order.customerId.address.state,
                    order.customerId.address.zipCode,
                    order.customerId.address.country
                  ].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {order.isLoanedDeviceGiven && (
              <Card className="bg-red-600 text-white border-red-500">
                <CardHeader>
                  <CardTitle className="text-white">{t('orders.loanedDevice')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {order.loanedDevice?.deviceTypeId ? getDeviceTypeName(order.loanedDevice.deviceTypeId) : ''} / {order.loanedDevice?.brandId ? getBrandName(order.loanedDevice.brandId) : ''} {order.loanedDevice?.modelId ? getModelName(order.loanedDevice.modelId) : ''}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card className="bg-amber-200 text-amber-900 border-amber-400">
          <CardHeader>
            <CardTitle className="text-amber-900">{t('orders.statusHistory')}</CardTitle>
            <CardDescription className="text-amber-800">{t('orders.statusHistoryDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(order.statusHistory ?? []).map((status, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-2',
                        getStatusColor(status.status),
                        'bg-amber-500 border border-amber-700'
                      )}
                    />
                    {index !== (order.statusHistory ?? []).length - 1 && (
                      <div className="w-0.5 h-8 bg-amber-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      {getStatusLabel(status.status)}
                    </p>
                    <p className="text-sm text-amber-700">
                      {formatDate(status.timestamp)}
                    </p>
                    <p className="text-sm text-amber-900">
                      {status.user && (status.user.fullName || status.user.email) ? `${status.user.fullName || ''} ${status.user.email ? `<${status.user.email}>` : ''}` : t('orders.noUserInfo')}
                    </p>
                    {status.notes && (
                      <p className="text-sm text-amber-800 mt-1">
                        {getDisplayName(status.notes)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fiş/receipt PDF şablonu */}
        <div
          ref={receiptRef}
          className="receipt-content hidden print:block bg-white"
          style={{
            width: '210mm',
            height: '297mm',
            padding: '10mm',
            margin: 0,
            background: 'white',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {order && (
            <div className="space-y-4" style={{ paddingBottom: '40mm' }}>
              <div className="border-b pb-2">
                <div className="flex justify-between items-start">
                  {/* Logo */}
                  <img src={`${window.location.origin}/brands/smartpunkt.jpg`} alt="Smart Punkt GmbH" className="h-20 w-20 object-contain" />
                  {/* Center titles */}
                  <div className="flex-1 text-center">
                    <p className="font-semibold">Smart Punkt GmbH</p>
                    <h2 className="text-lg font-bold">Reparaturauftragsbeleg</h2>
                    <p className="text-sm">
                      Auftragsdatum: {new Date(order.createdAt || Date.now()).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} , Auftragsnummer: {order.orderNumber}
                    </p>
                  </div>
                  {/* QR code with order number */}
                  <QRCodeSVG value={`${order.orderNumber}`} size={80} />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {/* Kunde */}
                <div className="border-b pb-1">
                  <p className="font-semibold">Kunde</p>
                  <p>{getDisplayNameDe(order.customerId?.name)}</p>
                  <p>{order.customerId?.phone}</p>
                  {order.customerId?.email && <p>{order.customerId.email}</p>}
                </div>
                {/* Bestellung Teile */}
                <div className="border-b pb-1">
                  <p className="font-semibold">Bestellung Teile</p>
                  <p>{getDeviceTypeName(order.device?.deviceTypeId)} / {getBrandName(order.device?.brandId)} {getModelName(order.device?.modelId)}</p>
                  {(order.items ?? []).map((it: any, idx: number) => (
                    <p key={idx}>• {getDisplayNameDe(it.name)} x{it.quantity}</p>
                  ))}
                </div>
                {/* Zahlung */}
                <div className="border-b pb-1">
                  <p className="font-semibold">Zahlung</p>
                  <p>Bezahlt: {formatCurrency(order.payment?.depositAmount ?? 0)}</p>
                  <p>Restbetrag: {formatCurrency(order.payment?.remainingAmount ?? 0)}</p>
                </div>
                {order.isLoanedDeviceGiven && (
                  <div className="border-b pb-1">
                    <p className="font-semibold">Leihgerät</p>
                    <p>{getDeviceTypeName(order.loanedDevice?.deviceTypeId)} / {getBrandName(order.loanedDevice?.brandId)} {getModelName(order.loanedDevice?.modelId)}</p>
                  </div>
                )}
              </div>
              {/* Company address footer (dummy, gerçek adres için gerekirse branch bilgisi eklenebilir) */}
              <div
                className="pt-2 text-center text-xs border-t"
                style={{
                  position: 'absolute',
                  bottom: '10mm',
                  left: 0,
                  width: 'calc(100% - 20mm)',
                  background: 'white',
                  paddingTop: '4mm',
                }}
              >
                Smart Punkt GmbH, Musterstraße 1, 12345 Berlin, Telefon: 01234 567890
              </div>
            </div>
          )}
        </div>

        {/* Garanti PDF şablonu */}
        <div
          ref={warrantyRef}
          className="warranty-content hidden print:block bg-white"
          style={{
            width: '210mm',
            height: '297mm',
            padding: '10mm',
            margin: 0,
            background: 'white',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {order && (
            <div className="space-y-4">
              <div className="text-center border-b pb-2">
                <h2 className="text-2xl font-bold">Garantieschein</h2>
                <p className="text-sm">Auftragsnummer (Order No): {order.orderId || order.orderNumber}</p>
                <div className="flex justify-center my-2">
                  <QRCodeSVG value={String(order.orderId || order.orderNumber)} size={80} />
                </div>
                <p className="text-xs">Ausstellungsdatum: {new Date().toLocaleDateString('de-DE')}</p>
                <p className="text-xs">Ablaufdatum: {(() => { const end = new Date(); end.setMonth(end.getMonth() + 6); return end.toLocaleDateString('de-DE'); })()}</p>
              </div>
              <div className="space-y-2">
                <div className="border-b pb-2">
                  <p className="font-semibold">Kunde</p>
                  <p>{order.customerId?.name}</p>
                  <p>{order.customerId?.phone}</p>
                  {order.customerId?.address && (
                    <p className="text-sm">{order.customerId.address.street}, {order.customerId.address.city}</p>
                  )}
                </div>
                <div className="border-b pb-2">
                  <p className="font-semibold">Gerät</p>
                  <p>{getDeviceTypeName(order.device?.deviceTypeId)} / {getBrandName(order.device?.brandId)} {getModelName(order.device?.modelId)}</p>
                  <p className="text-sm">Seriennummer: {order.device?.serialNumber}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-semibold">Garantierte Teile</p>
                  {order.items && order.items.length > 0 ? (
                    <ul className="list-disc ml-6">
                      {order.items.map((it: any, idx: number) => (
                        <li key={idx}>{getDisplayNameDe(it.name)} x{it.quantity}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>-</p>
                  )}
                </div>
                <div className="border-b pb-2">
                  <p className="font-semibold">Garantiebedingungen</p>
                  <ul className="list-disc ml-6 text-sm">
                    <li>Die Garantie gilt für Herstellungsfehler und Materialfehler der oben aufgeführten Teile.</li>
                    <li>Von der Garantie ausgeschlossen sind Schäden durch unsachgemäße Benutzung, Sturz, Wasser, Feuchtigkeit, Feuer, höhere Gewalt oder Eingriffe durch nicht autorisierte Personen.</li>
                    <li>Die Garantie erlischt bei Öffnung, Manipulation oder Reparatur durch Dritte.</li>
                    <li>Verschleißteile (z.B. Akkus, Kabel) sind von der Garantie ausgeschlossen, sofern nicht anders angegeben.</li>
                    <li>Die gesetzlichen Rechte des Verbrauchers nach deutschem Recht bleiben unberührt.</li>
                    <li>Im Garantiefall wenden Sie sich bitte mit diesem Schein und dem Gerät an unsere Filiale.</li>
                  </ul>
                </div>
                <div className="pt-8 text-right">
                  <p>Unterschrift / Stempel</p>
                  <div style={{ height: '40px', borderBottom: '1px solid #333', width: '200px', marginLeft: 'auto' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barcode Dialog */}
        <Dialog open={showBarcodeDialog} onOpenChange={setShowBarcodeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('orders.barcode')}</DialogTitle>
              <DialogDescription>
                {t('orders.barcodeDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 gap-2">
              <QRCodeSVG value={`${window.location.origin}/orders/${order._id}`} size={200} />
              <div className="mt-2 text-center">
                <span className="block text-sm text-blue-100">{t('orders.orderNo')}</span>
                <span className="block text-lg font-bold text-blue-50">{order.orderNumber || '-'}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('orders.updateStatus')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('orders.updateStatusDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('orders.status')}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('orders.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('orders.notes')}</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder={t('orders.statusNotesPlaceholder')}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('orders.updating')}
                  </>
                ) : (
                  t('orders.updateStatus')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('orders.cancelOrder')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('orders.cancelOrderDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={updating}
                className="bg-red-600 hover:bg-red-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('orders.cancelling')}
                  </>
                ) : (
                  t('orders.yesCancelOrder')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}