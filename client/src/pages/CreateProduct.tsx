import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Tabs, Tab, Button, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceTypes, createDeviceType, updateDeviceType, deleteDeviceType } from '@/api/deviceTypes';
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/api/brands';
import { getModels, createModel, updateModel, deleteModel } from '@/api/models';
import { createProduct } from '@/api/products';
import type { DeviceType, CreateDeviceTypeRequest, UpdateDeviceTypeRequest } from '@/api/deviceTypes';
import type { Brand, CreateBrandRequest, UpdateBrandRequest } from '@/api/brands';
import type { Model, CreateModelRequest, UpdateModelRequest } from '@/api/models';
import type { CreateProductRequest } from '@/api/products';
import { DeviceTypesTab } from '@/pages/CreateProduct/DeviceTypesTab';
import { BrandsTab } from '@/pages/CreateProduct/BrandsTab';
import { ModelsTab } from '@/pages/CreateProduct/ModelsTab';
import { PartsTab } from '@/pages/CreateProduct/PartsTab';
import { ProductsTab } from '@/pages/CreateProduct/ProductsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `create-product-tab-${index}`,
    'aria-controls': `create-product-tabpanel-${index}`,
  };
}

export default function CreateProduct() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [value, setValue] = useState(0);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brandsResponse, deviceTypesResponse, modelsResponse] = await Promise.all([
        getBrands(),
        getDeviceTypes(),
        getModels()
      ]);

      if (brandsResponse.success) {
        setBrands(brandsResponse.data);
      } else {
        enqueueSnackbar(brandsResponse.message || 'Failed to load brands', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      }
      if (deviceTypesResponse.success) {
        setDeviceTypes(deviceTypesResponse.data);
      } else {
        enqueueSnackbar(deviceTypesResponse.message || 'Failed to load device types', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      }
      if (modelsResponse.success) {
        setModels(modelsResponse.data);
      } else {
        enqueueSnackbar(modelsResponse.message || 'Failed to load models', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      enqueueSnackbar('Failed to load data', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleCreateDeviceType = async (data: CreateDeviceTypeRequest): Promise<boolean> => {
    const response = await getDeviceTypes();
    if (response.success) {
      setDeviceTypes(response.data);
      return true;
    }
    return false;
  };

  const handleEditDeviceType = async (id: string, data: UpdateDeviceTypeRequest): Promise<boolean> => {
    const response = await getDeviceTypes();
    if (response.success) {
      setDeviceTypes(response.data);
      return true;
    }
    return false;
  };

  const handleDeleteDeviceType = async (id: string): Promise<boolean> => {
    const response = await getDeviceTypes();
    if (response.success) {
      setDeviceTypes(response.data);
      return true;
    }
    return false;
  };

  const handleCreateBrand = async (data: CreateBrandRequest): Promise<boolean> => {
    const response = await getBrands();
    if (response.success) {
      setBrands(response.data);
      return true;
    }
    return false;
  };

  const handleEditBrand = async (id: string, data: UpdateBrandRequest): Promise<boolean> => {
    const response = await getBrands();
    if (response.success) {
      setBrands(response.data);
      return true;
    }
    return false;
  };

  const handleDeleteBrand = async (id: string): Promise<boolean> => {
    const response = await getBrands();
    if (response.success) {
      setBrands(response.data);
      return true;
    }
    return false;
  };

  const handleCreateModel = async (data: CreateModelRequest) => {
    try {
      setLoading(true);
      const response = await createModel(data);
      if (response.success) {
        setModels(prev => [...prev, response.data]);
        enqueueSnackbar('Model created successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to create model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error creating model:', error);
      enqueueSnackbar('Failed to create model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditModel = async (id: string, data: UpdateModelRequest) => {
    try {
      setLoading(true);
      const response = await updateModel(id, data);
      if (response.success) {
        setModels(prev => prev.map(model => model._id === id ? response.data : model));
        enqueueSnackbar('Model updated successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to update model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error updating model:', error);
      enqueueSnackbar('Failed to update model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      setLoading(true);
      await deleteModel(id);
      setModels(prev => prev.filter(m => m._id !== id));
      enqueueSnackbar('Model deleted successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      enqueueSnackbar('Failed to delete model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleCreateProduct = async (data: CreateProductRequest) => {
    try {
      setLoading(true);
      const response = await createProduct(data);
      if (response) {
        enqueueSnackbar('Product created successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        navigate('/products');
        return true;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      enqueueSnackbar('Failed to create product', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    } finally {
      setLoading(false);
    }
    return false;
  };

  return (
    <Container maxWidth="xl">
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="create product tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Device Types" {...a11yProps(0)} />
          <Tab label="Brands" {...a11yProps(1)} />
          <Tab label="Models" {...a11yProps(2)} />
          <Tab label="Parts" {...a11yProps(3)} />
          <Tab label="Product Type" {...a11yProps(4)} />
        </Tabs>

        <TabPanel value={value} index={0}>
          <DeviceTypesTab
            deviceTypes={deviceTypes}
            loading={loading}
            onCreate={handleCreateDeviceType}
            onEdit={handleEditDeviceType}
            onDelete={handleDeleteDeviceType}
          />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <BrandsTab
            brands={brands}
            deviceTypes={deviceTypes}
            loading={loading}
            onCreate={handleCreateBrand}
            onEdit={handleEditBrand}
            onDelete={handleDeleteBrand}
          />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <ModelsTab
            models={models}
            brands={brands}
            deviceTypes={deviceTypes}
            loading={loading}
            onCreate={handleCreateModel}
            onEdit={handleEditModel}
            onDelete={handleDeleteModel}
          />
        </TabPanel>

        <TabPanel value={value} index={3}>
          <PartsTab
            branchId={user?.branchId || ''}
            userId={user?.id || ''}
          />
        </TabPanel>

        <TabPanel value={value} index={4}>
          <ProductsTab
            models={models}
            brands={brands}
            deviceTypes={deviceTypes}
            loading={loading}
            onCreate={handleCreateProduct}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
} 