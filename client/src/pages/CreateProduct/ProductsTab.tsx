import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/contexts/AuthContext';
import { BrandIcon } from '@/components/BrandIcon';
import type { Model } from '@/api/models';
import type { Brand } from '@/api/brands';
import type { DeviceType } from '@/api/deviceTypes';
import type { CreateProductRequest } from '@/api/products';
import { getPartsByBrand } from '@/api/parts';

interface ProductsTabProps {
  models: Model[];
  brands: Brand[];
  deviceTypes: DeviceType[];
  loading: boolean;
  onCreate: (data: CreateProductRequest) => Promise<boolean>;
}

interface ProductFormData {
  type: 'Computer' | 'Tablet' | 'iPad' | 'Phone' | 'Other';
  brand: string;
  model: string;
  part: string;
  descriptions: {
    tr: string;
    de: string;
    en: string;
  };
  price: number;
  stock: number;
  minStockLevel?: number;
  warrantyEligible?: boolean;
  warrantyTerms?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  status?: 'active' | 'inactive';
}

export function ProductsTab({
  models,
  brands,
  deviceTypes,
  loading,
  onCreate,
}: ProductsTabProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [addingToInventory, setAddingToInventory] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    type: 'Phone',
    brand: '',
    model: '',
    part: '',
    descriptions: {
      tr: '',
      de: '',
      en: '',
    },
    price: 0,
    stock: 0,
    minStockLevel: 0,
    warrantyEligible: false,
    status: 'active',
  });

  const handleAddToInventory = async (brandId: string) => {
    if (!user?.branchId) {
      enqueueSnackbar('Şube bilgisi bulunamadı', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return;
    }

    try {
      setAddingToInventory(brandId);
      const response = await getPartsByBrand(brandId);
      
      if (response.success) {
        // Add parts to branch inventory
        const addToBranchResponse = await fetch('/api/branch-parts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            branchId: user.branchId,
            parts: response.data.map(part => ({
              partId: part._id,
              modelId: typeof part.modelId === 'object' ? part.modelId._id : part.modelId,
              brandId: typeof part.brandId === 'object' ? part.brandId._id : part.brandId,
              deviceTypeId: typeof part.deviceTypeId === 'object' ? part.deviceTypeId._id : part.deviceTypeId,
              category: part.category,
              name: part.name,
              description: part.description,
              barcode: part.barcode,
              qrCode: part.qrCode,
              isActive: part.isActive,
              compatibleWith: part.compatibleWith,
              cost: part.cost,
              margin: part.margin,
              minStockLevel: part.minStockLevel,
              price: part.price,
              shelfNumber: part.shelfNumber,
              stock: part.stock,
              updatedBy: user._id
            }))
          })
        });

        const result = await addToBranchResponse.json();
        
        if (result.success) {
          enqueueSnackbar(`${result.data.length} parça başarıyla envantere eklendi`, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        } else {
          throw new Error(result.message || 'Parçalar envantere eklenirken bir hata oluştu');
        }
      } else {
        throw new Error(response.message || 'Parça bilgileri alınamadı');
      }
    } catch (error) {
      console.error('Envanter ekleme hatası:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Parçalar envantere eklenirken bir hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    } finally {
      setAddingToInventory(null);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      type: 'Phone',
      brand: '',
      model: '',
      part: '',
      descriptions: {
        tr: '',
        de: '',
        en: '',
      },
      price: 0,
      stock: 0,
      minStockLevel: 0,
      warrantyEligible: false,
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      type: 'Phone',
      brand: '',
      model: '',
      part: '',
      descriptions: {
        tr: '',
        de: '',
        en: '',
      },
      price: 0,
      stock: 0,
      minStockLevel: 0,
      warrantyEligible: false,
      status: 'active',
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await onCreate(formData);
    if (success) {
      handleCloseDialog();
    }
  };

  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    setFormData({
      ...formData,
      type: e.target.value as 'Computer' | 'Tablet' | 'iPad' | 'Phone' | 'Other',
    });
  };

  const handleBrandChange = (e: SelectChangeEvent<string>) => {
    setFormData({
      ...formData,
      brand: e.target.value,
      model: '', // Reset model when brand changes
    });
  };

  const handleModelChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, model: e.target.value });
  };

  const handlePartChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, part: e.target.value });
  };

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, price: Number(e.target.value) });
  };

  const handleStockChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, stock: Number(e.target.value) });
  };

  const handleMinStockLevelChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, minStockLevel: Number(e.target.value) });
  };

  const handleDescriptionChange = (lang: 'tr' | 'de' | 'en') => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      descriptions: {
        ...formData.descriptions,
        [lang]: e.target.value,
      },
    });
  };

  const handleWarrantyTermsChange = (lang: 'tr' | 'de' | 'en') => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      warrantyTerms: {
        ...formData.warrantyTerms,
        [lang]: e.target.value,
      },
    });
  };

  const handleWarrantyEligibleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, warrantyEligible: e.target.checked });
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData({
      ...formData,
      status: e.target.value as 'active' | 'inactive',
    });
  };

  const filteredBrands = brands.filter(brand => {
    const deviceType = deviceTypes.find(dt => dt._id === brand.deviceTypeId);
    return deviceType?.name === formData.type;
  });

  const filteredModels = models.filter(model => {
    const brand = brands.find(b => b._id === model.brandId);
    return brand?._id === formData.brand;
  });

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Brands</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Product
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Brand</TableCell>
              <TableCell>Device Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((brand) => {
              const deviceType = deviceTypes.find(dt => dt._id === brand.deviceTypeId);
              return (
                <TableRow key={brand._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BrandIcon brand={brand.icon} size={24} />
                      {brand.name}
                    </Box>
                  </TableCell>
                  <TableCell>{deviceType?.name || 'Unknown Device Type'}</TableCell>
                  <TableCell>{brand.description}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<InventoryIcon />}
                      onClick={() => handleAddToInventory(brand._id)}
                      disabled={loading || addingToInventory === brand._id}
                    >
                      {addingToInventory === brand._id ? (
                        <CircularProgress size={20} />
                      ) : (
                        'Add to Inventory'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2
              }}>
                <Box>
                  <FormControl fullWidth required>
                    <InputLabel>Device Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={handleTypeChange}
                      label="Device Type"
                    >
                      <MenuItem value="Phone">Phone</MenuItem>
                      <MenuItem value="Tablet">Tablet</MenuItem>
                      <MenuItem value="iPad">iPad</MenuItem>
                      <MenuItem value="Computer">Computer</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <FormControl fullWidth required>
                    <InputLabel>Brand</InputLabel>
                    <Select
                      value={formData.brand}
                      onChange={handleBrandChange}
                      label="Brand"
                      disabled={!formData.type}
                    >
                      {filteredBrands.map((brand) => (
                        <MenuItem key={brand._id} value={brand._id}>
                          {brand.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <FormControl fullWidth required>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={formData.model}
                      onChange={handleModelChange}
                      label="Model"
                      disabled={!formData.brand}
                    >
                      {filteredModels.map((model) => (
                        <MenuItem key={model._id} value={model._id}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                <Box>
                  <TextField
                    label="Part Name"
                    value={formData.part}
                    onChange={handlePartChange}
                    required
                    fullWidth
                  />
                </Box>
                <Box>
                  <TextField
                    label="Price"
                    type="number"
                    value={formData.price}
                    onChange={handlePriceChange}
                    required
                    fullWidth
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    label="Stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleStockChange}
                    required
                    fullWidth
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    label="Minimum Stock Level"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={handleMinStockLevelChange}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Descriptions
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 2
                }}>
                  <Box>
                    <TextField
                      label="Turkish Description"
                      value={formData.descriptions.tr}
                      onChange={handleDescriptionChange('tr')}
                      required
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="German Description"
                      value={formData.descriptions.de}
                      onChange={handleDescriptionChange('de')}
                      required
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="English Description"
                      value={formData.descriptions.en}
                      onChange={handleDescriptionChange('en')}
                      required
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Warranty Terms (Optional)
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 2
                }}>
                  <Box>
                    <TextField
                      label="Turkish Warranty Terms"
                      value={formData.warrantyTerms?.tr || ''}
                      onChange={handleWarrantyTermsChange('tr')}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="German Warranty Terms"
                      value={formData.warrantyTerms?.de || ''}
                      onChange={handleWarrantyTermsChange('de')}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="English Warranty Terms"
                      value={formData.warrantyTerms?.en || ''}
                      onChange={handleWarrantyTermsChange('en')}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status || 'active'}
                      onChange={handleStatusChange}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}