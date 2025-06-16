import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Smartphone } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { getModels, createModel, updateModel, deleteModel, type Model } from '@/api/models';
import { getBrands, type Brand } from '@/api/brands';
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes';

export default function ModelsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    deviceTypeId: '',
    brandId: '',
    description: ''
  });

  // Load data
  useEffect(() => {
    loadDeviceTypes();
    loadBrands();
    loadModels();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      const response = await getDeviceTypes();
      if (response.success && Array.isArray(response.data)) {
        setDeviceTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading device types:', error);
      enqueueSnackbar('Cihaz türleri yüklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      if (response.success && Array.isArray(response.data)) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      enqueueSnackbar('Markalar yüklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await getModels();
      if (response.success && Array.isArray(response.data)) {
        setModels(response.data);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      enqueueSnackbar('Modeller yüklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async (data: CreateModelRequest) => {
    try {
      if (!data.name || !data.deviceTypeId || !data.brandId) {
        enqueueSnackbar('Model adı, cihaz türü ve marka gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await createModel(data);
      if (response.success) {
        enqueueSnackbar('Model oluşturuldu', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadModels();
      } else {
        enqueueSnackbar('Model oluşturulamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error creating model:', error);
      enqueueSnackbar('Model oluşturulamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      deviceTypeId: model.deviceTypeId,
      brandId: model.brandId,
      description: model.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateModel = async (id: string, data: UpdateModelRequest) => {
    try {
      if (!data.name || !data.deviceTypeId || !data.brandId) {
        enqueueSnackbar('Model adı, cihaz türü ve marka gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateModel(id, data);
      if (response.success) {
        enqueueSnackbar('Model güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadModels();
      } else {
        enqueueSnackbar('Model güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating model:', error);
      enqueueSnackbar('Model güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      const response = await deleteModel(id);
      if (response.success) {
        enqueueSnackbar('Model silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadModels();
      } else {
        enqueueSnackbar('Model silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      enqueueSnackbar('Model silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // Filter models
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDeviceType = selectedDeviceType === 'all' || model.deviceTypeId === selectedDeviceType;
    const matchesBrand = selectedBrand === 'all' || model.brandId === selectedBrand;
    return matchesSearch && matchesDeviceType && matchesBrand;
  });

  // Filter brands based on selected device type
  const filteredBrands = brands.filter(brand => 
    selectedDeviceType === 'all' || brand.deviceTypeId === selectedDeviceType
  );

  const getDeviceTypeName = (deviceTypeId: string) => {
    const deviceType = deviceTypes.find(dt => dt._id === deviceTypeId);
    return deviceType?.name || 'Bilinmeyen';
  };

  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b._id === brandId);
    return brand?.name || 'Bilinmeyen';
  };

  // Filter brands for form based on selected device type
  const getFormBrands = (deviceTypeId?: string) => {
    return brands.filter(brand => !deviceTypeId || brand.deviceTypeId === deviceTypeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Model Yönetimi</h1>
          <p className="text-muted-foreground">
            Cihaz modellerini yönetin
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Model Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir cihaz modeli oluşturun. Model, seçilen cihaz türü ve markaya bağlı olacaktır.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deviceType">Cihaz Türü *</Label>
                <Select 
                  value={formData.deviceTypeId} 
                  onValueChange={(value) => setFormData({ ...formData, deviceTypeId: value, brandId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cihaz türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((deviceType) => (
                      <SelectItem key={deviceType._id} value={deviceType._id}>
                        {deviceType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Marka *</Label>
                <Select 
                  value={formData.brandId} 
                  onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                  disabled={!formData.deviceTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Marka seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFormBrands(formData.deviceTypeId).map((brand) => (
                      <SelectItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Model Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="örn: iPhone 13, Galaxy S21"
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Model açıklaması"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={() => handleCreateModel(formData)}>
                  Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Model ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedDeviceType} onValueChange={(value) => {
                setSelectedDeviceType(value);
                setSelectedBrand('all'); // Reset brand filter when device type changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Cihaz türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Cihaz Türleri</SelectItem>
                  {deviceTypes.map((deviceType) => (
                    <SelectItem key={deviceType._id} value={deviceType._id}>
                      {deviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Marka" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Markalar</SelectItem>
                  {filteredBrands.map((brand) => (
                    <SelectItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Modeller yükleniyor...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedDeviceType !== 'all' || selectedBrand !== 'all' 
                ? 'Arama kriterlerine uygun model bulunamadı' 
                : 'Henüz model eklenmemiş'}
            </p>
          </div>
        ) : (
          filteredModels.map((model) => (
            <Card key={model._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        {getBrandName(model.brandId)}
                      </Badge>
                      <Badge variant="secondary">
                        {getDeviceTypeName(model.deviceTypeId)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(model)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteModel(model._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {model.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Model Düzenle</DialogTitle>
            <DialogDescription>
              Mevcut model bilgilerini düzenleyin. Model, seçilen cihaz türü ve markaya bağlı olacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-deviceType">Cihaz Türü *</Label>
              <Select 
                value={formData.deviceTypeId} 
                onValueChange={(value) => setFormData({ ...formData, deviceTypeId: value, brandId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cihaz türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((deviceType) => (
                    <SelectItem key={deviceType._id} value={deviceType._id}>
                      {deviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-brand">Marka *</Label>
              <Select 
                value={formData.brandId} 
                onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                disabled={!formData.deviceTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Marka seçin" />
                </SelectTrigger>
                <SelectContent>
                  {getFormBrands(formData.deviceTypeId).map((brand) => (
                    <SelectItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-name">Model Adı *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="örn: iPhone 13, Galaxy S21"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Açıklama</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Model açıklaması"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={() => handleUpdateModel(editingModel!._id, formData)}>
                Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 