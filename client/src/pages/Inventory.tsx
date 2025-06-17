import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getInventory, updateProductStock, updatePart } from '@/api/inventory'
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes'
import { getBrands, type Brand } from '@/api/brands'
import { getModels, type Model as ApiModel } from '@/api/models'
import { getBranches, type Branch } from '@/api/branches'
import { Search, Package, AlertTriangle, Plus, Minus, Building, Loader2, Filter, X, Pencil, Eye, Wrench, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { BrandIcon } from '@/components/BrandIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageContainer } from '@/components/PageContainer'
import { useSnackbar } from 'notistack'
import { hasPermission, isAdmin } from '@/utils/permissions'

interface BranchPart {
  _id: string;
  name: {
    tr: string;
    de: string;
    en: string;
  };
  category: string;
  brandId: {
    _id: string;
    name: string;
  };
  modelId: {
    _id: string;
    name: {
      tr: string;
      de: string;
      en: string;
    } | string;
  };
  deviceTypeId: {
    _id: string;
    name: string | { tr?: string; en?: string; de?: string };
  };
  branch_stock: number;
  branch_minStockLevel: number;
  branch_cost: number;
  branch_price: number;
  branch_margin: number;
  branch_shelfNumber: string;
  isActive: boolean;
  price?: {
    amount: number;
  };
  branch_serviceFee?: {
    amount: number;
    currency: 'EUR';
  };
}

interface PartUpdateData {
  branch_stock: number;
  branch_minStockLevel: number;
  branch_cost: number;
  branch_price: number;
  branch_margin: number;
  branch_shelfNumber: string;
  branch_serviceFee: {
    amount: number;
    currency: 'EUR';
  };
}

// Helper function to get display name from any name field (string or object)
const getDisplayName = (name: string | { tr?: string; en?: string; de?: string; } | undefined): string => {
  if (!name) return 'İsimsiz';
  if (typeof name === 'string') return name;
  return name.tr || name.en || name.de || 'İsimsiz';
};

export function Inventory() {
  // Hooks
  const { user, isAuthenticated } = useAuth();
  const { branch } = useBranch();
  const { enqueueSnackbar } = useSnackbar();

  // States for filter data
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<ApiModel[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Filter states
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [selectedBranch, setSelectedBranch] = useState<string>('all')

  // States
  const [parts, setParts] = useState<BranchPart[]>([])
  const [filteredParts, setFilteredParts] = useState<BranchPart[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPart, setSelectedPart] = useState<BranchPart | null>(null)
  const [stockAdjustment, setStockAdjustment] = useState(0)
  const [editingPart, setEditingPart] = useState<BranchPart | null>(null)
  const [updateData, setUpdateData] = useState<PartUpdateData>({
    branch_stock: 0,
    branch_minStockLevel: 0,
    branch_cost: 0,
    branch_price: 0,
    branch_margin: 0,
    branch_shelfNumber: '',
    branch_serviceFee: {
      amount: 0,
      currency: 'EUR'
    }
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [viewingPart, setViewingPart] = useState<BranchPart | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage)
  
  // Calculate current page items
  const currentItems = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Check if user is admin
  const isAdminUser = isAdmin(user)

  // Erişim kontrolü
  if (!user) {
    return <div>Giriş yapmalısınız.</div>;
  }
  if (!isAdminUser && !hasPermission(user, 'inventory', 'read')) {
    return <div>Envanter görüntüleme yetkiniz yok.</div>;
  }

  // Şube filtreleme: admin değilse sadece kendi şubesini görebilsin
  const branchId = isAdminUser ? undefined : user.branchId;

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🎯 Inventory Page Loaded for user:', {
        isAuthenticated,
        userEmail: user?.email,
        userRole: user?.role,
        isAdmin: isAdminUser,
        branchId: user?.branchId,
        branchName: branch?.name,
        branchObject: branch,
        userObject: user
      });
      
      fetchInventory();
    }
  }, [isAuthenticated, user, branch]);

    const fetchInventory = async () => {
    console.log('🔍 fetchInventory called with:', {
      branchId: branch?._id,
      branchName: branch?.name,
      userBranchId: user?.branchId,
      userRole: user?.role
    });

    if (!branch?._id) {
      console.error('❌ Branch ID is missing:', { branch, user });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getInventory(branch._id);
      const partsData = response.data;
      console.log("API'den gelen parts:", partsData);
      if (partsData && partsData.length > 0) {
        console.log('İlk part:', partsData[0]);
      }
      setParts(partsData);
      setFilteredParts(partsData);
      
      console.log('📦 Inventory loaded:', {
        totalParts: partsData.length,
        branchName: branch?.name,
        branchId: branch?._id
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoadingFilters(true)
        const [deviceTypesRes, brandsRes, modelsRes, branchesRes] = await Promise.all([
          getDeviceTypes(),
          getBrands({ includeInactive: false }), // Only get active brands
          getModels(),
          isAdminUser ? getBranches() : Promise.resolve({ success: true, data: [branch] })
        ])

        if (deviceTypesRes.success) {
          setDeviceTypes(deviceTypesRes.data.filter((dt: DeviceType) => dt.isActive))
        }
        if (brandsRes.success) {
          setBrands(brandsRes.data)
        }
        if (modelsRes.success) {
          setModels(modelsRes.data.filter((model: ApiModel) => model.isActive))
        }
        if (branchesRes.success) {
          setBranches((branchesRes.data || []) as Branch[])
          // Admin değilse kendi şubesini seç
          if (!isAdminUser && branch) {
            setSelectedBranch(branch._id)
          }
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      } finally {
        setLoadingFilters(false)
      }
    }

    if (isAuthenticated) {
      fetchFilterData()
    }
  }, [isAuthenticated, isAdminUser, branch])

  // Get filtered models based on selected brand
  const filteredModels = useMemo(() => {
    if (selectedBrand === 'all') {
      return []
    }
    return models
      .filter(model => model && model.brandId === selectedBrand && model.name)
      .sort((a, b) => getDisplayName(a.name as any).localeCompare(getDisplayName(b.name as any)))
  }, [models, selectedBrand])

  // Reset model selection when brand changes
  useEffect(() => {
    setSelectedModel('all')
  }, [selectedBrand])

  // Get filtered brands based on selected device type
  const filteredBrands = useMemo(() => {
    if (selectedDeviceType === 'all') {
      return brands
    }
    // Filter brands that have the selected device type
    return brands.filter(brand => 
      brand.deviceTypeId === selectedDeviceType || 
      brand.deviceType === selectedDeviceType
    )
  }, [brands, selectedDeviceType])

  // Reset brand and model selection when device type changes
  useEffect(() => {
    setSelectedBrand('all')
    setSelectedModel('all')
  }, [selectedDeviceType])

  // Filter logic
  useEffect(() => {
    const filtered = parts.filter(part => {
      // Search term matching for all columns
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || (
        // Parça adı ve kategorisi
        part.name.tr.toLowerCase().includes(searchTermLower) ||
        part.name.de.toLowerCase().includes(searchTermLower) ||
        part.name.en.toLowerCase().includes(searchTermLower) ||
        part.category.toLowerCase().includes(searchTermLower) ||
        // Marka
        part.brandId.name.toLowerCase().includes(searchTermLower) ||
        // Model
        (typeof part.modelId?.name === 'string' 
          ? part.modelId.name.toLowerCase().includes(searchTermLower)
          : (part.modelId?.name?.tr || '').toLowerCase().includes(searchTermLower) ||
            (part.modelId?.name?.en || '').toLowerCase().includes(searchTermLower) ||
            (part.modelId?.name?.de || '').toLowerCase().includes(searchTermLower)) ||
        // Cihaz tipi
        (typeof part.deviceTypeId?.name === 'string'
          ? part.deviceTypeId.name.toLowerCase().includes(searchTermLower)
          : (part.deviceTypeId?.name?.tr || '').toLowerCase().includes(searchTermLower) ||
            (part.deviceTypeId?.name?.en || '').toLowerCase().includes(searchTermLower) ||
            (part.deviceTypeId?.name?.de || '').toLowerCase().includes(searchTermLower)) ||
        // Stok ve fiyat bilgileri
        part.branch_stock.toString().includes(searchTermLower) ||
        part.branch_price.toString().includes(searchTermLower) ||
        (part.price?.amount || '').toString().includes(searchTermLower) ||
        // Raf numarası
        part.branch_shelfNumber.toLowerCase().includes(searchTermLower)
      );

      // Device type and brand filtering
      const matchesDeviceType = selectedDeviceType === 'all' || part.deviceTypeId._id === selectedDeviceType;
      const matchesBrand = selectedBrand === 'all' || part.brandId._id === selectedBrand;
      const matchesModel = selectedModel === 'all' || part.modelId?._id === selectedModel;
      const matchesBranch = true;

      // Tüm filtreleri birlikte uygula ve arama terimi boşsa arama filtresini atla
      return matchesSearch && matchesDeviceType && matchesBrand && matchesModel && matchesBranch;
    });

    // Sort by part name
    const sortedParts = [...filtered].sort((a, b) => {
      const nameA = getDisplayName(a.name);
      const nameB = getDisplayName(b.name);
      return nameA.localeCompare(nameB);
    });

    setFilteredParts(sortedParts);
    setCurrentPage(1);
  }, [parts, searchTerm, selectedDeviceType, selectedBrand, selectedModel, selectedBranch]);

  const clearFilters = () => {
    setSelectedDeviceType('all')
    setSelectedBrand('all')
    setSelectedModel('all')
    setSelectedBranch(isAdminUser ? 'all' : branch?._id || 'all')
    setSearchTerm('')
  }

  const getStockStatus = (part: BranchPart) => {
    if (part.branch_stock === 0) {
      return { label: 'Stokta Yok', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    } else if (part.branch_stock <= part.branch_minStockLevel) {
      return { label: 'Düşük Stok', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
    } else {
      return { label: 'Stokta', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
    }
  }

  const handleStockUpdate = async (partId: string, type: 'add' | 'remove') => {
    if (stockAdjustment <= 0) return

    try {
      const response = await updateProductStock(partId, { quantity: stockAdjustment, type })
      const updatedPart = response.data

      setParts(prev => prev.map(part => 
        part._id === updatedPart._id ? updatedPart : part
      ))

      setStockAdjustment(0)
      setSelectedPart(null)
    } catch (error) {
    }
  }

  const handleEditClick = (part: BranchPart) => {
    setEditingPart(part)
    setUpdateData({
      branch_stock: part.branch_stock,
      branch_minStockLevel: part.branch_minStockLevel,
      branch_cost: part.branch_cost,
      branch_price: part.branch_price,
      branch_margin: part.branch_margin,
      branch_shelfNumber: part.branch_shelfNumber,
      branch_serviceFee: part.branch_serviceFee || { amount: 0, currency: 'EUR' }
    })
  }

  const handleUpdatePart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPart || !branch?._id) {
      enqueueSnackbar('Parça veya şube bilgisi eksik', { variant: 'error' });
      return;
    }

    setIsUpdating(true);
    try {
      // Create the update data object with all the necessary fields
      const updatePayload = {
        branchId: branch._id,
        branch_stock: Number(updateData.branch_stock),
        branch_minStockLevel: Number(updateData.branch_minStockLevel),
        branch_cost: Number(updateData.branch_cost),
        branch_price: Number(updateData.branch_price),
        branch_margin: Number(updateData.branch_margin),
        branch_shelfNumber: updateData.branch_shelfNumber,
        branch_serviceFee: {
          amount: Number(updateData.branch_serviceFee.amount),
          currency: 'EUR'
        }
      };

      console.log('Sending update payload:', updatePayload);

      const response = await updatePart(editingPart._id, updatePayload, branch._id);
      
      if (response.success) {
        // Parçaları backend'den tekrar çek
        await fetchInventory();
        setEditingPart(null);
        enqueueSnackbar('Parça başarıyla güncellendi', { variant: 'success' });
      } else {
        enqueueSnackbar(response.message || 'Parça güncellenemedi', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating part:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Parça güncellenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to get model display name
  const getModelDisplayName = (modelId: { _id: string; name: string | { tr?: string; en?: string; de?: string; } } | undefined) => {
    if (!modelId) return 'Model Yok';
    return getDisplayName(modelId.name);
  };

  // Helper function to get device type display name
  const getDeviceTypeDisplayName = (deviceTypeId: { _id: string; name: string | { tr?: string; en?: string; de?: string; } } | undefined) => {
    if (!deviceTypeId) return 'Cihaz Tipi Yok';
    return getDisplayName(deviceTypeId.name);
  };

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
    <PageContainer title="Envanter Yönetimi" description="Şube envanterinizi yönetin.">
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Envanter Yönetimi</h1>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-blue-600">
              📍 {branch?.name || 'Şube Yükleniyor...'}
            </p>
            <p className="text-gray-600">
              Şube Kodu: {branch?.code || 'Yükleniyor...'} • {filteredParts.length} parça
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchInventory}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Yenile
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Ara (parça adı, kategori, marka, model, cihaz tipi, stok, fiyat, raf no)..."
                className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              title="Filtreleri Temizle"
            >
              <X className="h-4 w-4" />
            </Button>
                    </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Şube Filtresi - Sadece admin için göster */}
            {isAdminUser && (
              <div className="space-y-2">
                <Label>Şube</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent className="custom-select-content">
                    <SelectItem
                      value="all"
                      className={`custom-select-item${selectedBranch === "all" ? " selected" : ""}`}
                    >
                      Tüm Şubeler
                    </SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id} className="custom-select-item">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  </div>
            )}

            {/* Mevcut filtreler */}
            <div className="space-y-2">
              <Label>Cihaz Tipi</Label>
              <Select
                value={selectedDeviceType}
                onValueChange={setSelectedDeviceType}
                disabled={loadingFilters}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={loadingFilters ? "Yükleniyor..." : "Cihaz Tipi"} />
                </SelectTrigger>
                <SelectContent className="custom-select-content">
                  <SelectItem
                    value="all"
                    className={`custom-select-item${selectedDeviceType === "all" ? " selected" : ""}`}
                  >
                    Tüm Cihaz Tipleri
                  </SelectItem>
                  {deviceTypes
                    .filter(dt => dt && dt.isActive)
                    .sort((a, b) => getDisplayName(a?.name as any).localeCompare(getDisplayName(b?.name as any)))
                    .map((dt) => (
                      <SelectItem key={dt._id} value={dt._id} className="custom-select-item">
                        {dt?.name || 'İsimsiz Cihaz Tipi'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
                </div>

                <div className="space-y-2">
              <Label>Marka</Label>
              <Select
                value={selectedBrand}
                onValueChange={setSelectedBrand}
                disabled={loadingFilters || selectedDeviceType === 'all'}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={
                    loadingFilters 
                      ? "Yükleniyor..." 
                      : selectedDeviceType === 'all' 
                        ? "Önce cihaz tipi seçin" 
                        : "Marka"
                  } />
                </SelectTrigger>
                <SelectContent className="custom-select-content">
                  <SelectItem
                    value="all"
                    className={`custom-select-item${selectedBrand === "all" ? " selected" : ""}`}
                  >
                    Tüm Markalar
                  </SelectItem>
                  {filteredBrands
                    .filter(brand => brand)
                    .sort((a, b) => getDisplayName(a?.name as any).localeCompare(getDisplayName(b?.name as any)))
                    .map((brand) => (
                      <SelectItem key={brand._id} value={brand._id} className="custom-select-item">
                        {brand?.name || 'İsimsiz Marka'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
                </div>

                <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={loadingFilters || selectedBrand === 'all'}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={
                    loadingFilters 
                      ? "Yükleniyor..." 
                      : selectedBrand === 'all' 
                        ? "Önce marka seçin" 
                        : "Model"
                  } />
                </SelectTrigger>
                <SelectContent className="custom-select-content">
                  <SelectItem
                    value="all"
                    className={`custom-select-item${selectedModel === "all" ? " selected" : ""}`}
                  >
                    Tüm Modeller
                  </SelectItem>
                  {filteredModels
                    .filter(model => model)
                    .sort((a, b) => getDisplayName(a?.name as any).localeCompare(getDisplayName(b?.name as any)))
                    .map((model) => (
                      <SelectItem key={model._id} value={model._id} className="custom-select-item">
                        {model?.name || 'İsimsiz Model'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show active filters */}
          {(selectedDeviceType !== 'all' || selectedBrand !== 'all' || selectedModel !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedDeviceType !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Cihaz Tipi: {deviceTypes.find(dt => dt._id === selectedDeviceType)?.name || 'Bilinmeyen'}
                  <button
                    onClick={() => setSelectedDeviceType('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedBrand !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Marka: {brands.find(b => b._id === selectedBrand)?.name || 'Bilinmeyen'}
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedModel !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Model: {models.find(m => m._id === selectedModel)?.name || 'Bilinmeyen'}
                  <button
                    onClick={() => setSelectedModel('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                      </Badge>
                    )}
                  </div>
          )}
        </CardContent>
      </Card>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marka</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Parça Adı</TableHead>
                <TableHead>Cihaz Tipi</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Satış Fiyatı</TableHead>
                <TableHead>Teknik Servis Ücreti</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead>Raf No</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((part) => {
                const serviceFee = part.branch_serviceFee?.amount || 0;
                const total = (part.branch_price || 0) + serviceFee;
                let badgeVariant: any = getStockStatus(part).color;
                if (!['default', 'success', 'destructive', 'outline', 'secondary'].includes(badgeVariant)) {
                  badgeVariant = 'secondary';
                }
                return (
                  <TableRow key={part._id}>
                    <TableCell>{part.brandId.name}</TableCell>
                    <TableCell>{getModelDisplayName(part.modelId)}</TableCell>
                    <TableCell>{getDisplayName(part.name)}</TableCell>
                    <TableCell>{getDeviceTypeDisplayName(part.deviceTypeId)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant}>
                        {part.branch_stock}
                      </Badge>
                    </TableCell>
                    <TableCell>{part.branch_price} ₺</TableCell>
                    <TableCell>{serviceFee} ₺</TableCell>
                    <TableCell>{total} ₺</TableCell>
                    <TableCell>{part.branch_shelfNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(part)}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Teknik Servis (Wrench) ikonu: Sadece stok > 0 ise göster */}
                        {part.branch_stock > 0 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedPart(part)}
                            title="Teknik Servis"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Sipariş (ShoppingCart) ikonu: Her zaman göster */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {/* Sipariş işlemi burada */}}
                          title="Sipariş Ver"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setViewingPart(part)}
                          title="Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Part Dialog */}
      <Dialog open={!!editingPart} onOpenChange={() => setEditingPart(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Parça Düzenle</DialogTitle>
            <DialogDescription>
              {editingPart ? getDisplayName(editingPart.name) : ''} parçasının bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePart}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stok
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  className="col-span-3"
                  value={updateData.branch_stock}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setUpdateData(prev => ({
                      ...prev,
                      branch_stock: value
                    }));
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minStock" className="text-right">
                  Min. Stok
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  className="col-span-3"
                  value={updateData.branch_minStockLevel}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setUpdateData(prev => ({
                      ...prev,
                      branch_minStockLevel: value
                    }));
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Maliyet
                </Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-3"
                  value={updateData.branch_cost}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setUpdateData(prev => ({
                      ...prev,
                      branch_cost: value
                    }));
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Satış Fiyatı
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-3"
                  value={updateData.branch_price}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setUpdateData(prev => ({
                      ...prev,
                      branch_price: value
                    }));
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="margin" className="text-right">
                  Marj (%)
                </Label>
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="col-span-3"
                  value={updateData.branch_margin}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setUpdateData(prev => ({
                      ...prev,
                      branch_margin: value
                    }));
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceFee" className="text-right">
                  Servis Ücreti
                </Label>
                <Input
                  id="serviceFee"
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-3"
                  value={updateData.branch_serviceFee.amount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setUpdateData(prev => ({
                      ...prev,
                      branch_serviceFee: {
                        ...prev.branch_serviceFee,
                        amount: value
                      }
                    }));
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shelfNumber" className="text-right">
                  Raf No
                </Label>
                <Input
                  id="shelfNumber"
                  className="col-span-3"
                  value={updateData.branch_shelfNumber}
                  onChange={(e) => {
                    setUpdateData(prev => ({
                      ...prev,
                      branch_shelfNumber: e.target.value
                    }));
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPart(null)}
                disabled={isUpdating}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Güncelleniyor...
                  </>
                ) : (
                  'Güncelle'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Parça Detay Dialogu */}
      <Dialog open={!!viewingPart} onOpenChange={() => setViewingPart(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Parça Detayları</DialogTitle>
            <DialogDescription>
              {viewingPart ? getDisplayName(viewingPart.name) : ''} parçasının tüm detayları
            </DialogDescription>
          </DialogHeader>
          {viewingPart && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div><b>Marka:</b> {viewingPart.brandId.name}</div>
              <div><b>Model:</b> {getModelDisplayName(viewingPart.modelId)}</div>
              <div><b>Parça Adı:</b> {getDisplayName(viewingPart.name)}</div>
              <div><b>Kategori:</b> {viewingPart.category}</div>
              <div><b>Cihaz Tipi:</b> {getDeviceTypeDisplayName(viewingPart.deviceTypeId)}</div>
              <div><b>Stok:</b> {viewingPart.branch_stock}</div>
              <div><b>Min. Stok:</b> {viewingPart.branch_minStockLevel}</div>
              <div><b>Maliyet:</b> {viewingPart.branch_cost} ₺</div>
              <div><b>Satış Fiyatı:</b> {viewingPart.branch_price} ₺</div>
              <div><b>Marj:</b> %{viewingPart.branch_margin}</div>
              <div><b>Raf No:</b> {viewingPart.branch_shelfNumber}</div>
              <div><b>Teknik Servis Ücreti:</b> {viewingPart.branch_serviceFee?.amount} {viewingPart.branch_serviceFee?.currency}</div>
              <div><b>Aktif mi?:</b> {viewingPart.isActive ? 'Evet' : 'Hayır'}</div>
              {/* Diğer önemli alanlar eklenebilir */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and pages around current page
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
      </div>
      )}

      {/* Page Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredParts.length)} of {filteredParts.length} items
      </div>
    </div>
    </PageContainer>
  )
}