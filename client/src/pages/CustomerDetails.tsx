import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getCustomer, updateCustomer, deleteCustomer, Customer as CustomerType } from '@/api/customers'
import { useSnackbar } from 'notistack'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { getOrders } from '@/api/orders'
import dayjs from 'dayjs'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CreateOrder } from './CreateOrder'

interface CustomerFormData {
  name: string
  phone: string
  email?: string
  address?: string
}

const formatAddress = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const { street, city, state, zipCode, country } = addr;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
};

// Sipariş durumu Türkçeleştirme fonksiyonu
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

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [customer, setCustomer] = useState<CustomerType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>()
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderModalStep, setOrderModalStep] = useState(0)
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return

      try {
        const response = await getCustomer(id)
        if (response.success && response.data) {
          setCustomer(response.data)
          reset({
            name: response.data.name || '',
            phone: response.data.phone || '',
            email: response.data.email || '',
            address: typeof response.data.address === 'object'
              ? formatAddress(response.data.address)
              : (response.data.address || '')
          })
        }
      } catch (error) {
        enqueueSnackbar("Müşteri bilgileri alınamadı", { variant: "error" })
      } finally {
        setLoading(false)
      }
    }

    const fetchOrders = async () => {
      if (!id) return
      setOrdersLoading(true)
      try {
        const response = await getOrders({ customerId: id, page: 1, limit: 100 })
        if (response.orders) {
          setOrders(response.orders)
        }
      } catch (error) {
        enqueueSnackbar('Siparişler alınamadı', { variant: 'error' })
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchCustomer()
    fetchOrders()
  }, [id, reset, enqueueSnackbar])

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      if (!id) return
      const response = await updateCustomer(id, formData)
      if (response.success) {
        enqueueSnackbar("Müşteri bilgileri güncellendi", { variant: "success" })
        setCustomer(prev => prev ? { ...prev, ...formData } : null)
      }
    } catch (error) {
      enqueueSnackbar("Müşteri güncellenemedi", { variant: "error" })
    }
  }

  const handleDelete = async () => {
    try {
      if (!id) return
      const response = await deleteCustomer(id)
      if (response.success) {
        enqueueSnackbar("Müşteri silindi", { variant: "success" })
        navigate('/customers')
      }
    } catch (error) {
      enqueueSnackbar("Müşteri silinemedi", { variant: "error" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Müşteri Bulunamadı</h1>
          <Button onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Müşterilere Dön
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">{customer.name}</h1>
          <p className="text-muted-foreground text-lg">Müşteri Detayları</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Geri
          </Button>
          <Button variant="secondary" onClick={() => document.getElementById('customer-edit-form')?.scrollIntoView({behavior:'smooth'})}>
            <Save className="h-4 w-4 mr-2" /> Düzenle
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setOrderModalStep(0);
              setOrderModalOpen(true);
            }}
          >
            Sipariş Ekle
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Müşteri Bilgileri Kartı */}
        <div className="bg-white rounded-lg shadow p-6" id="customer-edit-form">
          <h2 className="text-xl font-semibold mb-4">Müşteri Bilgileri</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input id="name" {...register("name", { required: "Ad Soyad zorunludur" })} placeholder="Ad Soyad" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Telefon *</Label>
              <Input id="phone" {...register("phone", { required: "Telefon zorunludur", pattern: { value: /^[0-9]{10,11}$/, message: "Geçerli bir telefon numarası giriniz" } })} placeholder="5XX XXX XX XX" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" {...register("email", { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Geçerli bir e-posta adresi giriniz" } })} placeholder="ornek@email.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Input id="address" value={typeof customer.address === 'object' ? formatAddress(customer.address) : (customer.address || '')} readOnly placeholder="Adres" />
            </div>
            {customer.createdBy && (
              <div>
                <Label htmlFor="createdBy">Oluşturan Kullanıcı</Label>
                <Input id="createdBy" value={typeof customer.createdBy === 'object' && customer.createdBy !== null && 'fullName' in customer.createdBy ? ((customer.createdBy as any).fullName || '') : typeof customer.createdBy === 'string' ? customer.createdBy : ''} readOnly />
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="default">
                <Save className="h-4 w-4 mr-2" /> Kaydet
              </Button>
            </div>
          </form>
        </div>

        {/* Siparişler Kartı */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Siparişler</h2>
            <Button
              variant="default"
              onClick={() => {
                setOrderModalStep(0);
                setOrderModalOpen(true);
              }}
            >
              Sipariş Ekle
            </Button>
          </div>
          {ordersLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">Bu müşteriye ait sipariş bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Sipariş No</th>
                    <th className="border px-2 py-1">Durum</th>
                    <th className="border px-2 py-1">Tutar</th>
                    <th className="border px-2 py-1">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      <td className="py-2 px-4 text-center">{order.orderId || order.orderNumber || '-'}</td>
                      <td className="py-2 px-4 text-center">{getStatusText(order.status)}</td>
                      <td className="py-2 px-4 text-center">{order.payment?.totalAmount != null ? order.payment.totalAmount : '-'}</td>
                      <td className="py-2 px-4 text-center">{order.createdAt ? dayjs(order.createdAt).format('DD.MM.YYYY HH:mm:ss') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="w-full max-w-3xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6 flex flex-col justify-center items-center">
          <CreateOrder />
        </DialogContent>
      </Dialog>
    </div>
  )
}