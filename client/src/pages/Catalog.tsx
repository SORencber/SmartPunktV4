import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getCatalogProducts, addCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '@/api/catalog'
import { getDeviceModels } from '@/api/products'
import { useSnackbar } from 'notistack'
import { useForm, Controller } from 'react-hook-form'
import { Search, Plus, Edit, Trash2, Package, DollarSign, TrendingUp, Smartphone, Laptop, Tablet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface CatalogProduct {
  _id: string
  name: string
  type: string
  brand: string
  model: string
  purchasePrice: number
  sellingPrice: number
  stockQuantity: number
  createdAt: string
  updatedAt: string
}

interface ProductForm {
  name: string
  type: string
  brand: string
  model: string
  purchasePrice: number
  sellingPrice: number
  stockQuantity: number
}

interface DeviceModel {
  _id: string
  name: string
  compatibility: string[]
}

export function Catalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null)
  const [availableModels, setAvailableModels] = useState<DeviceModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<ProductForm>({
    defaultValues: {
      name: '',
      type: '',
      brand: '',
      model: '',
      purchasePrice: 0,
      sellingPrice: 0,
      stockQuantity: 0
    }
  })

  const watchedType = watch('type')
  const watchedBrand = watch('brand')
  const watchedModel = watch('model')
  const watchedPurchasePrice = watch('purchasePrice')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getCatalogProducts()
        const productData = (response as any).products
        setProducts(productData)
        setFilteredProducts(productData)
      } catch (error) {
        enqueueSnackbar("Error", {
          variant: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [enqueueSnackbar])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  useEffect(() => {
    if (watchedType && watchedBrand) {
      fetchDeviceModels()
    } else {
      setAvailableModels([])
    }
  }, [watchedType, watchedBrand])

  useEffect(() => {
    if (watchedModel && watchedType && watchedBrand) {
      const productName = `${watchedBrand.charAt(0).toUpperCase() + watchedBrand.slice(1)} ${watchedModel} Parts`
      setValue('name', productName)
    }
  }, [watchedModel, watchedType, watchedBrand, setValue])

  useEffect(() => {
    if (watchedPurchasePrice > 0) {
      const suggestedSellingPrice = Math.round(watchedPurchasePrice * 1.65 * 100) / 100
      setValue('sellingPrice', suggestedSellingPrice)
    }
  }, [watchedPurchasePrice, setValue])

  const fetchDeviceModels = async () => {
    if (!watchedType || !watchedBrand) return

    setLoadingModels(true)
    try {
      const response = await getDeviceModels(watchedType, watchedBrand)
      setAvailableModels((response as any).models)
    } catch (error) {
      console.error('Failed to fetch models:', error)
      setAvailableModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  const onSubmit = async (data: ProductForm) => {
    try {
      if (editingProduct) {
        const response = await updateCatalogProduct(editingProduct._id, data)
        const updatedProduct = (response as any).product
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? { ...p, ...updatedProduct } : p))
        enqueueSnackbar("Product updated successfully", {
          variant: "success",
        })
      } else {
        const response = await addCatalogProduct(data)
        const newProduct = (response as any).product
        setProducts(prev => [newProduct, ...prev])
        enqueueSnackbar("Product added to catalog successfully", {
          variant: "success",
        })
      }
      
      setIsDialogOpen(false)
      setEditingProduct(null)
      reset()
    } catch (error) {
      enqueueSnackbar("Error", {
        variant: "error",
      })
    }
  }

  const handleEdit = (product: CatalogProduct) => {
    setEditingProduct(product)
    setValue('name', product.name)
    setValue('type', product.type)
    setValue('brand', product.brand)
    setValue('model', product.model)
    setValue('purchasePrice', product.purchasePrice)
    setValue('sellingPrice', product.sellingPrice)
    setValue('stockQuantity', product.stockQuantity)
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await deleteCatalogProduct(productId)
      setProducts(prev => prev.filter(p => p._id !== productId))
      enqueueSnackbar("Product deleted successfully", {
        variant: "success",
      })
    } catch (error) {
      enqueueSnackbar("Error", {
        variant: "error",
      })
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    reset()
    setAvailableModels([])
  }

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'phone':
        return <Smartphone className="w-5 h-5" />
      case 'computer':
        return <Laptop className="w-5 h-5" />
      case 'tablet':
        return <Tablet className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const getProfitMargin = (purchase: number | undefined, selling: number | undefined) => {
    if (!purchase || !selling || purchase === 0) return '0.0'
    return ((selling - purchase) / purchase * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white/50 dark:bg-slate-800/50 rounded-xl" />
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
            Product Catalog
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your product catalog with pricing and inventory
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Add a new product to your catalog'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Device Type</Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: 'Device type is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800">
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="computer">Computer</SelectItem>
                          <SelectItem value="ipad">iPad</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Controller
                    name="brand"
                    control={control}
                    rules={{ required: 'Brand is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800">
                          <SelectItem value="apple">Apple</SelectItem>
                          <SelectItem value="samsung">Samsung</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="oneplus">OnePlus</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.brand && (
                    <p className="text-sm text-red-600">{errors.brand.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Controller
                    name="model"
                    control={control}
                    rules={{ required: 'Model is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedType || !watchedBrand || loadingModels}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingModels ? "Loading models..." : "Select model"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800">
                          {availableModels.map((model) => (
                            <SelectItem key={model._id} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.model && (
                    <p className="text-sm text-red-600">{errors.model.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Product name is required' })}
                    placeholder="Product name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('purchasePrice', { 
                      required: 'Purchase price is required',
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    placeholder="0.00"
                  />
                  {errors.purchasePrice && (
                    <p className="text-sm text-red-600">{errors.purchasePrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('sellingPrice', { 
                      required: 'Selling price is required',
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    placeholder="0.00"
                  />
                  {errors.sellingPrice && (
                    <p className="text-sm text-red-600">{errors.sellingPrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    {...register('stockQuantity', { 
                      required: 'Stock quantity is required',
                      min: { value: 0, message: 'Quantity must be positive' }
                    })}
                    placeholder="0"
                  />
                  {errors.stockQuantity && (
                    <p className="text-sm text-red-600">{errors.stockQuantity.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search products by name, brand, model, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50/50 dark:bg-slate-700/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const profitMargin = getProfitMargin(product.purchasePrice, product.sellingPrice)

          return (
            <Card
              key={product._id}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                      {getDeviceIcon(product.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.brand} • {product.model}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {product.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Purchase:</span>
                      <span className="font-medium">{formatCurrency(product.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Selling:</span>
                      <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Stock:</span>
                      <span className="font-medium">{product.stockQuantity} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Margin:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {profitMargin}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Added: {formatDate(product.createdAt).split(',')[0]}</span>
                    {product.updatedAt !== product.createdAt && (
                      <span>Updated: {formatDate(product.updatedAt).split(',')[0]}</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(product._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No products found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first product to the catalog.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                Add First Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}