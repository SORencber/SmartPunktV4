import React, { useState, ChangeEvent, FormEvent, useMemo } from 'react';
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
  SelectChangeEvent,
  InputAdornment,
  DialogContentText,
  FormHelperText,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { BrandIcon } from '@/components/BrandIcon';
import { IconSelect } from '@/components/IconSelect';
import type { Brand, CreateBrandRequest, UpdateBrandRequest } from '@/api/brands';
import type { DeviceType } from '@/api/deviceTypes';
import { toast } from 'react-toastify';

interface BrandsTabProps {
  brands: Brand[];
  deviceTypes: DeviceType[];
  loading: boolean;
  onCreate: (data: CreateBrandRequest) => Promise<boolean>;
  onEdit: (id: string, data: UpdateBrandRequest) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export interface BrandFormData {
  name: string;
  deviceTypeId: string;
  deviceType?: string;
  icon: string;
  description: string;
}

export interface UpdateBrandFormData {
  name: string;
  deviceTypeId: string;
  deviceType?: string;
  icon: string;
  description: string;
}

export function BrandsTab({
  brands,
  deviceTypes,
  loading,
  onCreate,
  onEdit,
  onDelete,
}: BrandsTabProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<BrandFormData | null>(null);
  const [newBrand, setNewBrand] = useState<BrandFormData>({
    name: '',
    deviceTypeId: '',
    icon: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewBrand({
      name: '',
      deviceTypeId: '',
      icon: '',
      description: '',
    });
  };

  const handleStartEdit = (brand: Brand) => {
    // Find the device type name
    const deviceType = deviceTypes.find(dt => dt._id === brand.deviceTypeId);
    if (!deviceType) {
      toast.error('Invalid device type');
      return;
    }

    setEditingId(brand._id);
    setEditFormData({
      name: brand.name,
      deviceTypeId: brand.deviceTypeId ?? '',
      deviceType: deviceType.name, // Add deviceType name
      icon: brand.icon ?? '',
      description: brand.description ?? ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleEditFormChange = (field: keyof BrandFormData, value: string) => {
    if (!editFormData) return;

    if (field === 'deviceTypeId') {
      // Find the device type name when deviceTypeId changes
      const deviceType = deviceTypes.find(dt => dt._id === value);
      if (deviceType) {
        setEditFormData({
          ...editFormData,
          deviceTypeId: value,
          deviceType: deviceType.name
        });
      }
    } else {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editFormData) return;

    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!editFormData.name.trim()) {
        toast.error('Brand name is required');
        return;
      }
      if (!editFormData.deviceTypeId) {
        toast.error('Device type is required');
        return;
      }
      if (!editFormData.icon) {
        toast.error('Icon is required');
        return;
      }

      // Find the device type name
      const deviceType = deviceTypes.find(dt => dt._id === editFormData.deviceTypeId);
      if (!deviceType) {
        toast.error('Invalid device type');
        return;
      }

      const updateData: UpdateBrandRequest = {
        name: editFormData.name.trim(),
        deviceTypeId: editFormData.deviceTypeId,
        deviceType: deviceType.name,
        icon: editFormData.icon,
        description: editFormData.description.trim() || undefined
      };

      const success = await onEdit(editingId, updateData);
      if (success) {
        toast.success('Brand updated successfully');
        handleCancelEdit();
      } else {
        toast.error('Failed to update brand');
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error('Failed to update brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBrand = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!newBrand.name.trim()) {
        toast.error('Brand name is required');
        return;
      }
      if (!newBrand.deviceTypeId) {
        toast.error('Device type is required');
        return;
      }
      if (!newBrand.icon) {
        toast.error('Icon is required');
        return;
      }

      // Find the device type name
      const deviceType = deviceTypes.find(dt => dt._id === newBrand.deviceTypeId);
      if (!deviceType) {
        toast.error('Invalid device type');
        return;
      }

      const createData: CreateBrandRequest = {
        name: newBrand.name.trim(),
        deviceTypeId: newBrand.deviceTypeId,
        deviceType: deviceType.name,
        icon: newBrand.icon,
        description: newBrand.description.trim() || undefined
      };

      const success = await onCreate(createData);
      if (success) {
        toast.success('Brand created successfully');
        handleCloseDialog();
      } else {
        toast.error('Failed to create brand');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onDelete(id);
      toast.success('Brand deleted successfully');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.deviceType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Add Brand
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Device Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No brands found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand._id}>
                  <TableCell>
                    {editingId === brand._id ? (
                      <IconSelect
                        value={editFormData?.icon ?? ''}
                        onChange={(value) => {
                          if (editFormData) {
                            setEditFormData({ ...editFormData, icon: value });
                          }
                        }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BrandIcon brand={brand.icon ?? ''} size={32} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === brand._id ? (
                      <TextField
                        fullWidth
                        value={editFormData?.name ?? ''}
                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                        error={!editFormData?.name.trim()}
                        helperText={!editFormData?.name.trim() ? 'Name is required' : ''}
                      />
                    ) : (
                      brand.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === brand._id ? (
                      <FormControl fullWidth error={!editFormData?.deviceTypeId}>
                        <InputLabel>Device Type</InputLabel>
                        <Select
                          name="deviceTypeId"
                          value={editFormData?.deviceTypeId ?? ''}
                          onChange={(e) => handleEditFormChange('deviceTypeId', e.target.value)}
                        >
                          {deviceTypes.map((dt) => (
                            <MenuItem key={dt._id} value={dt._id}>
                              {dt.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {!editFormData?.deviceTypeId && <FormHelperText>Device type is required</FormHelperText>}
                      </FormControl>
                    ) : (
                      deviceTypes.find(dt => dt._id === brand.deviceTypeId)?.name || 'Unknown'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === brand._id ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={editFormData?.description ?? ''}
                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                      />
                    ) : (
                      brand.description
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === brand._id ? (
                      <Box>
                        <IconButton 
                          onClick={handleSaveEdit} 
                          color="primary" 
                          size="small"
                          disabled={isSubmitting || !editFormData?.name.trim() || !editFormData?.deviceTypeId || !editFormData?.icon}
                        >
                          {isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                        </IconButton>
                        <IconButton 
                          onClick={handleCancelEdit} 
                          color="error" 
                          size="small"
                          disabled={isSubmitting}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton 
                        onClick={() => handleStartEdit(brand)} 
                        color="primary" 
                        size="small"
                        disabled={isSubmitting}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      onClick={() => handleDelete(brand._id)} 
                      color="error" 
                      size="small"
                      disabled={isSubmitting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateBrand}>
          <DialogTitle>Add Brand</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={newBrand.name}
                onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
                error={!newBrand.name.trim()}
                helperText={!newBrand.name.trim() ? 'Name is required' : ''}
              />
              <FormControl fullWidth required error={!newBrand.deviceTypeId}>
                <InputLabel>Device Type</InputLabel>
                <Select
                  value={newBrand.deviceTypeId}
                  onChange={(e) => setNewBrand(prev => ({ ...prev, deviceTypeId: e.target.value }))}
                  label="Device Type"
                >
                  {deviceTypes.map((dt) => (
                    <MenuItem key={dt._id} value={dt._id}>
                      {dt.name}
                    </MenuItem>
                  ))}
                </Select>
                {!newBrand.deviceTypeId && (
                  <FormHelperText>Device type is required</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth required error={!newBrand.icon}>
                <InputLabel>Icon</InputLabel>
                <IconSelect 
                  value={newBrand.icon} 
                  onChange={(value) => setNewBrand(prev => ({ ...prev, icon: value }))} 
                />
                {!newBrand.icon && (
                  <FormHelperText>Icon is required</FormHelperText>
                )}
              </FormControl>
              <TextField
                label="Description"
                value={newBrand.description}
                onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={isSubmitting || !newBrand.name.trim() || !newBrand.deviceTypeId || !newBrand.icon}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 