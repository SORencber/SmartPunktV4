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
import { Loader2, Search, Plus, Building } from 'lucide-react';
import { getDeviceTypes } from '@/api/deviceTypes';
import { getBrands, type Brand as ApiBrand } from '@/api/brands';
import { getPartsByBrand } from '@/api/parts';

// Types
interface DeviceType {
  _id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

interface Brand extends ApiBrand {
  inventoryStatus?: {
    needsUpdate: boolean;
    lastPartUpdate: string | null;
    lastInventoryUpdate: string | null;
  };
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
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'central_staff';

  // Add ref for initialization
  const initRef = useRef<boolean>(false);

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

  // Filter brands based on search and device type
  useEffect(() => {
    const filtered = brands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDeviceType = selectedDeviceType === 'all' || brand.deviceTypeId === selectedDeviceType;
      return matchesSearch && matchesDeviceType;
    });
    setFilteredBrands(filtered);
  }, [brands, searchTerm, selectedDeviceType]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    console.log('🚀 [DEBUG] Starting loadInitialData...');
    console.log('🚀 [DEBUG] User context:', { 
      isAuthenticated, 
      userEmail: user?.email, 
      userRole: user?.role,
      isAdmin 
    });
    
    setLoading(true);
    
    try {
      await Promise.all([
        loadDeviceTypes(),
        loadBrands()
      ]);
      
      console.log('✅ [DEBUG] Initial data loading completed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Error in loadInitialData:', error);
      enqueueSnackbar("Veriler yüklenirken bir hata oluştu", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, isAdmin, loadDeviceTypes, loadBrands, enqueueSnackbar]);

  // Initialize on mount
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

  // Handle add to inventory
  const handleAddToInventory = async (brandId: string) => {
    try {
      const response = await getPartsByBrand(brandId);
      if (response.success && response.data) {
        // Navigate to create product page with brand data
        navigate('/create-product', { 
          state: { 
            brandId,
            brandName: brands.find(b => b._id === brandId)?.name,
            parts: response.data
          }
        });
      } else {
        throw new Error(response.message || 'Parça bilgileri alınamadı');
      }
    } catch (error) {
      console.error('Error getting parts:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Parça bilgileri alınamadı', { variant: "error" });
    }
  };

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
            onClick={() => {
              console.log('👤 User Role:', user?.role);
              console.log('🔒 Is Admin:', user?.role === 'admin');
              navigate('/create-product');
            }}
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
                <SelectContent>
                  <SelectItem value="all">Tüm Cihaz Tipleri</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type._id} value={type._id}>
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
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                          {brand.icon ? (
                            <img 
                              src={brand.icon} 
                              alt={`${brand.name} logo`}
                              className="w-12 h-12 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/48?text=' + brand.name.charAt(0);
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 font-semibold">
                              {brand.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{brand.name}</h3>
                            <Badge variant={brand.isActive ? "default" : "secondary"}>
                              {brand.isActive ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </div>
                          
                          {brand.deviceType && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              {deviceTypes.find(dt => dt._id === brand.deviceTypeId)?.name || brand.deviceType}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => handleAddToInventory(brand._id)}
                      >
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
    </div>
  );
};

export default Products; 