import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import type { Brand } from '@/api/brands';
import type { DeviceType } from '@/api/deviceTypes';

interface ProductTypeTabProps {
  brands: Brand[];
  deviceTypes: DeviceType[];
  loading: boolean;
  onAddToInventory: (brandId: string) => Promise<void>;
}

export function ProductTypeTab({ brands, deviceTypes, loading, onAddToInventory }: ProductTypeTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);

  useEffect(() => {
    let filtered = brands;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by device type
    if (selectedDeviceType !== 'all') {
      filtered = filtered.filter(brand => 
        brand.deviceTypeId === selectedDeviceType
      );
    }

    setFilteredBrands(filtered);
  }, [brands, searchTerm, selectedDeviceType]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDeviceTypeChange = (event: SelectChangeEvent) => {
    setSelectedDeviceType(event.target.value);
  };

  const getDeviceTypeName = (brand: Brand) => {
    const deviceType = deviceTypes.find(dt => dt._id === brand.deviceTypeId);
    return deviceType?.name || 'Unknown Device Type';
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search Brands"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Device Type</InputLabel>
          <Select
            value={selectedDeviceType}
            label="Device Type"
            onChange={handleDeviceTypeChange}
          >
            <MenuItem value="all">All Device Types</MenuItem>
            {deviceTypes.map((dt) => (
              <MenuItem key={dt._id} value={dt._id}>
                {dt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Brand Name</TableCell>
              <TableCell>Device Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="textSecondary">
                    No brands found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {brand.icon && (
                        <img
                          src={brand.icon}
                          alt={brand.name}
                          style={{ width: 24, height: 24, objectFit: 'contain' }}
                        />
                      )}
                      {brand.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getDeviceTypeName(brand)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={brand.isActive ? 'Active' : 'Inactive'}
                      color={brand.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Add to Inventory">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => onAddToInventory(brand._id)}
                        disabled={!brand.isActive}
                      >
                        Add to Inventory
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 