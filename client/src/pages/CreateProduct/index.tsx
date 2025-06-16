import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Tabs, Tab, useTheme } from '@mui/material';
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
import { DeviceTypesTab } from './DeviceTypesTab';
import { BrandsTab } from './BrandsTab';
import { ModelsTab } from './ModelsTab';
import { ProductsTab } from './ProductsTab';
import { PartsTab } from './PartsTab';
import { getParts, createPart, updatePart, deletePart } from '@/api/parts';
import type { Part, CreatePartRequest, UpdatePartRequest } from '@/api/parts';
import { ProductTypeTab } from './ProductTypeTab';
import { getPartsByBrand } from '@/api/parts';

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
      id={`create-product-tabpanel-${index}`}
      aria-labelledby={`create-product-tab-${index}`}
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
  const { user, isAuthenticated, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadDeviceTypes(),
          loadBrands(),
          loadModels(),
          loadParts()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        if (error instanceof Error && error.message.includes('401')) {
          try {
            await refreshUserData();
            // Retry loading data after token refresh
            await Promise.all([
              loadDeviceTypes(),
              loadBrands(),
              loadModels(),
              loadParts()
            ]);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            enqueueSnackbar('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
            navigate('/login');
          }
        } else {
          enqueueSnackbar('Veriler yüklenirken bir hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate, refreshUserData]);

  const loadDeviceTypes = async () => {
    try {
      const response = await getDeviceTypes();
      if (response.success) {
        setDeviceTypes(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch device types');
      }
    } catch (error) {
      console.error('Error loading device types:', error);
      throw error;
    }
  };

  const loadBrands = async () => {
    try {
      const response = await getBrands();
      console.log('Brands API Response:', response);
      if (response.success) {
        setBrands(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch brands');
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      throw error;
    }
  };

  const loadModels = async () => {
    try {
      const response = await getModels();
      console.log('Models API Response:', response);
      if (response.success) {
        setModels(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Error loading models:', error);
      throw error;
    }
  };

  const loadParts = async () => {
    try {
      const response = await getParts();
      if (response.success) {
        setParts(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch parts');
      }
    } catch (error) {
      console.error('Error loading parts:', error);
      throw error;
    }
  };

  const handleCreateDeviceType = async (data: CreateDeviceTypeRequest) => {
    try {
      setLoading(true);
      const response = await createDeviceType(data);
      if (response.success) {
        setDeviceTypes(prev => [...prev, response.data]);
        enqueueSnackbar('Device type created successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to create device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error creating device type:', error);
      enqueueSnackbar('Failed to create device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditDeviceType = async (id: string, data: UpdateDeviceTypeRequest) => {
    try {
      setLoading(true);
      const response = await updateDeviceType(id, data);
      if (response.success) {
        setDeviceTypes(prev => prev.map(dt => dt._id === id ? response.data : dt));
        enqueueSnackbar('Device type updated successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to update device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error updating device type:', error);
      enqueueSnackbar('Failed to update device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeviceType = async (id: string) => {
    try {
      setLoading(true);
      const response = await deleteDeviceType(id);
      if (response.success) {
        setDeviceTypes(prev => prev.filter(dt => dt._id !== id));
        enqueueSnackbar('Device type deleted successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to delete device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error deleting device type:', error);
      enqueueSnackbar('Failed to delete device type', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async (data: CreateBrandRequest) => {
    try {
      setLoading(true);
      const response = await createBrand(data);
      if (response.success) {
        setBrands(prev => [...prev, response.data]);
        enqueueSnackbar('Brand created successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to create brand', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error creating brand:', error);
      enqueueSnackbar('Failed to create brand', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = async (id: string, data: UpdateBrandRequest) => {
    try {
      setLoading(true);
      const response = await updateBrand(id, data);
      if (response.success) {
        setBrands(prev => prev.map(b => b._id === id ? response.data : b));
        enqueueSnackbar('Brand updated successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to update brand', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      enqueueSnackbar('Failed to update brand', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      setLoading(true);
      const response = await deleteBrand(id);
      if (response.success) {
        setBrands(prev => prev.filter(b => b._id !== id));
        enqueueSnackbar('Brand deleted successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to delete brand', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      enqueueSnackbar('Failed to delete brand', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async (data: CreateModelRequest) => {
    try {
      setLoading(true);
      console.log('Data being sent to createModel API:', data);
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
        setModels(prev => prev.map(m => m._id === id ? response.data : m));
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
      const response = await deleteModel(id);
      if (response.success) {
        setModels(prev => prev.filter(m => m._id !== id));
        enqueueSnackbar('Model deleted successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to delete model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      enqueueSnackbar('Failed to delete model', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (data: CreateProductRequest) => {
    try {
      setLoading(true);
      const response = await createProduct(data);
      if (response.success) {
        enqueueSnackbar('Product created successfully', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        navigate('/products');
        return true;
      } else {
        enqueueSnackbar(response.message || 'Failed to create product', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return false;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      enqueueSnackbar('Failed to create product', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePart = async (data: CreatePartRequest): Promise<boolean> => {
    try {
      const response = await createPart(data);
      if (response.success) {
        await loadParts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating part:', error);
      throw error;
    }
  };

  const handleEditPart = async (id: string, data: UpdatePartRequest): Promise<boolean> => {
    try {
      const response = await updatePart(id, data);
      if (response.success) {
        await loadParts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating part:', error);
      throw error;
    }
  };

  const handleDeletePart = async (id: string): Promise<boolean> => {
    try {
      const response = await deletePart(id);
      if (response.success) {
        await loadParts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting part:', error);
      throw error;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddToInventory = async (brandId: string) => {
    if (!user?.branchId) {
      enqueueSnackbar('Branch ID is required', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      return;
    }

    try {
      setLoading(true);
      const response = await getPartsByBrand(brandId);
      
      if (response.success) {
        // Add parts to branch inventory
        const addToBranchResponse = await fetch('/api/branch-parts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            branchId: user.branchId,
            parts: response.data.map(part => ({
              ...part,
              branchId: user.branchId,
              stock: 0, // Initial stock is 0
              isActive: true
            }))
          })
        });

        const result = await addToBranchResponse.json();
        
        if (result.success) {
          enqueueSnackbar(`Successfully added ${result.data.length} parts to inventory`, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        } else {
          throw new Error(result.message || 'Failed to add parts to inventory');
        }
      } else {
        throw new Error(response.message || 'Failed to fetch parts');
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Failed to add to inventory', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Product Management
        </Typography>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="product management tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Product Type" {...a11yProps(0)} />
            <Tab label="Device Types" {...a11yProps(1)} />
            <Tab label="Brands" {...a11yProps(2)} />
            <Tab label="Models" {...a11yProps(3)} />
            <Tab label="Parts" {...a11yProps(4)} />
            <Tab label="Products" {...a11yProps(5)} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <ProductTypeTab
              brands={brands}
              deviceTypes={deviceTypes}
              loading={loading}
              onAddToInventory={handleAddToInventory}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <DeviceTypesTab
              deviceTypes={deviceTypes}
              loading={loading}
              onCreate={handleCreateDeviceType}
              onEdit={handleEditDeviceType}
              onDelete={handleDeleteDeviceType}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <BrandsTab
              brands={brands}
              deviceTypes={deviceTypes}
              loading={loading}
              onCreate={handleCreateBrand}
              onEdit={handleEditBrand}
              onDelete={handleDeleteBrand}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
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

          <TabPanel value={activeTab} index={4}>
            <PartsTab
              brands={brands}
              deviceTypes={deviceTypes}
              models={models}
              loading={loading}
              onCreate={handleCreatePart}
              onEdit={handleEditPart}
              onDelete={handleDeletePart}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <ProductsTab
              models={models}
              brands={brands}
              deviceTypes={deviceTypes}
              loading={loading}
              onCreate={handleCreateProduct}
            />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}