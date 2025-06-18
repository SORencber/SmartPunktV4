import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getRepairById, updateRepairStatus, cancelRepair } from '@/api/repairs'
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

interface Repair {
  _id: string
  orderId: string
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

const formatAddress = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const { street, city, state, zipCode, country } = addr;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
};

export default function RepairDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [repair, setRepair] = useState<Repair | null>(null)
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

  useEffect(() => {
    loadRepair()
    getDeviceTypes().then(r => r.success && setDeviceTypes(r.data))
    getBrands().then(r => r.success && setBrands(r.data))
    getModels().then(r => r.success && setModels(r.data))
  }, [id])

  const loadRepair = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await getRepairById(id)
      setRepair(response.repair as Repair)
    } catch (error) {
      console.error('Failed to load repair details:', error)
      enqueueSnackbar('Failed to load repair details', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!repair || !selectedStatus) return

    try {
      setUpdating(true)
      await updateRepairStatus(repair._id, { status: selectedStatus, notes: statusNotes })
      enqueueSnackbar('Repair status updated successfully', { variant: 'success' })
      await loadRepair()
      setShowStatusDialog(false)
      setSelectedStatus('')
      setStatusNotes('')
    } catch (error) {
      console.error('Failed to update status:', error)
      enqueueSnackbar('Failed to update repair status', { variant: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!repair) return

    try {
      setUpdating(true)
      await cancelRepair(repair._id, 'Cancelled by branch staff')
      enqueueSnackbar('Repair cancelled successfully', { variant: 'success' })
      await loadRepair()
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Failed to cancel repair:', error)
      enqueueSnackbar('Failed to cancel repair', { variant: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Repair-${repair?.orderId || repair?._id}`,
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
    documentTitle: `Warranty-${repair?.orderId || repair?._id}`,
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
    { value: 'pending', label: 'Beklemede' },
    { value: 'shipped', label: 'Kargoda' },
    { value: 'delivered', label: 'Kargo Alındı' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'cancelled', label: 'İptal Edildi' },
  ];

  const getStatusLabel = (status: string) => {
    if (status === 'in progress' || status === 'shipped') return 'Kargoda';
    if (status === 'delivered') return 'Kargo Alındı';
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
    if (!repair) return;
    try {
      setUpdating(true);
      // Kargoda seçildiyse backend'e 'shipped' gönder
      const backendStatus = status === 'in progress' ? 'shipped' : status;
      await updateRepairStatus(repair._id, { status: backendStatus });
      // Eğer tamamlandı ise ödeme durumunu da güncelle
      enqueueSnackbar('Repair status updated successfully', { variant: 'success' });
      await loadRepair();
    } catch (error) {
      enqueueSnackbar('Failed to update repair status', { variant: 'error' });
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

  if (!repair) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">Repair not found</p>
        <Button onClick={() => navigate('/repairs')} className="mt-4">
          Back to Repairs
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
              onClick={() => navigate('/repairs')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowBarcodeDialog(true)}>
              <Barcode className="h-4 w-4 mr-2" />
              Show Barcode
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Yazdır
            </Button>
            {repair.status === 'completed' && (
              <Button variant="outline" onClick={handleWarrantyPrint}>
                <Shield className="h-4 w-4 mr-2" />
                Garanti Yazdır
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {repair.status !== 'cancelled' && repair.status !== 'completed' && (
                  <>
                    <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                      Update Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
                      Cancel Repair
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate(`/customers/${repair.customerId._id}`)}>
                  View Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="bg-blue-600 text-white border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-white">Repair Summary</CardTitle>
              <Badge className={cn(getStatusColor(repair.status))}>{getStatusLabel(repair.status)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={repair.status === 'in progress' ? 'shipped' : repair.status}
                onValueChange={async (val) => {
                  setSelectedStatus(val);
                  setStatusNotes('');
                  await handleStatusUpdateDirect(val);
                }}
                disabled={updating}
              >
                <SelectTrigger className="w-36">
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mx-auto" />
                  ) : (
                    <SelectValue placeholder="Durum değiştir" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-blue-100">Repair Number</p>
              <p className="font-medium text-white">{repair.orderId || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-100">Branch</p>
              <p className="font-medium text-white">{getDisplayName(repair.branch?.name)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-100">Created At</p>
              <p className="font-medium text-white">{formatDate(repair.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-blue-500">
          <CardHeader>
            <CardTitle className="text-white">Products & Payment</CardTitle>
            <CardDescription className="text-blue-100">Product and payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Device Info */}
            <div className="mb-2">
              <div className="font-semibold text-white">Device</div>
              <div className="text-blue-100 text-sm">
                {getDeviceTypeName(repair.device?.deviceTypeId)} / {getBrandName(repair.device?.brandId)} {getModelName(repair.device?.modelId)}
              </div>
            </div>
            <div className="space-y-2">
              {(repair.items ?? []).map((it: any, idx: number) => (
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
              <p className="font-medium text-white">Total Amount</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(repair.payment.totalAmount ?? 0)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">Deposit</p>
              <p className="font-medium text-white">
                {formatCurrency(repair.payment.depositAmount ?? 0)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">Remaining</p>
              <p className="font-medium text-white">
                {formatCurrency(repair.payment.remainingAmount ?? 0)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">Central Payment Total</p>
              <p className="font-medium text-white">{repair.totalCentralPayment !== undefined ? formatCurrency(repair.totalCentralPayment) : '-'}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-100">Branch Profit Total</p>
              <p className="font-medium text-white">{repair.totalBranchProfit !== undefined ? formatCurrency(repair.totalBranchProfit) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white text-slate-900 border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Müşteri Bilgileri</CardTitle>
            <CardDescription className="text-slate-500">Müşteriye ait detaylar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-semibold">Ad Soyad:</span> {repair.customerId?.name || '-'}
            </div>
            <div>
              <span className="font-semibold">Telefon:</span> {repair.customerId?.phone || '-'}
            </div>
            {repair.customerId?.email && (
              <div>
                <span className="font-semibold">E-posta:</span> {repair.customerId.email}
              </div>
            )}
            {repair.customerId?.address && (
              <div>
                <span className="font-semibold">Adres:</span> {formatAddress(repair.customerId.address)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-blue-500">
          <CardHeader>
            <CardTitle className="text-white">Customer Information</CardTitle>
            <CardDescription className="text-blue-100">Customer and loaned device information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {repair.isLoanedDeviceGiven && (
              <Card className="bg-red-600 text-white border-red-500">
                <CardHeader>
                  <CardTitle className="text-white">Loaned Device</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {repair.loanedDevice?.deviceTypeId ? getDeviceTypeName(repair.loanedDevice.deviceTypeId) : ''} / {repair.loanedDevice?.brandId ? getBrandName(repair.loanedDevice.brandId) : ''} {repair.loanedDevice?.modelId ? getModelName(repair.loanedDevice.modelId) : ''}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card className="bg-amber-200 text-amber-900 border-amber-400">
          <CardHeader>
            <CardTitle className="text-amber-900">Status History</CardTitle>
            <CardDescription className="text-amber-800">Timeline of repair status changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(repair.statusHistory ?? []).map((status, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-2',
                        getStatusColor(status.status),
                        'bg-amber-500 border border-amber-700'
                      )}
                    />
                    {index !== (repair.statusHistory ?? []).length - 1 && (
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
                      {status.user && (status.user.fullName || status.user.email) ? `${status.user.fullName || ''} ${status.user.email ? `<${status.user.email}>` : ''}` : 'User Information Missing'}
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
          {repair && (
            <div className="space-y-4" style={{ paddingBottom: '40mm' }}>
              <div className="border-b pb-2">
                <div className="flex justify-between items-start">
                  {/* Logo */}
                  <img src={`${window.location.origin}/brands/smartpunkt.jpg`} alt="Smart Punkt GmbH" className="h-20 w-20 object-contain" />
                  {/* Center titles */}
                  <div className="flex-1 text-center">
                    <p className="font-semibold">Smart Punkt GmbH</p>
                    <h2 className="text-lg font-bold">Repair Order Receipt</h2>
                    <p className="text-sm">
                      Order Date: {new Date(repair.createdAt || Date.now()).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} , Order Number: {repair.orderId}
                    </p>
                  </div>
                  {/* QR code with order number */}
                  <QRCodeSVG value={repair.orderId} size={64} />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {/* Kunde */}
                <div className="border-b pb-1">
                  <p className="font-semibold">Customer</p>
                  <p>{getDisplayNameDe(repair.customerId?.name)}</p>
                  <p>{repair.customerId?.phone}</p>
                  {repair.customerId?.email && <p>{repair.customerId.email}</p>}
                </div>
                {/* Bestellung Teile */}
                <div className="border-b pb-1">
                  <p className="font-semibold">Repair Items</p>
                  <p>{getDeviceTypeName(repair.device?.deviceTypeId)} / {getBrandName(repair.device?.brandId)} {getModelName(repair.device?.modelId)}</p>
                  {(repair.items ?? []).map((it: any, idx: number) => (
                    <p key={idx}>• {getDisplayNameDe(it.name)} x{it.quantity}</p>
                  ))}
                </div>
                {/* Zahlung */}
                <div className="border-b pb-1">
                  <p className="font-semibold">Payment</p>
                  <p>Deposited: {formatCurrency(repair.payment?.depositAmount ?? 0)}</p>
                  <p>Remaining Amount: {formatCurrency(repair.payment?.remainingAmount ?? 0)}</p>
                </div>
                {repair.isLoanedDeviceGiven && (
                  <div className="border-b pb-1">
                    <p className="font-semibold">Loaned Device</p>
                    <p>{getDeviceTypeName(repair.loanedDevice?.deviceTypeId)} / {getBrandName(repair.loanedDevice?.brandId)} {getModelName(repair.loanedDevice?.modelId)}</p>
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
          {repair && (
            <div className="space-y-4">
              <div className="text-center border-b pb-2">
                <h2 className="text-2xl font-bold">Garantieschein</h2>
                <p className="text-sm">Order Number (Repair No): {repair.orderId}</p>
                <div className="flex justify-center my-2">
                  <QRCodeSVG value={repair.orderId} size={80} />
                </div>
                <p className="text-xs">Ausstellungsdatum: {new Date().toLocaleDateString('de-DE')}</p>
                <p className="text-xs">Ablaufdatum: {(() => { const end = new Date(); end.setMonth(end.getMonth() + 6); return end.toLocaleDateString('de-DE'); })()}</p>
              </div>
              <div className="space-y-2">
                <div className="border-b pb-2">
                  <p className="font-semibold">Customer</p>
                  <p>{repair.customerId?.name}</p>
                  <p>{repair.customerId?.phone}</p>
                  {repair.customerId?.address && (
                    <p className="text-sm">{repair.customerId.address.street}, {repair.customerId.address.city}</p>
                  )}
                </div>
                <div className="border-b pb-2">
                  <p className="font-semibold">Gerät</p>
                  <p>{getDeviceTypeName(repair.device?.deviceTypeId)} / {getBrandName(repair.device?.brandId)} {getModelName(repair.device?.modelId)}</p>
                  <p className="text-sm">Seriennummer: {repair.device?.serialNumber}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-semibold">Garantierte Teile</p>
                  {(repair.items ?? []).length > 0 ? (
                    <ul className="list-disc ml-6">
                      {(repair.items ?? []).map((it: any, idx: number) => (
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
              <DialogTitle>Barcode</DialogTitle>
              <DialogDescription>
                Scan this barcode to quickly access this repair
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 gap-2">
              <QRCodeSVG value={`${window.location.origin}/repairs/${repair._id}`} size={200} />
              <div className="mt-2 text-center">
                <span className="block text-sm text-blue-100">Repair No</span>
                <span className="block text-lg font-bold text-blue-50">{repair.orderId || '-'}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Repair Status</AlertDialogTitle>
              <AlertDialogDescription>
                Select the new status and add any notes about the update
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status update..."
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Repair</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this repair? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={updating}
                className="bg-red-600 hover:bg-red-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Repair'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}