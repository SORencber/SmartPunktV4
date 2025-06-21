import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useSnackbar } from 'notistack';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, Building, CheckCircle, XCircle, AlertCircle, RefreshCw, CheckCircle2, PlusCircle, Package } from 'lucide-react';
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes';
import { getBrands } from '@/api/brands';
import { getPartsByBrand } from '@/api/parts';
import { BrandIcon } from '@/components/BrandIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { api } from '@/api/api';
import type { AxiosError } from 'axios';
import { PageContainer } from '@/components/PageContainer';

// Types
interface Brand {
  _id: string;
  name: any;
  icon?: string;
  deviceType?: string;
  deviceTypeId?: string;
  isActive: boolean;
  inventoryStatus?: {
    needsUpdate: boolean;
    lastPartUpdate: string | null;
    lastInventoryUpdate: string | null;
  };
}

interface Part {
  _id: string;
  modelId: string | { _id: string };
  brandId: string | { _id: string };
  deviceTypeId: string | { _id: string };
  category: string;
  name: {
    tr: string;
    de: string;
    en: string;
  };
  description?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
  compatibleWith?: string[];
  cost: number | { amount: number; currency: 'EUR' };
  margin: number;
  minStockLevel: number;
  price: number | { amount: number; currency: 'EUR' };
  shelfNumber: string;
  stock: number;
  serviceFee: {
    amount: number;
    currency: 'EUR';
  };
  branchId?: string;
}

const Products: React.FC = () => {
  // Hooks
  const { user, isAuthenticated } = useAuth();
  const { branch } = useBranch();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [inventoryProgress, setInventoryProgress] = useState<{
    isOpen: boolean;
    current: number;
    total: number;
    success: number;
    error: number;
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    isOpen: false,
    current: 0,
    total: 0,
    success: 0,
    error: 0,
    status: 'idle',
    message: ''
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'central_staff';

  // Add ref for initialization
  const initRef = useRef<boolean>(false);

  // Add a ref to track if we've checked inventory status
  const inventoryStatusCheckedRef = useRef<boolean>(false);

  // Load device types
  const loadDeviceTypes = useCallback(async () => {
    try {
      const response = await getDeviceTypes();
      if (response.success && response.data) {
        setDeviceTypes(response.data.filter((dt: DeviceType) => dt.isActive));
      }
    } catch (error) {
      console.error('Error loading device types:', error);
      enqueueSnackbar("Cihaz tipleri yüklenirken hata oluştu", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  // Load brands
  const loadBrands = useCallback(async () => {
    try {
      const response = await getBrands();
      if (response.success && response.data) {
        setBrands(response.data.filter((brand: Brand) => brand.isActive));
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      enqueueSnackbar("Markalar yüklenirken hata oluştu", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadDeviceTypes(), loadBrands()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      enqueueSnackbar("Veriler yüklenirken hata oluştu", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [loadDeviceTypes, loadBrands, enqueueSnackbar]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated && !initRef.current) {
      initRef.current = true;
      console.log('🎯 Products Page Loaded for user:', {
        isAuthenticated,
        userEmail: user?.email,
        userRole: user?.role,
        isAdmin
      });
      
      loadInitialData();
    }
  }, [isAuthenticated, user, isAdmin, loadInitialData]);

  // Filter brands based on search and device type
  useEffect(() => {
    const filtered = brands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDeviceType = selectedDeviceType === 'all' || brand.deviceTypeId === selectedDeviceType;
      return matchesSearch && matchesDeviceType;
    });
    setFilteredBrands(filtered);
  }, [brands, searchTerm, selectedDeviceType]);

  // Check inventory status for all brands
  const checkInventoryStatus = useCallback(async () => {
    if (!user?.branchId || inventoryStatusCheckedRef.current) return;

    try {
      inventoryStatusCheckedRef.current = true;
      console.log('🔍 Checking inventory status for brands...');
      
      const statusPromises = brands.map(async (brand) => {
        if (!brand._id) return null;
        
        const response = await api.get(`/api/branch-parts/status`, {
          params: {
            branchId: user.branchId,
            brandId: brand._id
          }
        });
        
        if (response.data.success) {
          return {
            brandId: brand._id,
            status: response.data.data
          };
        }
        return null;
      });

      const statuses = await Promise.all(statusPromises);
      
      setBrands(prevBrands => 
        prevBrands.map(brand => {
          const status = statuses.find(s => s?.brandId === brand._id);
          return {
            ...brand,
            inventoryStatus: status?.status
          };
        })
      );
    } catch (error) {
      console.error('Envanter durumu kontrol edilirken hata:', error);
      enqueueSnackbar("Envanter durumu kontrol edilirken bir hata oluştu", { variant: "error" });
    } finally {
      // Reset the ref after a delay to allow periodic rechecks
      setTimeout(() => {
        inventoryStatusCheckedRef.current = false;
      }, 60000); // Reset after 1 minute
    }
  }, [user?.branchId, enqueueSnackbar]);

  // Check inventory status when brands are loaded
  useEffect(() => {
    if (isAuthenticated && brands.length > 0 && !inventoryStatusCheckedRef.current) {
      checkInventoryStatus();
    }
  }, [isAuthenticated, brands.length, checkInventoryStatus]);

  // Update handleAddToInventory function
  const handleAddToInventory = async (brandId: string, deviceTypeId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      enqueueSnackbar("Oturum token'ı bulunamadı. Lütfen tekrar giriş yapın.", { variant: "error" });
      return;
    }

    if (!user?.branchId) {
      enqueueSnackbar("Şube bilgisi bulunamadı", { variant: "error" });
      return;
    }

    try {
      // İstek detaylarını logla
      console.log('📤 İstek Detayları:', {
        url: '/api/branch-parts',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        },
        branchId: user?.branchId,
        deviceTypeId,
        brandId
      });

      // İstek öncesi state güncelleme
      setInventoryProgress(prev => ({
        ...prev,
        isOpen: true,
        status: 'loading',
        message: 'Envanter güncelleniyor...'
      }));

      // Get all parts for this brand
      const response = await getPartsByBrand(brandId);
      console.log('API\'den gelen tüm parçalar:', response.data);
      
      // Debug: İlk parçanın yapısını kontrol et
      if (response.data && response.data.length > 0) {
        console.log('İlk parçanın detaylı yapısı:', {
          part: response.data[0],
          brandIdType: typeof response.data[0].brandId,
          brandIdValue: response.data[0].brandId,
          deviceTypeIdType: typeof response.data[0].deviceTypeId,
          deviceTypeIdValue: response.data[0].deviceTypeId
        });
      }

      const parts = response.data || [];

      if (parts.length === 0) {
        console.log('Bu marka için hiç parça bulunamadı');
        setInventoryProgress(prev => ({
          ...prev,
          status: 'error',
          message: 'Bu marka için parça bulunamadı'
        }));
        return;
      }

      // Filter parts that match the brandId and deviceTypeId
      const matchingParts = parts.filter(part => {
        // brandId ve deviceTypeId değerlerini güvenli bir şekilde al
        const partBrandId = typeof part.brandId === 'object' && part.brandId !== null 
          ? (part.brandId as any)._id 
          : part.brandId;
        const partDeviceTypeId = typeof part.deviceTypeId === 'object' && part.deviceTypeId !== null 
          ? (part.deviceTypeId as any)._id 
          : part.deviceTypeId;
        
        const matches = String(partBrandId) === String(brandId) && 
                       String(partDeviceTypeId) === String(deviceTypeId);
        
        console.log('Parça kontrolü:', {
          partId: part._id,
          partBrandId,
          partDeviceTypeId,
          expectedBrandId: brandId,
          expectedDeviceTypeId: deviceTypeId,
          matches
        });
        return matches;
      });

      console.log('Filtrelenmiş parçalar:', matchingParts);

      if (matchingParts.length === 0) {
        console.log('Bu marka ve cihaz tipi için eşleşen parça bulunamadı');
        setInventoryProgress(prev => ({
          ...prev,
          status: 'error',
          message: 'Bu marka ve cihaz tipi için parça bulunamadı'
        }));
        return;
      }

      setInventoryProgress(prev => ({
        ...prev,
        total: matchingParts.length,
        current: 0
      }));

      // Add matching parts to inventory
      const partsToAdd = matchingParts.map((part: Part) => {
        console.log('Parça detayları:', {
          original: {
            _id: part._id,
            modelId: part.modelId,
            brandId: part.brandId,
            deviceTypeId: part.deviceTypeId,
            category: part.category
          },
          populated: {
            modelId: typeof part.modelId === 'object' ? part.modelId._id : part.modelId,
            brandId: typeof part.brandId === 'object' ? part.brandId._id : part.brandId,
            deviceTypeId: typeof part.deviceTypeId === 'object' ? part.deviceTypeId._id : part.deviceTypeId
          }
        });

        // ObjectId'leri güvenli bir şekilde al
        const modelId = typeof part.modelId === 'object' ? part.modelId._id : part.modelId;
        const brandId = typeof part.brandId === 'object' ? part.brandId._id : part.brandId;
        const deviceTypeId = typeof part.deviceTypeId === 'object' ? part.deviceTypeId._id : part.deviceTypeId;

        // Ana parça alanlarını güncelle, branch_ alanlarını koru
        return {
          partId: part._id,
          modelId,
          brandId,
          deviceTypeId,
          category: part.category,
          name: typeof part.name === 'string' ? part.name : (part.name?.tr || part.name?.en || part.name?.de || ''),
          description: typeof part.description === 'string' ? part.description : (part.description?.tr || part.description?.en || part.description?.de || ''),
          barcode: part.barcode || '',
          qrCode: part.qrCode || '',
          isActive: part.isActive,
          compatibleWith: part.compatibleWith || [],
          cost: typeof part.cost === 'number' ? part.cost : part.cost?.amount || 0,
          margin: part.margin,
          minStockLevel: part.minStockLevel,
          price: typeof part.price === 'number' ? part.price : part.price?.amount || 0,
          shelfNumber: part.shelfNumber,
          stock: part.stock,
          updatedBy: user._id
        };
      });

      console.log('İlk parça örneği:', partsToAdd[0]);

      // Parçaları 50'lik gruplar halinde gönder
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < partsToAdd.length; i += BATCH_SIZE) {
        batches.push(partsToAdd.slice(i, i + BATCH_SIZE));
      }

      let successCount = 0;
      let errorCount = 0;
      let processedCount = 0;

      // İlk progress güncellemesi
      setInventoryProgress(prev => ({
        ...prev,
        total: partsToAdd.length,
        current: 0,
        success: 0,
        error: 0,
        status: 'loading',
        message: 'Envanter güncelleniyor...'
      }));

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          const response = await api.post('/api/branch-parts', {
            branchId: user.branchId,
            parts: batch
          });

          if (response.data.success) {
            successCount += batch.length;
          } else {
            errorCount += batch.length;
          }
          processedCount += batch.length;

          // Progress güncelle
          setInventoryProgress(prev => ({
            ...prev,
            current: processedCount,
            success: successCount,
            error: errorCount,
            status: processedCount >= partsToAdd.length ? 'success' : 'loading',
            message: processedCount >= partsToAdd.length
              ? `${successCount} parça başarıyla envantere eklendi${errorCount > 0 ? `, ${errorCount} parça eklenemedi` : ''}`
              : `Envanter güncelleniyor... (${processedCount}/${partsToAdd.length})`
          }));

        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          errorCount += batch.length;
          processedCount += batch.length;
          
          console.error('Envanter ekleme hatası:', {
            error: axiosError.message,
            status: axiosError.response?.status,
            data: axiosError.response?.data,
            batch: {
              index: i,
              size: batch.length,
              totalBatches: batches.length
            }
          });

          // Progress güncelle
          setInventoryProgress(prev => ({
            ...prev,
            current: processedCount,
            success: successCount,
            error: errorCount,
            status: processedCount >= partsToAdd.length ? 'error' : 'loading',
            message: processedCount >= partsToAdd.length
              ? `${successCount} parça başarıyla eklendi, ${errorCount} parça eklenemedi`
              : `Envanter güncelleniyor... (${processedCount}/${partsToAdd.length})`
          }));
        }
      }

      // İşlem sonucunu göster
      if (errorCount === 0) {
        setInventoryProgress(prev => ({
          ...prev,
          status: 'success',
          message: `${successCount} parça başarıyla envantere eklendi`
        }));
      } else {
        setInventoryProgress(prev => ({
          ...prev,
          status: errorCount === partsToAdd.length ? 'error' : 'success',
          message: `${successCount} parça başarıyla eklendi, ${errorCount} parça eklenemedi`
        }));
      }
      
      // Refresh inventory status
      await checkInventoryStatus();
    } catch (error) {
      console.error('Envanter ekleme hatası:', error);
      setInventoryProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Parçalar envantere eklenirken bir hata oluştu'
      }));
    }
  };

  const getInventoryStatusBadge = (brand: Brand) => {
    if (!brand.inventoryStatus) return null;

    if (brand.inventoryStatus.needsUpdate) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Güncelleme Gerekli
        </Badge>
      );
    }

    if (brand.inventoryStatus.lastInventoryUpdate) {
      return (
        <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3" />
          Envanterde
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <PlusCircle className="h-3 w-3" />
        Envantere Ekle
      </Badge>
    );
  };

  const handleDialogClose = useCallback(() => {
    setInventoryProgress(prev => ({
      ...prev,
      isOpen: false,
      current: 0,
      total: 0,
      success: 0,
      error: 0,
      status: 'idle',
      message: ''
    }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ürünler yükleniyor...</p>
          <p className="text-xs text-gray-400 mt-2">
            Debug: Auth: {isAuthenticated ? 'OK' : 'NO'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer title="Ürün Yönetimi" description="Ürünlerinizi ve markalarınızı yönetin.">
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-blue-600">
              📍 {branch?.name || 'Şube Yükleniyor...'}
            </p>
            <p className="text-gray-600">
              Şube Kodu: {branch?.code || 'Yükleniyor...'} • {filteredBrands.length} marka
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔄 Refreshing product data...');
              loadInitialData();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Yenile
          </Button>

          <Button
            onClick={() => navigate('/create-product')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Marka ara..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-48">
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger>
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Cihaz Tipi" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-xl border border-gray-200 rounded-lg z-50">
                  <SelectItem value="all" className="py-2 px-4 hover:bg-blue-50 cursor-pointer">Tüm Cihaz Tipleri</SelectItem>
                  {deviceTypes.map(type => (
                    <SelectItem key={type._id} value={type._id} className={`py-2 px-4 hover:bg-blue-50 cursor-pointer ${selectedDeviceType === type._id ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand List */}
      <Card>
        <CardHeader>
          <CardTitle>Marka Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBrands.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              {searchTerm 
                ? 'Arama kriterlerinize uygun marka bulunamadı'
                : 'Henüz marka kaydı bulunmuyor'
              }
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBrands.map((brand) => (
                <Card key={brand._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <BrandIcon brand={brand.name} size={48} />
                        <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{brand.name}</h3>
                            {getInventoryStatusBadge(brand)}
                          </div>
                          
                          {brand.deviceType && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              {deviceTypes.find(dt => dt._id === brand.deviceTypeId)?.name || brand.deviceType}
                          </div>
                          )}
                        </div>
                      </div>
                      
                      {brand.inventoryStatus?.needsUpdate && (
                        <Alert className="py-2 border-yellow-200 bg-yellow-50 text-yellow-800">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Yeni parçalar eklendi, envanter güncellemesi gerekiyor
                          </AlertDescription>
                        </Alert>
                      )}

                        <Button
                          variant="outline"
                          onClick={() => {
                          if (!brand.deviceTypeId) {
                            enqueueSnackbar("Marka için cihaz tipi bulunamadı", { variant: "error" });
                            return;
                          }
                          handleAddToInventory(brand._id, brand.deviceTypeId);
                        }}
                        disabled={loading || inventoryProgress.status === 'loading'}
                      >
                        {inventoryProgress.status === 'loading' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Package className="h-4 w-4 mr-2" />
                        )}
                        Envantere Ekle
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress dialog'u koru */}
      <Dialog 
        open={inventoryProgress.isOpen} 
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envanter Güncelleniyor</DialogTitle>
            <DialogDescription>
              Envanter güncelleme işlemi devam ediyor. Lütfen işlemin tamamlanmasını bekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{inventoryProgress.message}</span>
              {inventoryProgress.total > 0 && (
                <span className="text-sm text-gray-600">
                  {inventoryProgress.current} / {inventoryProgress.total}
                </span>
              )}
            </div>
            {inventoryProgress.total > 0 && (
              <Progress 
                value={(inventoryProgress.current / inventoryProgress.total) * 100} 
                className="h-2"
              />
            )}
            {inventoryProgress.status === 'error' && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{inventoryProgress.message}</AlertDescription>
              </Alert>
            )}
            {inventoryProgress.status === 'success' && (
              <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Başarılı</AlertTitle>
                <AlertDescription>{inventoryProgress.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageContainer>
  );
};

export default Products; 