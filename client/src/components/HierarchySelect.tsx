import { useEffect, useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes';
import { getBrands, type Brand } from '@/api/brands';
import { getModels, type Model } from '@/api/models';

export interface DeviceTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
}
export function DeviceTypeSelect({ value, onChange }: DeviceTypeSelectProps) {
  const [options, setOptions] = useState<DeviceType[]>([]);
  useEffect(() => {
    getDeviceTypes().then(response => {
      if (response.success) {
        setOptions(response.data);
      }
    });
  }, []);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Cihaz türü"/></SelectTrigger>
      <SelectContent>
        {options.map(opt => <SelectItem key={opt._id} value={opt._id}>{opt.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export interface BrandSelectProps {
  deviceTypeId: string;
  value: string;
  onChange: (value: string) => void;
}
export function BrandSelect({ deviceTypeId, value, onChange }: BrandSelectProps) {
  const [options, setOptions] = useState<Brand[]>([]);
  useEffect(() => {
    if (deviceTypeId) {
      getBrands({ deviceType: deviceTypeId }).then(r => r.success && setOptions(r.data));
    } else setOptions([]);
  }, [deviceTypeId]);
  return (
    <Select value={value} onValueChange={onChange} disabled={!deviceTypeId}>
      <SelectTrigger><SelectValue placeholder="Marka"/></SelectTrigger>
      <SelectContent>
        {options.map(opt => <SelectItem key={opt._id} value={opt._id}>{opt.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export interface ModelSelectProps {
  deviceTypeId: string;
  brandId: string;
  value: string;
  onChange: (value: string) => void;
}
export function ModelSelect({ deviceTypeId, brandId, value, onChange }: ModelSelectProps) {
  const [options, setOptions] = useState<Model[]>([]);
  useEffect(() => {
    if (deviceTypeId && brandId) {
      getModels({ deviceType: deviceTypeId, brand: brandId }).then(r => r.success && setOptions(r.data));
    } else setOptions([]);
  }, [deviceTypeId, brandId]);
  return (
    <Select value={value} onValueChange={onChange} disabled={!brandId}>
      <SelectTrigger><SelectValue placeholder="Model"/></SelectTrigger>
      <SelectContent>
        {options.map(opt => <SelectItem key={opt._id} value={opt._id}>{opt.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
} 