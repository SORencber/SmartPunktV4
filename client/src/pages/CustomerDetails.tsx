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

interface CustomerFormData {
  name: string
  phone: string
  email?: string
  address?: string
}

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [customer, setCustomer] = useState<CustomerType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>()

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return

      try {
        const response = await getCustomer(id)
        if (response.success && response.data) {
          setCustomer(response.data)
          reset({
            name: response.data.name,
            phone: response.data.phone,
            email: response.data.email,
            address: response.data.address
          })
        }
      } catch (error) {
        enqueueSnackbar("Müşteri bilgileri alınamadı", { variant: "error" })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Müşteri Detayları</h1>
          <p className="text-muted-foreground">Müşteri bilgilerini düzenleyin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Müşteriyi Sil
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="name">Ad Soyad *</Label>
          <Input
            id="name"
            {...register("name", { required: "Ad Soyad zorunludur" })}
            placeholder="Ad Soyad"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            {...register("phone", { 
              required: "Telefon zorunludur",
              pattern: {
                value: /^[0-9]{10,11}$/,
                message: "Geçerli bir telefon numarası giriniz"
              }
            })}
            placeholder="5XX XXX XX XX"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Geçerli bir e-posta adresi giriniz"
              }
            })}
            placeholder="ornek@email.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adres</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="Adres"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </form>
    </div>
  )
}