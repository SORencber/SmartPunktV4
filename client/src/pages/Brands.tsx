// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { getBrands, createBrand, updateBrand, deleteBrand, type Brand } from '@/api/brands';
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes';

export default function Brands() {
  const { enqueueSnackbar } = useSnackbar();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    deviceTypeId: '',
    description: ''
  });

  // Load data
  useEffect(() => {
    loadDeviceTypes();
    loadBrands();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      const response = await getDeviceTypes();
      if (response.success && Array.isArray(response.data)) {
        setDeviceTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading device types:', error);
      enqueueSnackbar('Cihaz türleri yüklenemedi', { variant: 'error' });
    }
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await getBrands();
      if (response.success && Array.isArray(response.data)) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      enqueueSnackbar('Markalar yüklenemedi', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.deviceTypeId) {
      enqueueSnackbar('Marka adı ve cihaz türü gereklidir', { variant: 'error' });
      return;
    }

    try {
      await createBrand(formData);
      enqueueSnackbar('Marka oluşturuldu', { variant: 'success' });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', deviceTypeId: '', description: '' });
      loadBrands();
    } catch (error) {
      enqueueSnackbar('Marka oluşturulamadı', { variant: 'error' });
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      deviceTypeId: brand.deviceTypeId,
      description: brand.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingBrand || !formData.name.trim() || !formData.deviceTypeId) {
      enqueueSnackbar('Marka adı ve cihaz türü gereklidir', { variant: 'error' });
      return;
    }

    try {
      await updateBrand(editingBrand._id, formData);
      enqueueSnackbar('Marka güncellendi', { variant: 'success' });
      setIsEditDialogOpen(false);
      setEditingBrand(null);
      setFormData({ name: '', deviceTypeId: '', description: '' });
      loadBrands();
    } catch (error) {
      enqueueSnackbar('Marka güncellenemedi', { variant: 'error' });
    }
  };

  const handleDelete = async (brand: Brand) => {
    const confirmed = window.confirm(
      `"${brand.name}" markasını silmek istediğinizden emin misiniz?\n\n` +
      `Bu işlem geri alınamaz ve bu markaya bağlı tüm modeller de etkilenebilir.`
    );
    
    if (!confirmed) return;

    try {
      await deleteBrand(brand._id);
      enqueueSnackbar('Marka silindi', { variant: 'success' });
      loadBrands();
    } catch (error) {
      enqueueSnackbar('Marka silinemedi', { variant: 'error' });
    }
  };

  // Filter brands
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDeviceType = selectedDeviceType === 'all' || brand.deviceTypeId === selectedDeviceType;
    return matchesSearch && matchesDeviceType;
  });

  const getDeviceTypeName = (deviceTypeId: string) => {
    const deviceType = deviceTypes.find(dt => dt._id === deviceTypeId);
    return deviceType?.name || 'Bilinmeyen';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marka Yönetimi</h1>
          <p className="text-muted-foreground">
            Cihaz markalarını yönetin
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Marka
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Marka Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deviceType">Cihaz Türü *</Label>
                <Select value={formData.deviceTypeId} onValueChange={(value) => setFormData({ ...formData, deviceTypeId: value })}>
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
                <Label htmlFor="name">Marka Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="örn: Apple, Samsung, Huawei"
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Marka açıklaması"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreate}>
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
                  placeholder="Marka ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
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
          </div>
        </CardContent>
      </Card>

      {/* Brands List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Markalar yükleniyor...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedDeviceType !== 'all' ? 'Arama kriterlerine uygun marka bulunamadı' : 'Henüz marka eklenmemiş'}
            </p>
          </div>
        ) : (
          filteredBrands.map((brand) => (
            <Card key={brand._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {getDeviceTypeName(brand.deviceTypeId)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(brand)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(brand)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {brand.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
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
            <DialogTitle>Marka Düzenle</DialogTitle>
            <DialogDescription>
              Mevcut marka bilgilerini düzenleyin. Marka, seçilen cihaz türüne bağlı olacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-deviceType">Cihaz Türü *</Label>
              <Select value={formData.deviceTypeId} onValueChange={(value) => setFormData({ ...formData, deviceTypeId: value })}>
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
              <Label htmlFor="edit-name">Marka Adı *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="örn: Apple, Samsung, Huawei"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Açıklama</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Marka açıklaması"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleUpdate}>
                Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 