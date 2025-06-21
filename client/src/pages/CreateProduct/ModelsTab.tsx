import React, { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { BrandIcon } from '../../components/BrandIcon';
import { Model, CreateModelRequest, UpdateModelRequest, createModel, updateModel, deleteModel } from '../../api/models';
import { Brand } from '../../api/brands';
import { DeviceType } from '../../api/deviceTypes';

interface ModelFormData {
  name: string;
  brand: string;
  brandId?: string;
  deviceType: string;
  deviceTypeId?: string;
  description: string;
  icon: string;
}

interface ModelsTabProps {
  brands: Brand[];
  deviceTypes: DeviceType[];
  models: Model[];
  loading: boolean;
  onCreate: (data: CreateModelRequest) => Promise<boolean>;
  onEdit: (id: string, data: UpdateModelRequest) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function ModelsTab({
  brands,
  deviceTypes,
  models,
  loading,
  onCreate,
  onEdit,
  onDelete,
}: ModelsTabProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    brand: '',
    brandId: '',
    deviceType: '',
    deviceTypeId: '',
    description: '',
    icon: 'phone'
  });
  const [editFormData, setEditFormData] = useState<ModelFormData>({
    name: '',
    brand: '',
    brandId: '',
    deviceType: '',
    deviceTypeId: '',
    description: '',
    icon: 'phone'
  });

  const handleStartEdit = (model: Model) => {
    const brand = brands.find(b => b._id === model.brandId);
    const deviceType = deviceTypes.find(dt => dt._id === model.deviceTypeId);

    if (!brand || !deviceType) {
      enqueueSnackbar('Invalid brand or device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return;
    }

    setEditingModel(model);
    setEditFormData({
      name: model.name,
      brand: String(brand.name || ''),
      brandId: brand._id,
      deviceType: String(deviceType.name || ''),
      deviceTypeId: deviceType._id,
      description: model.description || '',
      icon: model.icon || 'phone'
    });
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
    setEditFormData({
      name: '',
      brand: '',
      brandId: '',
      deviceType: '',
      deviceTypeId: '',
      description: '',
      icon: 'phone'
    });
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!name) return;

    const newFormData = { ...formData, [name]: value };

    // If device type is changed, reset brand
    if (name === 'deviceTypeId') {
      const deviceType = deviceTypes.find(dt => dt._id === value);
      newFormData.deviceType = deviceType?.name || '';
      newFormData.brandId = '';
      newFormData.brand = '';
    } else if (name === 'brandId') {
      const brand = brands.find(b => b._id === value);
      newFormData.brand = String(brand?.name || '');
    }
    
    setFormData(newFormData);
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (!name) return;

    const newFormData = { ...formData, [name]: value };

    // If device type is changed, reset brand
    if (name === 'deviceTypeId') {
      const deviceType = deviceTypes.find(dt => dt._id === value);
      newFormData.deviceType = deviceType?.name || '';
      newFormData.brandId = '';
      newFormData.brand = '';
    } else if (name === 'brandId') {
      const brand = brands.find(b => b._id === value);
      newFormData.brand = String(brand?.name || '');
    }
    
    setFormData(newFormData);
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!name) return;

    if (name === 'brandId') {
      const brand = brands.find(b => b._id === value);
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        brand: String(brand?.name || '')
      }));
    } else if (name === 'deviceTypeId') {
      const deviceType = deviceTypes.find(dt => dt._id === value);
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        deviceType: deviceType?.name || ''
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (!name) return;

    if (name === 'brandId') {
      const brand = brands.find(b => b._id === value);
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        brand: String(brand?.name || '')
      }));
    } else if (name === 'deviceTypeId') {
      const deviceType = deviceTypes.find(dt => dt._id === value);
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        deviceType: deviceType?.name || ''
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingModel || !editFormData.name || !editFormData.brandId || !editFormData.deviceTypeId) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return;
    }

    try {
      const updateData: UpdateModelRequest = {
        name: editFormData.name.trim(),
        brand: editFormData.brand,
        brandId: editFormData.brandId,
        deviceType: editFormData.deviceType,
        deviceTypeId: editFormData.deviceTypeId,
        description: editFormData.description.trim() || undefined,
        icon: editFormData.icon
      };

      const success = await onEdit(editingModel._id, updateData);
      if (success) {
        enqueueSnackbar('Model updated successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        setEditingModel(null);
      }
    } catch (error) {
      console.error('Error updating model:', error);
      enqueueSnackbar('Failed to update model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  const handleCreateModel = async () => {
    if (!formData.name.trim() || !formData.brandId || !formData.deviceTypeId) {
      enqueueSnackbar('Lütfen tüm zorunlu alanları doldurun', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return;
    }

    try {
      // Get brand and device type objects
      const brand = brands.find(b => b._id === formData.brandId);
      const deviceType = deviceTypes.find(dt => dt._id === formData.deviceTypeId);

      if (!brand || !deviceType) {
        enqueueSnackbar('Geçersiz marka veya cihaz türü seçimi', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return;
      }

      const createData: CreateModelRequest = {
        name: formData.name.trim(),
        brand: String(brand.name || ''),
        brandId: formData.brandId,
        deviceType: String(deviceType.name || ''),
        deviceTypeId: formData.deviceTypeId,
        description: formData.description.trim() || undefined,
        icon: formData.icon || 'phone'
      };

      console.log('Creating model with data:', createData);
      const success = await onCreate(createData);
      if (success) {
        enqueueSnackbar('Model başarıyla oluşturuldu', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        handleCloseDialog();
        setFormData({
          name: '',
          brand: '',
          brandId: '',
          deviceType: '',
          deviceTypeId: '',
          description: '',
          icon: 'phone'
        });
      }
    } catch (error) {
      console.error('Error creating model:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Model oluşturulurken bir hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      const success = await onDelete(modelId);
      if (success) {
        enqueueSnackbar('Model deleted successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      enqueueSnackbar('Failed to delete model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      brand: '',
      brandId: '',
      deviceType: '',
      deviceTypeId: '',
      description: '',
      icon: 'phone'
    });
  };

  const filteredModels = useMemo(() => {
    return models.filter(model => 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.deviceType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [models, searchQuery]);

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          label="Search Models"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Model
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Device Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredModels.map((model) => {
              const brand = brands.find(b => b._id === model.brandId);
              console.log('Model:', model.name, 'Brand ID:', model.brandId, 'Found Brand:', brand, 'Model Brand:', model.brand);
              const deviceType = deviceTypes.find(dt => dt._id === model.deviceTypeId);
              return (
                <TableRow key={model._id}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BrandIcon brand={brand?.icon || model.icon || ''} size={24} />
                      {brand?.name || model.brand || 'Unknown Brand'}
                    </Box>
                  </TableCell>
                  <TableCell>{deviceType?.name || 'Unknown Device Type'}</TableCell>
                  <TableCell>{model.description}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleStartEdit(model)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteModel(model._id)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Model</DialogTitle>
        <DialogContent>
          <Box component="form" id="create-model-form" noValidate sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal" required error={!formData.deviceTypeId}>
              <InputLabel>Device Type</InputLabel>
              <Select
                name="deviceTypeId"
                value={formData.deviceTypeId}
                onChange={handleSelectChange}
                label="Device Type"
              >
                {deviceTypes.map((dt) => (
                  <MenuItem key={dt._id} value={dt._id}>{dt.name}</MenuItem>
                ))}
              </Select>
              {!formData.deviceTypeId && <FormHelperText>Device Type is required</FormHelperText>}
            </FormControl>

            <FormControl fullWidth margin="normal" required error={!formData.brandId} disabled={!formData.deviceTypeId}>
              <InputLabel>Brand</InputLabel>
              <Select
                name="brandId"
                value={formData.brandId}
                onChange={handleSelectChange}
                label="Brand"
              >
                {brands
                  .filter(brand => brand.deviceTypeId === formData.deviceTypeId)
                  .map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>{brand.name}</MenuItem>
                  ))}
              </Select>
              {!formData.brandId && <FormHelperText>Brand is required</FormHelperText>}
            </FormControl>

            <TextField
              name="name"
              label="Model Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={handleFormChange}
              required
              error={!formData.name}
              helperText={!formData.name ? 'Model name is required' : ''}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Icon</InputLabel>
              <Select
                name="icon"
                value={formData.icon}
                onChange={handleSelectChange}
                label="Icon"
              >
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="tablet">Tablet</MenuItem>
                <MenuItem value="computer">Computer</MenuItem>
                <MenuItem value="laptop">Laptop</MenuItem>
                <MenuItem value="watch">Watch</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="description"
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleFormChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateModel}
            variant="contained"
            color="primary"
            disabled={loading || !formData.name.trim() || !formData.brandId || !formData.deviceTypeId}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {editingModel && (
        <Dialog open={!!editingModel} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Model</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Model Name"
                name="name"
                value={editFormData.name}
                onChange={handleEditFormChange}
                required
                error={!editFormData.name.trim()}
                helperText={!editFormData.name.trim() ? 'Name is required' : ''}
              />
              <FormControl fullWidth required error={!editFormData.brandId}>
                <InputLabel>Brand</InputLabel>
                <Select
                  name="brandId"
                  value={editFormData.brandId}
                  onChange={handleEditSelectChange}
                  label="Brand"
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
                {!editFormData.brandId && (
                  <FormHelperText>Brand is required</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth required error={!editFormData.deviceTypeId}>
                <InputLabel>Device Type</InputLabel>
                <Select
                  name="deviceTypeId"
                  value={editFormData.deviceTypeId}
                  onChange={handleEditSelectChange}
                  label="Device Type"
                >
                  {deviceTypes.map((type) => (
                    <MenuItem key={type._id} value={type._id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
                {!editFormData.deviceTypeId && (
                  <FormHelperText>Device Type is required</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Icon</InputLabel>
                <Select
                  name="icon"
                  value={editFormData.icon}
                  onChange={handleEditSelectChange}
                  label="Icon"
                >
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="tablet">Tablet</MenuItem>
                  <MenuItem value="computer">Computer</MenuItem>
                  <MenuItem value="laptop">Laptop</MenuItem>
                  <MenuItem value="watch">Watch</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editFormData.description}
                onChange={handleEditFormChange}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              color="primary"
              disabled={loading || !editFormData.name.trim() || !editFormData.brandId || !editFormData.deviceTypeId}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
} 