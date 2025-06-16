import { Box, FormControl, Select, MenuItem } from '@mui/material';
import { BrandIcon, BRAND_ICONS } from './BrandIcon';
import { DeviceTypeIcon, DEVICE_TYPE_ICONS } from './DeviceTypeIcon';

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'brand' | 'deviceType';
}

export function IconSelect({ value, onChange, type = 'brand' }: IconSelectProps) {
  const safeValue = value || '';
  const icons = type === 'brand' ? BRAND_ICONS : DEVICE_TYPE_ICONS;

  return (
    <FormControl fullWidth>
      <Select
        value={safeValue}
        onChange={(e) => onChange(e.target.value as string)}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {type === 'brand' ? (
              <BrandIcon brand={selected as string} size={24} />
            ) : (
              <DeviceTypeIcon icon={selected as string} size={24} />
            )}
          </Box>
        )}
      >
        {Object.entries(icons).map(([icon, _]) => (
          <MenuItem key={icon} value={icon}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {type === 'brand' ? (
                <BrandIcon brand={icon} size={24} />
              ) : (
                <DeviceTypeIcon icon={icon} size={24} />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
} 