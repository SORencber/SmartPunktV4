import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText,
  FormControlLabel,
  Switch,
  SelectChangeEvent,
  TablePagination,
  Tooltip,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Save as SaveIcon, Cancel as CancelIcon, Add as AddIcon, Close, Clear as ClearIcon } from '@mui/icons-material';
import { BrandIcon } from '@/components/BrandIcon';
import { DeviceTypeIcon } from '@/components/DeviceTypeIcon';
import { getParts, createPart, updatePart, deletePart, type Part, type CreatePartRequest, type UpdatePartRequest } from '@/api/parts';
import { getBrands, type Brand } from '@/api/brands';
import { getModels, type Model } from '@/api/models';
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useTranslation } from 'react-i18next';
import { useBranch } from '../../contexts/BranchContext';
import { cn } from '../../lib/utils';
import {
  Select as UISelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { useSnackbar, VariantType } from 'notistack';

interface Branch {
  _id: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  phone: string;
  managerName: string;
  isCentral: boolean;
  status: 'active' | 'inactive';
  defaultLanguage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PartsTabProps {
  branchId: string;
  userId: string;
}

interface FormData {
  deviceTypeId: string;
  brandId: string;
  modelId: string;
  name: {
    tr: string;
    en: string;
    de: string;
  };
  description: {
    tr?: string;
    en?: string;
    de?: string;
  };
  category: string;
  barcode: string;
  qrCode: string;
  cost: {
    amount: number;
    currency: 'EUR';
  };
  price: {
    amount: number;
    currency: 'EUR';
  };
  margin: number;
  stock: number;
  minStockLevel: number;
  shelfNumber: string;
  isActive: boolean;
  branchId: string;
  serviceFee: {
    amount: number;
    currency: 'EUR';
  };
  code?: string;
}

interface FormErrors {
  deviceTypeId?: string;
  brandId?: string;
  modelId?: string;
  name?: string;
  category?: string;
  barcode?: string;
  qrCode?: string;
}

export function PartsTab({ branchId, userId }: PartsTabProps) {
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [parts, setParts] = useState<any[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({
    deviceTypeId: '',
    brandId: '',
    modelId: '',
    name: { tr: '', en: '', de: '' },
    description: { tr: '', en: '', de: '' },
    category: '',
    barcode: '',
    qrCode: '',
    cost: { amount: 0, currency: 'EUR' as const },
    price: { amount: 0, currency: 'EUR' as const },
    margin: 0,
    stock: 0,
    minStockLevel: 0,
    shelfNumber: '',
    isActive: true,
    branchId: branchId,
    serviceFee: { amount: 0, currency: 'EUR' as const },
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredParts, setFilteredParts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [filteredModels, setFilteredModels] = useState<any[]>([]);

  // Bildirim gösterme yardımcı fonksiyonu
  const showNotification = useCallback((message: string, variant: VariantType = 'success') => {
    try {
      const key = enqueueSnackbar(message, {
        variant,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
        autoHideDuration: variant === 'error' ? 5000 : 3000,
        style: {
          backgroundColor: 
            variant === 'success' ? '#4caf50' :
            variant === 'error' ? '#f44336' :
            variant === 'warning' ? '#ff9800' : '#2196f3',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          padding: '12px 24px',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }
      });
    } catch (err: any) {
      console.error('Bildirim gösterilirken hata:', err);
    }
  }, [enqueueSnackbar]);

  // Test bildirimi
  useEffect(() => {
    console.log('PartsTab mounted, showing test notification');
    showNotification('Test bildirimi - PartsTab yüklendi', 'info');
  }, [showNotification]);

  // Load all necessary data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadParts(),
          loadDeviceTypes(),
          loadBrands(),
          loadModels()
        ]);
      } catch (err: any) {
        console.error('Error loading data:', err);
        showNotification("Veriler yüklenirken bir hata oluştu", 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      console.log('Loading parts...');
      
      const response = await getParts();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch parts');
      }

      console.log('Parts loaded successfully:', response.data.length);
      setParts(response.data);
    } catch (err: any) {
      console.error('Error loading parts:', err);
      
      if (err?.response?.status === 401) {
        console.log('Received 401 while loading parts, redirecting to login');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceTypes = async () => {
    try {
      const response = await getDeviceTypes();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch device types');
      }
      setDeviceTypes(response.data);
    } catch (err: any) {
      console.error('Error loading device types:', err);
      throw err;
    }
  };

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch brands');
      }
      setBrands(response.data);
    } catch (err: any) {
      console.error('Error loading brands:', err);
      throw err;
    }
  };

  const loadModels = async () => {
    try {
      const response = await getModels();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch models');
      }
      setModels(response.data);
    } catch (err: any) {
      console.error('Error loading models:', err);
      throw err;
    }
  };

  useEffect(() => {
    console.log('Current parts state:', parts);
  }, [parts]);

  useEffect(() => {
    let filtered = [...models];
    
    // Filter models by device type
    if (selectedDeviceType) {
      filtered = filtered.filter(model => {
        const modelDeviceTypeId = typeof model.deviceTypeId === 'string' 
          ? model.deviceTypeId 
          : model.deviceTypeId?._id;
        return modelDeviceTypeId === selectedDeviceType;
      });
    }
    
    // Filter models by brand
    if (selectedBrand) {
      filtered = filtered.filter(model => {
        const modelBrandId = typeof model.brandId === 'string' 
          ? model.brandId 
          : model.brandId?._id;
        return modelBrandId === selectedBrand;
      });
    }
    
    console.log('Filtered models:', filtered); // Debug log
    setFilteredModels(filtered);
    
    // Reset model selection if it's no longer valid
    if (selectedModel && !filtered.some(m => {
      const modelId = typeof m._id === 'string' ? m._id : m._id?._id;
      return modelId === selectedModel;
    })) {
      setSelectedModel('');
    }
  }, [models, selectedDeviceType, selectedBrand]);

  useEffect(() => {
    let filtered = [...parts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(part => {
        // Get related data for the part
        const { brand, model } = getRelatedData(part, deviceTypes, brands, models);
        
        // Part name in all languages
        const partName = typeof part.name === 'string' 
          ? part.name.toLowerCase()
          : (part.name?.tr?.toLowerCase() || part.name?.en?.toLowerCase() || part.name?.de?.toLowerCase() || '');
        
        // Brand name in all languages
        const brandName = brand ? (
          typeof (brand as any)?.name === 'string'
            ? (brand as any).name.toLowerCase()
            : ((brand as any)?.name?.tr?.toLowerCase() || (brand as any)?.name?.en?.toLowerCase() || (brand as any)?.name?.de?.toLowerCase() || '')
        ) : '';
        
        // Model name in all languages
        const modelName = model ? (
          typeof (model as any)?.name === 'string'
            ? (model as any).name.toLowerCase()
            : ((model as any)?.name?.tr?.toLowerCase() || (model as any)?.name?.en?.toLowerCase() || (model as any)?.name?.de?.toLowerCase() || '')
        ) : '';

        // Category
        const category = part.category?.toLowerCase() || '';
        
        // Numeric values as strings for searching
        const cost = (typeof part.cost === 'number' ? part.cost : part.cost?.amount)?.toString() || '';
        const price = (typeof part.price === 'number' ? part.price : part.price?.amount)?.toString() || '';
        const serviceFee = part.serviceFee?.amount?.toString() || '';
        const stock = part.stock?.toString() || '';
        const margin = part.margin?.toString() || '';
        
        // Search in all fields
        return partName.includes(query) || 
               brandName.includes(query) || 
               modelName.includes(query) || 
               category.includes(query) || 
               cost.includes(query) || 
               price.includes(query) || 
               serviceFee.includes(query) || 
               stock.includes(query) || 
               margin.includes(query);
      });
    }

    // Apply device type filter
    if (selectedDeviceType) {
      filtered = filtered.filter(part => {
        const deviceTypeId = typeof part.deviceTypeId === 'string' 
          ? part.deviceTypeId 
          : part.deviceTypeId?._id;
        return deviceTypeId === selectedDeviceType;
      });
    }

    // Apply brand filter
    if (selectedBrand) {
      filtered = filtered.filter(part => {
        const brandId = typeof part.brandId === 'string' 
          ? part.brandId 
          : part.brandId?._id;
        return brandId === selectedBrand;
      });
    }

    // Apply model filter
    if (selectedModel) {
      filtered = filtered.filter(part => {
        const modelId = typeof part.modelId === 'string' 
          ? part.modelId 
          : part.modelId?._id;
        return modelId === selectedModel;
      });
    }

    setFilteredParts(filtered);
    setPage(0); // Reset to first page when filters change
  }, [parts, searchQuery, selectedDeviceType, selectedBrand, selectedModel, deviceTypes, brands, models]);

  const validateForm = (data: FormData): Partial<Record<keyof FormData, string>> => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!data.name.tr) errors.name = 'Parça adı (TR) zorunludur';
    if (!data.name.de) errors.name = 'Parça adı (DE) zorunludur';
    if (!data.name.en) errors.name = 'Parça adı (EN) zorunludur';
    if (!data.modelId) errors.modelId = 'Model seçimi zorunludur';
    if (!data.brandId) errors.brandId = 'Marka seçimi zorunludur';
    if (!data.deviceTypeId) errors.deviceTypeId = 'Cihaz türü seçimi zorunludur';
    if (!data.category) errors.category = 'Kategori zorunludur';
    if (!data.barcode) errors.barcode = 'Barkod zorunludur';
    if (!data.qrCode) errors.qrCode = 'QR kod zorunludur';

    return errors;
  };

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      const errors = validateForm(newData);
      setFormErrors(errors);
      return newData;
    });
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        console.error('Form validasyon hataları:', errors);
        showNotification('Lütfen tüm gerekli alanları doldurun', 'error');
        return;
      }

      // Get current user info to check role
      const userResponse = await api.get('/api/auth/me');
      const { role: userRole, branchId: userBranch } = userResponse.data.user;

      // Log the form data for debugging
      console.log('Form Data:', formData);

      // First create the part in the main parts collection
      const partData = {
        name: {
          tr: formData.name.tr.trim(),
          de: formData.name.de.trim(),
          en: formData.name.en.trim()
        },
        description: formData.description ? {
          tr: formData.description.tr?.trim() || '',
          de: formData.description.de?.trim() || '',
          en: formData.description.en?.trim() || ''
        } : undefined,
        modelId: formData.modelId,
        brandId: formData.brandId,
        deviceTypeId: formData.deviceTypeId,
        category: formData.category.trim(),
        barcode: formData.barcode?.trim(),
        qrCode: formData.qrCode?.trim(),
        isActive: formData.isActive,
        cost: formData.cost ? {
          amount: Number(formData.cost.amount),
          currency: 'EUR'
        } : undefined,
        margin: typeof formData.margin === 'number' ? formData.margin : undefined,
        minStockLevel: typeof formData.minStockLevel === 'number' ? formData.minStockLevel : undefined,
        shelfNumber: formData.shelfNumber?.trim(),
        price: formData.price ? {
          amount: Number(formData.price.amount),
          currency: 'EUR'
        } : undefined,
        stock: typeof formData.stock === 'number' ? formData.stock : undefined,
        serviceFee: formData.serviceFee ? {
          amount: Number(formData.serviceFee.amount),
          currency: 'EUR'
        } : undefined
      };

      // Log the final request payload
      console.log('Request Payload:', partData);

      const partResponse = await api.post('/api/parts', partData);
      const createdPart = partResponse.data.data;

      if (userRole === 'admin') {
        // For admin users, add the part to all branches
        const branchesResponse = await api.get('/api/branches');
        const branches = branchesResponse.data.data;

        const results = [];
        const errors = [];

        // Add part to each branch
        for (const branch of branches) {
          try {
            await api.post('/api/branch-parts', {
              branchId: branch._id,
              parts: [{
                partId: createdPart._id,
                branch_stock: formData.stock || 0,
                branch_minStockLevel: formData.minStockLevel || 5,
                branch_cost: formData.cost?.amount || 0,
                branch_price: formData.price?.amount || 0,
                branch_margin: formData.margin || 20,
                branch_shelfNumber: formData.shelfNumber || "0"
              }]
            });

            results.push({
              branchId: branch._id,
              branchName: branch.name,
              success: true
            });
          } catch (err: any) {
            console.error(`Error adding part to branch ${branch._id}:`, err);
            errors.push({
              branchId: branch._id,
              branchName: branch.name,
              error: err.response?.data?.message || 'Unknown error'
            });
          }
        }

        // Show summary of results
        if (errors.length === 0) {
          showNotification(`Parça tüm şubelere başarıyla eklendi (${results.length} şube)`, 'success');
        } else {
          showNotification(`Parça ${results.length} şubeye eklendi, ${errors.length} şubede hata oluştu. Detaylar için konsolu kontrol edin.`, 'warning');
          console.error('Branch part creation errors:', errors);
        }
      } else {
        // For regular users, add the part only to their branch
        await api.post('/api/branch-parts', {
          branchId: userBranch,
          parts: [{
            partId: createdPart._id,
            branch_stock: formData.stock || 0,
            branch_minStockLevel: formData.minStockLevel || 5,
            branch_cost: formData.cost?.amount || 0,
            branch_price: formData.price?.amount || 0,
            branch_margin: formData.margin || 20,
            branch_shelfNumber: formData.shelfNumber || "0"
          }]
        });

        showNotification("Parça başarıyla eklendi", 'success');
      }

      // Refresh the parts list
      await loadParts();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error creating part:', err);
      showNotification(err.response?.data?.message || 'Parça eklenirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (part: Part) => {
    try {
      if (!part || !part._id) {
        showNotification('Geçersiz parça verisi', 'error');
        return;
      }

      // Get the IDs directly from the part object
      const deviceTypeId = typeof part.deviceTypeId === 'string' ? part.deviceTypeId : (part.deviceTypeId as any)?._id || '';
      const brandId = typeof part.brandId === 'string' ? part.brandId : (part.brandId as any)?._id || '';
      const modelId = typeof part.modelId === 'string' ? part.modelId : (part.modelId as any)?._id || '';

      // Set the form data
      setFormData({
        name: part.name,
        description: part.description || { tr: '', de: '', en: '' },
        deviceTypeId,
        brandId,
        modelId,
        category: part.category || '',
        barcode: part.barcode || '',
        qrCode: part.qrCode || '',
        isActive: part.isActive ?? true,
        code: part.code || '',
        price: typeof part.price === 'number' ? { amount: part.price, currency: 'EUR' } : part.price,
        cost: typeof part.cost === 'number' ? { amount: part.cost, currency: 'EUR' } : part.cost,
        margin: part.margin || 20,
        minStockLevel: part.minStockLevel || 5,
        shelfNumber: part.shelfNumber || '',
        stock: part.stock || 0,
        branchId: part.branchId || '',
        serviceFee: part.serviceFee || { amount: 0, currency: 'EUR' },
      });

      setEditingPart(part);
      setIsEditing(true);
      setOpenDialog(true);
    } catch (err: any) {
      console.error('Error in handleEditClick:', err);
      showNotification("Parça düzenleme sırasında bir hata oluştu", 'error');
    }
  };

  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let hasError = false;
    let updateErrors: string[] = [];

    try {
      // Form validasyonu
      if (!editingPart?._id) {
        console.error('Parça ID bulunamadı');
        showNotification('Parça ID bulunamadı', 'error');
        return;
      }

      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        console.error('Form validasyon hataları:', errors);
        showNotification('Lütfen tüm gerekli alanları doldurun', 'error');
        return;
      }

      // Ana parçayı güncelle
      console.log('Ana parça güncelleniyor:', editingPart._id);
      const updateData: UpdatePartRequest = {
        name: formData.name,
        description: formData.description,
        deviceTypeId: formData.deviceTypeId,
        brandId: formData.brandId,
        modelId: formData.modelId,
        category: formData.category,
        barcode: formData.barcode,
        qrCode: formData.qrCode,
        isActive: formData.isActive,
        cost: formData.cost,
        price: formData.price,
        margin: formData.margin,
        stock: formData.stock,
        minStockLevel: formData.minStockLevel,
        shelfNumber: formData.shelfNumber,
        branchId: branchId,
        serviceFee: formData.serviceFee,
        code: formData.code
      };

      console.log('Update data:', updateData);
      const partResponse = await updatePart(editingPart._id, updateData);
      
      if (!partResponse.success) {
        console.error('Ana parça güncelleme başarısız:', partResponse);
        throw new Error(partResponse.message || 'Parça güncellenirken bir hata oluştu');
      }

      console.log('Ana parça güncellendi:', partResponse.data);

      // Şubeleri al
      console.log('Şubeler alınıyor...');
      const branchesResponse = await api.get('/api/branches');
      if (!branchesResponse.data.success) {
        throw new Error('Şube bilgileri alınamadı');
      }

      const branches = branchesResponse.data.data;
      const branchPartData: UpdatePartRequest = {
        name: formData.name,
        description: formData.description,
        deviceTypeId: formData.deviceTypeId,
        brandId: formData.brandId,
        modelId: formData.modelId, 
        category: formData.category,
        barcode: formData.barcode,
        qrCode: formData.qrCode,
        isActive: formData.isActive,
        cost: formData.cost,
        price: formData.price,
        margin: formData.margin,
        stock: formData.stock,
        minStockLevel: formData.minStockLevel,
        shelfNumber: formData.shelfNumber,
        serviceFee: formData.serviceFee,
        code: formData.code
      };

      console.log('Branch part data:', branchPartData);

      // Her şube için şube parçasını güncelle
      for (const branch of branches) {
        try {
          console.log(`${branch.name} şubesi için parça güncelleniyor...`);
          const branchUpdateData = {
            ...branchPartData,
            branchId: branch._id
          };

          const branchResponse = await api.put(`/api/branch-parts/${editingPart._id}`, branchUpdateData);
          
          if (!branchResponse.data.success) {
            console.error(`${branch.name} şubesi güncelleme hatası:`, branchResponse.data);
            updateErrors.push(`${branch.name}: ${branchResponse.data.message || 'Güncelleme başarısız'}`);
            hasError = true;
          } else {
            console.log(`${branch.name} şubesi güncellendi`, branchResponse.data);
          }
        } catch (err: any) {
          console.error(`Şube parçası güncellenirken hata (${branch.name}):`, err);
          updateErrors.push(`${branch.name}: ${err.message || 'Güncelleme başarısız'}`);
          hasError = true;
        }
      }

      // Sonuçları göster
      if (hasError) {
        console.warn('Bazı şubelerde güncelleme hataları:', updateErrors);
        showNotification(
          `Parça güncellendi ancak bazı şubelerde hata oluştu: ${updateErrors.join(', ')}`,
          'warning'
        );
      } else {
        console.log('Tüm güncellemeler başarılı');
        showNotification('Parça başarıyla güncellendi', 'success');
      }

      // Dialog'u kapat ve listeyi yenile
      setOpenDialog(false);
      setEditingPart(null);
      await fetchParts();

    } catch (err: any) {
      console.error('Parça güncellenirken hata:', err);
      showNotification(
        err.message || 'Parça güncellenirken bir hata oluştu',
        'error'
      );
      hasError = true;
    } finally {
      setLoading(false);
      console.log(
        hasError 
          ? 'Parça güncelleme işlemi hatalarla tamamlandı'
          : 'Parça güncelleme işlemi başarıyla tamamlandı'
      );
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!window.confirm('Bu parçayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      const success = await deletePart(partId);
      if (success) {
        await loadParts();
        showNotification('Parça başarıyla silindi', 'success');
      }
    } catch (err: any) {
      console.error('Parça silinirken hata:', err);
      showNotification('Parça silinirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (event: SelectChangeEvent<string>) => {
    const modelId = event.target.value;
    console.log('Selected model:', modelId); // Debug log
    setSelectedModel(modelId);
  };

  const handleModelChange = (value: string) => {
    const model = models.find(m => m._id === value);
    if (model) {
      const brand = brands.find(b => b._id === model.brandId);
      const deviceType = deviceTypes.find(dt => dt._id === model.deviceTypeId);
      
      if (!brand || !deviceType) {
        showNotification("Invalid model configuration: Brand or device type not found", 'error');
        return;
      }

      handleFormChange('modelId', value);
      handleFormChange('brandId', model.brandId);
      handleFormChange('deviceTypeId', model.deviceTypeId);
    }
  };

  const handleEditDeviceTypeChange = (value: string) => {
    const deviceType = deviceTypes.find(dt => dt._id === value);
    if (deviceType) {
      handleFormChange('deviceTypeId', value);
      // Reset brand and model when device type changes
      handleFormChange('brandId', '');
      handleFormChange('modelId', '');
    }
  };

  const handleEditBrandChange = (value: string) => {
    const brand = brands.find(b => b._id === value);
    if (brand) {
      handleFormChange('brandId', value);
      // Reset model when brand changes
      handleFormChange('modelId', '');
    }
  };

  const handleEditModelChange = (value: string) => {
    const model = models.find(m => m._id === value);
    if (model) {
      handleFormChange('modelId', value);
    }
  };

  const getModelName = (modelId: string) => {
    const model = models.find(m => m._id === modelId);
    return model?.name ?? '';
  };

  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b._id === brandId);
    return brand?.name ?? '';
  };

  const getDeviceTypeName = (deviceTypeId: string) => {
    const deviceType = deviceTypes.find(dt => dt._id === deviceTypeId);
    return deviceType?.name ?? '';
  };

  const getDeviceTypeIcon = (deviceTypeId: string) => {
    const deviceType = deviceTypes.find(dt => dt._id === deviceTypeId);
    return deviceType?.icon ?? '';
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (part?: Part) => {
    if (part) {
      try {
        // Ensure we have all required data
        const { brand, model } = getRelatedData(part, deviceTypes, brands, models);
        
        if (!brand || !model) {
          showNotification("Parça verileri eksik veya hatalı", 'error');
          return;
        }

        setEditingPart(part);
        setIsEditing(true);
        setFormData({
          name: part.name || { tr: '', en: '', de: '' },
          description: part.description || { tr: '', en: '', de: '' },
          brandId: typeof part.brandId === 'string' ? part.brandId : (part.brandId as any)?._id || '',
          deviceTypeId: typeof part.deviceTypeId === 'string' ? part.deviceTypeId : (part.deviceTypeId as any)?._id || '',
          modelId: typeof part.modelId === 'string' ? part.modelId : (part.modelId as any)?._id || '',
          category: part.category || '',
          barcode: part.barcode || '',
          qrCode: part.qrCode || '',
          isActive: part.isActive ?? true,
          cost: typeof part.cost === 'number' ? { amount: part.cost, currency: 'EUR' } : part.cost,
          margin: part.margin || 20,
          minStockLevel: part.minStockLevel || 5,
          shelfNumber: part.shelfNumber || '',
          price: typeof part.price === 'number' ? { amount: part.price, currency: 'EUR' } : part.price,
          stock: part.stock || 0,
          serviceFee: part.serviceFee || { amount: 0, currency: 'EUR' },
          branchId: part.branchId || branchId
        });
      } catch (err: any) {
        console.error('Error opening dialog:', err);
        showNotification("Parça düzenleme sırasında bir hata oluştu", 'error');
        return;
      }
    } else {
      // Reset form for new part
      setEditingPart(null);
      setIsEditing(false);
      setFormData({
        name: { tr: '', en: '', de: '' },
        description: { tr: '', en: '', de: '' },
        brandId: '',
        deviceTypeId: '',
        modelId: '',
        category: '',
        barcode: '',
        qrCode: '',
        isActive: true,
        cost: { amount: 0, currency: 'EUR' },
        margin: 20,
        minStockLevel: 5,
        shelfNumber: '',
        price: { amount: 0, currency: 'EUR' },
        stock: 0,
        serviceFee: { amount: 0, currency: 'EUR' },
        branchId: branchId
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPart(null);
    setIsEditing(false);
    setFormData({
      name: { tr: '', en: '', de: '' },
      description: { tr: '', en: '', de: '' },
      brandId: '',
      deviceTypeId: '',
      modelId: '',
      category: '',
      barcode: '',
      qrCode: '',
      isActive: true,
      cost: { amount: 0, currency: 'EUR' },
      margin: 20,
      minStockLevel: 5,
      shelfNumber: '',
      price: { amount: 0, currency: 'EUR' },
      stock: 0,
      serviceFee: { amount: 0, currency: 'EUR' },
      branchId: branchId
    });
  };

  const handleCloseEditDialog = () => {
    setEditingPart(null);
    setFormData({
      name: { tr: '', de: '', en: '' },
      description: { tr: '', de: '', en: '' },
      modelId: '',
      brandId: '',
      deviceTypeId: '',
      category: '',
      barcode: '',
      qrCode: '',
      isActive: true,
      cost: { amount: 0, currency: 'EUR' },
      margin: 0,
      minStockLevel: 0,
      price: { amount: 0, currency: 'EUR' },
      shelfNumber: '',
      stock: 0,
      serviceFee: { amount: 0, currency: 'EUR' },
      branchId: branchId
    });
  };

  const getRelatedData = (part: Part, deviceTypes: DeviceType[], brands: Brand[], models: Model[]) => {
    // Handle both string IDs and populated objects
    const deviceTypeId = typeof part.deviceTypeId === 'string' ? part.deviceTypeId : (part.deviceTypeId as any)?._id || '';
    const brandId = typeof part.brandId === 'string' ? part.brandId : (part.brandId as any)?._id || '';
    const modelId = typeof part.modelId === 'string' ? part.modelId : (part.modelId as any)?._id || '';

    console.log('Part IDs:', { deviceTypeId, brandId, modelId });
    console.log('Available data:', {
      deviceTypes: deviceTypes.map(dt => ({ id: dt._id, name: dt.name })),
      brands: brands.map(b => ({ id: b._id, name: b.name })),
      models: models.map(m => ({ id: m._id, name: m.name }))
    });

    const deviceType = deviceTypes.find(dt => dt._id === deviceTypeId);
    const brand = brands.find(b => b._id === brandId);
    const model = models.find(m => m._id === modelId);

    console.log('Found related data:', {
      deviceType: deviceType ? { id: deviceType._id, name: deviceType.name } : null,
      brand: brand ? { id: brand._id, name: brand.name } : null,
      model: model ? { id: model._id, name: model.name } : null
    });

    return { deviceType, brand, model };
  };

  const formatEuro = (value: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDeviceType('');
    setSelectedBrand('');
    setSelectedModel('');
  };

  const getTurkishDeviceTypeName = (typeName: string): string => {
    const turkishNames: Record<string, string> = {
      'Smartphone': 'Cep Telefonu',
      'Feature Phone': 'Basit Telefon',
      'Foldable': 'Katlanabilir Telefon',
      'Laptop': 'Dizüstü Bilgisayar',
      'Desktop': 'Masaüstü Bilgisayar',
      'All-in-One': 'Tümü Bir Arada',
      'Server': 'Sunucu',
      'Workstation': 'İş İstasyonu',
      'Smartwatch': 'Akıllı Saat',
      'Fitness Tracker': 'Fitness Takipçi',
      'Smart Band': 'Akıllı Bileklik',
      'Earbuds': 'Kablosuz Kulaklık',
      'Headphones': 'Kulaklık',
      'Speaker': 'Hoparlör',
      'Soundbar': 'Ses Sistemi',
      'Smart TV': 'Akıllı TV',
      'Monitor': 'Monitör',
      'Projector': 'Projeksiyon',
      'Gaming Console': 'Oyun Konsolu',
      'Gaming PC': 'Oyun Bilgisayarı',
      'Gaming Laptop': 'Oyun Dizüstü',
      'Gaming Monitor': 'Oyun Monitörü',
      'Gaming Headset': 'Oyun Kulaklığı',
      'Access Point': 'Erişim Noktası',
      'External HDD': 'Harici Disk',
      'External SSD': 'Harici SSD',
      'NAS': 'Ağ Depolama',
      'USB Drive': 'USB Bellek',
      'Printer': 'Yazıcı',
      'Scanner': 'Tarayıcı',
      'All-in-One Printer': 'Çok Fonksiyonlu Yazıcı',
      'Camera': 'Kamera',
      'Smart Home Hub': 'Akıllı Ev Merkezi',
      'Smart Display': 'Akıllı Ekran',
      'Smart Speaker': 'Akıllı Hoparlör',
      'Smart Lock': 'Akıllı Kilit',
      'Smart Thermostat': 'Akıllı Termostat',
      'Smart Bulb': 'Akıllı Ampul',
      'Smart Plug': 'Akıllı Priz',
      'Smart Sensor': 'Akıllı Sensör'
    };
    return turkishNames[typeName] || typeName;
  };

  const getTurkishDeviceTypeIcon = (typeName: string): string => {
    const turkishToEnglish: Record<string, string> = {
      'Smartphone': 'Cep Telefonu',
      'Feature Phone': 'Basit Telefon',
      'Foldable': 'Katlanabilir Telefon',
      'Laptop': 'Dizüstü Bilgisayar',
      'Desktop': 'Masaüstü Bilgisayar',
      'All-in-One': 'Tümü Bir Arada',
      'Server': 'Sunucu',
      'Workstation': 'İş İstasyonu',
      'Smartwatch': 'Akıllı Saat',
      'Fitness Tracker': 'Fitness Takipçi',
      'Smart Band': 'Akıllı Bileklik',
      'Earbuds': 'Kablosuz Kulaklık',
      'Headphones': 'Kulaklık',
      'Speaker': 'Hoparlör',
      'Soundbar': 'Ses Sistemi',
      'Smart TV': 'Akıllı TV',
      'Monitor': 'Monitör',
      'Projector': 'Projeksiyon',
      'Gaming Console': 'Oyun Konsolu',
      'Gaming PC': 'Oyun Bilgisayarı',
      'Gaming Laptop': 'Oyun Dizüstü',
      'Gaming Monitor': 'Oyun Monitörü',
      'Gaming Headset': 'Oyun Kulaklığı',
      'Access Point': 'Erişim Noktası',
      'External HDD': 'Harici Disk',
      'External SSD': 'Harici SSD',
      'NAS': 'Ağ Depolama',
      'USB Drive': 'USB Bellek',
      'Printer': 'Yazıcı',
      'Scanner': 'Tarayıcı',
      'All-in-One Printer': 'Çok Fonksiyonlu Yazıcı',
      'Camera': 'Kamera',
      'Smart Home Hub': 'Akıllı Ev Merkezi',
      'Smart Display': 'Akıllı Ekran',
      'Smart Speaker': 'Akıllı Hoparlör',
      'Smart Lock': 'Akıllı Kilit',
      'Smart Thermostat': 'Akıllı Termostat',
      'Smart Bulb': 'Akıllı Ampul',
      'Smart Plug': 'Akıllı Priz',
      'Smart Sensor': 'Akıllı Sensör'
    };

    // Reverse the mapping to get English to Turkish
    const englishToTurkish = Object.entries(turkishToEnglish).reduce((acc, [eng, tr]) => {
      acc[eng] = tr;
      return acc;
    }, {} as Record<string, string>);

    return englishToTurkish[typeName] || typeName;
  };

  const fetchParts = async () => {
    try {
      const response = await api.get('/api/parts');
      setParts(response.data.data);
    } catch (err: any) {
      console.error('Parçalar yüklenirken hata:', err);
      showNotification("Parçalar yüklenirken bir hata oluştu", 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Search and Filter Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* First Row: Search and Device Type */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Parça adı, marka, model, fiyat, stok vb. ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Cihaz Türü</InputLabel>
              <Select
                value={selectedDeviceType}
                onChange={(e) => {
                  setSelectedDeviceType(e.target.value);
                  setSelectedBrand('');
                  setSelectedModel('');
                }}
                label="Cihaz Türü"
              >
                <MenuItem value="" sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span className="material-icons-outlined" style={{ color: 'text.secondary' }}>devices</span>
                  <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Tüm Cihaz Türleri
                  </Typography>
                </MenuItem>
                {deviceTypes.map((type) => {
                  const typeId = typeof type._id === 'string' ? type._id : type._id?._id;
                  const typeName = typeof type.name === 'string'
                    ? type.name
                    : (type.name?.tr || type.name?.en || type.name?.de || '-');
                  
                  const turkishName = getTurkishDeviceTypeName(typeName);
                  const turkishIcon = getTurkishDeviceTypeIcon(typeName);

                  return (
                    <MenuItem key={typeId} value={typeId}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DeviceTypeIcon icon={turkishIcon} size={24} />
                        {turkishName}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Second Row: Brand and Model */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Marka</InputLabel>
              <Select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel('');
                }}
                label="Marka"
                disabled={!selectedDeviceType}
              >
                <MenuItem value="" sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span className="material-icons-outlined" style={{ color: 'text.secondary' }}>branding_watermark</span>
                  <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {selectedDeviceType ? 'Tüm Markalar' : 'Önce Cihaz Türü Seçin'}
                  </Typography>
                </MenuItem>
                {brands
                  .filter(brand => !selectedDeviceType || brand.deviceTypeId === selectedDeviceType)
                  .map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {brand.logo ? (
                          <img 
                            src={brand.logo} 
                            alt={
                              typeof (brand as any)?.name === 'string'
                                ? (brand as any).name
                                : ((brand as any)?.name?.tr ||
                                   (brand as any)?.name?.en ||
                                   (brand as any)?.name?.de ||
                                   '-')
                            } 
                            style={{ width: 24, height: 24, objectFit: 'contain' }}
                          />
                        ) : (
                          <BrandIcon brand={brand} size={24} />
                        )}
                        {typeof (brand as any)?.name === 'string' 
                          ? (brand as any).name 
                          : ((brand as any)?.name?.tr ||
                             (brand as any)?.name?.en ||
                             (brand as any)?.name?.de ||
                             '-')}
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                label="Model"
                disabled={!selectedBrand}
              >
                <MenuItem value="" sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span className="material-icons-outlined" style={{ color: 'text.secondary' }}>smartphone</span>
                  <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    {selectedBrand ? 'Tüm Modeller' : 'Önce Marka Seçin'}
                  </Typography>
                </MenuItem>
                {filteredModels.map((model) => {
                  const modelId = typeof model._id === 'string' ? model._id : model._id?._id;
                  const modelName = typeof (model as any)?.name === 'string'
                    ? (model as any).name
                    : ((model as any)?.name?.tr || (model as any)?.name?.en || (model as any)?.name?.de || '-');
                  
                  // Get device type for the model
                  const deviceType = deviceTypes.find(dt => {
                    const dtId = typeof dt._id === 'string' ? dt._id : dt._id?._id;
                    const modelDtId = typeof model.deviceTypeId === 'string' ? model.deviceTypeId : model.deviceTypeId?._id;
                    return dtId === modelDtId;
                  });

                  // Get Turkish name and icon for the device type
                  const deviceTypeName = deviceType ? getTurkishDeviceTypeName(deviceType.name) : '';
                  const deviceTypeIcon = deviceType ? getTurkishDeviceTypeIcon(deviceType.name) : 'smartphone';

                  return (
                    <MenuItem key={modelId} value={modelId}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DeviceTypeIcon icon={deviceTypeIcon} size={24} />
                        <Box>
                          <Typography variant="body1">{modelName}</Typography>
                          {deviceTypeName && (
                            <Typography variant="caption" color="text.secondary">
                              {deviceTypeName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Third Row: Reset Button and Add New Part Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                disabled={!searchQuery && !selectedDeviceType && !selectedBrand && !selectedModel}
                startIcon={<ClearIcon />}
              >
                Filtreleri Sıfırla
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Yeni Parça
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Results Count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filteredParts.length} parça bulundu
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Marka</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Parça Adı</TableCell>
              <TableCell>Maliyet</TableCell>
              <TableCell>Fiyat</TableCell>
              <TableCell>Servis Ücreti</TableCell>
              <TableCell>Stok</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((part) => {
                const { brand, model } = getRelatedData(part, deviceTypes, brands, models);
                  return (
                  <TableRow key={part._id}>
                      <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {brand?.logo ? (
                                  <img
                                    src={brand.logo}
                            alt={
                              typeof (brand as any)?.name === 'string'
                                ? (brand as any).name
                                : ((brand as any)?.name?.tr ||
                                   (brand as any)?.name?.en ||
                                   (brand as any)?.name?.de ||
                                   '-')
                            } 
                            style={{ width: 24, height: 24, objectFit: 'contain' }}
                                  />
                                ) : (
                          <BrandIcon brand={brand} size={24} />
                        )}
                        {typeof (brand as any)?.name === 'string' 
                          ? (brand as any).name 
                          : ((brand as any)?.name?.tr ||
                             (brand as any)?.name?.en ||
                             (brand as any)?.name?.de ||
                             '-')}
                          </Box>
                      </TableCell>
                      <TableCell>
                      {model ? (
                        typeof (model as any)?.name === 'string' 
                          ? (model as any).name 
                          : ((model as any)?.name?.tr || (model as any)?.name?.en || (model as any)?.name?.de || '-')
                      ) : '-'}
                      </TableCell>
                      <TableCell>
                      {typeof part.name === 'string' 
                        ? part.name 
                        : (part.name?.tr || part.name?.en || part.name?.de || '-')}
                      </TableCell>
                    <TableCell>{formatEuro(typeof part.cost === 'number' ? part.cost : (part.cost as any)?.amount || 0)}</TableCell>
                    <TableCell>{formatEuro(typeof part.price === 'number' ? part.price : (part.price as any)?.amount || 0)}</TableCell>
                    <TableCell>{formatEuro(part.serviceFee?.amount || 0)}</TableCell>
                    <TableCell>{part.stock}</TableCell>
                    <TableCell>
                          <Chip
                        label={part.isActive ? 'Aktif' : 'Pasif'}
                        color={part.isActive ? 'success' : 'default'}
                            size="small"
                          />
                      </TableCell>
                      <TableCell>
                      <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                          onClick={() => {
                            try {
                              handleOpenDialog(part);
                            } catch (err) {
                              console.error('Error opening dialog:', err);
                              showNotification("Parça düzenleme sırasında bir hata oluştu", 'error');
                            }
                          }}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePart(part._id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
              })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredParts.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Sayfa başına satır:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Parça Düzenle' : 'Yeni Parça Ekle'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
          <DialogContent>
          <form onSubmit={isEditing ? handleUpdatePart : handleCreatePart}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Parça Adı (TR)"
                  value={formData.name.tr}
                  onChange={(e) => handleFormChange('name', { ...formData.name, tr: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Parça Adı (DE)"
                  value={formData.name.de}
                  onChange={(e) => handleFormChange('name', { ...formData.name, de: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Parça Adı (EN)"
                  value={formData.name.en}
                  onChange={(e) => handleFormChange('name', { ...formData.name, en: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Kategori"
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  error={!!formErrors.category}
                  helperText={formErrors.category}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maliyet (€)"
                  value={formData.cost.amount}
                  onChange={(e) => handleFormChange('cost', {
                    amount: Number(e.target.value),
                    currency: 'EUR'
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    inputProps: { 
                      min: 0,
                      step: 0.01
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fiyat (€)"
                  value={formData.price.amount}
                  onChange={(e) => handleFormChange('price', {
                    amount: Number(e.target.value),
                    currency: 'EUR'
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    inputProps: { 
                      min: 0,
                      step: 0.01
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Teknik Servis Ücreti (€)"
                  value={formData.serviceFee.amount}
                  onChange={(e) => handleFormChange('serviceFee', {
                    amount: Number(e.target.value),
                    currency: 'EUR'
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    inputProps: { 
                      min: 0,
                      step: 0.01
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Kar Marjı (%)"
                  value={formData.margin}
                  onChange={(e) => handleFormChange('margin', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { 
                      min: 0,
                      max: 100,
                      step: 0.01
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stok Miktarı"
                  value={formData.stock}
                  onChange={(e) => handleFormChange('stock', Number(e.target.value))}
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      step: 1
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Stok Seviyesi"
                  value={formData.minStockLevel}
                  onChange={(e) => handleFormChange('minStockLevel', Number(e.target.value))}
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      step: 1
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Raf Numarası"
                  value={formData.shelfNumber}
                  onChange={(e) => handleFormChange('shelfNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Açıklamalar
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Açıklama (TR)"
                  value={formData.description.tr}
                  onChange={(e) => handleFormChange('description', { ...formData.description, tr: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Açıklama (DE)"
                  value={formData.description.de}
                  onChange={(e) => handleFormChange('description', { ...formData.description, de: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Açıklama (EN)"
                  value={formData.description.en}
                  onChange={(e) => handleFormChange('description', { ...formData.description, en: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>

        <DialogActions>
              <Button onClick={handleCloseDialog}>
                İptal
              </Button>
          <Button 
                type="submit" 
            variant="contained" 
                color="primary"
            disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
                {loading ? 'Kaydediliyor...' : (isEditing ? 'Değişiklikleri Kaydet' : 'Kaydet')}
          </Button>
        </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 
