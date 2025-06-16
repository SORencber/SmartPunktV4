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
import { DeviceTypeIcon } from '@/components/DeviceTypeIcon';
import { IconSelect } from '@/components/IconSelect';
import type { DeviceType, CreateDeviceTypeRequest, UpdateDeviceTypeRequest } from '@/api/deviceTypes';
import { useSnackbar } from 'notistack';

interface DeviceTypesTabProps {
  deviceTypes: DeviceType[];
  loading: boolean;
  onCreate: (data: CreateDeviceTypeRequest) => Promise<boolean>;
  onEdit: (id: string, data: UpdateDeviceTypeRequest) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export interface DeviceTypeFormData {
  name: string;
  icon: string;
  description: string;
}

export interface UpdateDeviceTypeFormData {
  name: string;
  icon: string;
  description: string;
}

export function DeviceTypesTab({
  deviceTypes,
  loading,
  onCreate,
  onEdit,
  onDelete,
}: DeviceTypesTabProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<DeviceTypeFormData | null>(null);
  const [formData, setFormData] = useState<DeviceTypeFormData>({
    name: '',
    icon: '',
    description: '',
  });
  const [newDeviceType, setNewDeviceType] = useState<DeviceTypeFormData>({
    name: '',
    icon: '',
    description: '',
  });

  const filteredDeviceTypes = useMemo(() => {
    return deviceTypes.filter(dt => 
      dt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dt.icon.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [deviceTypes, searchQuery]);

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      icon: '',
      description: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      icon: '',
      description: '',
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await onCreate(formData);
    if (success) {
      handleCloseDialog();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this device type?')) {
      await onDelete(id);
    }
  };

  const handleStartEdit = (deviceType: DeviceType) => {
    setEditingId(deviceType._id);
    setEditFormData({
      name: deviceType.name,
      icon: deviceType.icon ?? '',
      description: deviceType.description ?? ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editFormData) return;

    try {
      // Validate required fields
      if (!editFormData.name.trim()) {
        enqueueSnackbar('Device type name is required', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return;
      }
      if (!editFormData.icon) {
        enqueueSnackbar('Icon is required', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return;
      }

      const updateData: UpdateDeviceTypeRequest = {
        name: editFormData.name.trim(),
        icon: editFormData.icon,
        description: editFormData.description.trim() || undefined
      };

      const success = await onEdit(editingId, updateData);
      if (success) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Error updating device type:', error);
      enqueueSnackbar('Failed to update device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  const handleEditFormChange = (field: keyof DeviceTypeFormData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setEditFormData(prev => ({
      ...prev!,
      [field]: e.target.value,
    }));
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, icon: e.target.value });
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const handleCreateDeviceType = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!newDeviceType.name.trim()) {
        enqueueSnackbar('Device type name is required', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return;
      }
      if (!newDeviceType.icon) {
        enqueueSnackbar('Icon is required', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return;
      }

      const createData: CreateDeviceTypeRequest = {
        name: newDeviceType.name.trim(),
        icon: newDeviceType.icon,
        description: newDeviceType.description.trim() || undefined
      };

      const success = await onCreate(createData);
      if (success) {
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error creating device type:', error);
      enqueueSnackbar('Failed to create device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Search device types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenDialog}
          disabled={loading}
        >
          Add Device Type
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredDeviceTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No device types found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDeviceTypes.map((deviceType) => (
                <TableRow key={deviceType._id}>
                  <TableCell>
                    {editingId === deviceType._id ? (
                      <IconSelect
                        type="deviceType"
                        value={editFormData?.icon ?? ''}
                        onChange={(value) => {
                          if (editFormData) {
                            setEditFormData({ ...editFormData, icon: value });
                          }
                        }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DeviceTypeIcon icon={deviceType.icon} size={32} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === deviceType._id ? (
                      <TextField
                        fullWidth
                        value={editFormData?.name ?? ''}
                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                        error={!editFormData?.name.trim()}
                        helperText={!editFormData?.name.trim() ? 'Name is required' : ''}
                      />
                    ) : (
                      deviceType.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === deviceType._id ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={editFormData?.description ?? ''}
                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                      />
                    ) : (
                      deviceType.description
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === deviceType._id ? (
                      <Box>
                        <IconButton 
                          onClick={handleSaveEdit} 
                          color="primary" 
                          size="small"
                          disabled={!editFormData?.name.trim() || !editFormData?.icon}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit} color="error" size="small">
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton onClick={() => handleStartEdit(deviceType)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this device type?')) {
                          onDelete(deviceType._id);
                        }
                      }} 
                      color="error" 
                      size="small"
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
        <form onSubmit={handleCreateDeviceType}>
          <DialogTitle>Add Device Type</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={newDeviceType.name}
                onChange={(e) => setNewDeviceType(prev => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
                error={!newDeviceType.name.trim()}
                helperText={!newDeviceType.name.trim() ? 'Name is required' : ''}
              />
              <FormControl fullWidth required error={!newDeviceType.icon}>
                <InputLabel>Icon</InputLabel>
                <IconSelect 
                  type="deviceType"
                  value={newDeviceType.icon} 
                  onChange={(value) => setNewDeviceType(prev => ({ ...prev, icon: value }))} 
                />
                {!newDeviceType.icon && (
                  <FormHelperText>Icon is required</FormHelperText>
                )}
              </FormControl>
              <TextField
                label="Description"
                value={newDeviceType.description}
                onChange={(e) => setNewDeviceType(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={loading || !newDeviceType.name.trim() || !newDeviceType.icon}
            >
              {loading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 