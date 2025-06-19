import React, { useEffect, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DeviceStepProps {
  next: () => void;
  prev: () => void;
  deviceTypes: any[];
  brands: any[];
  models: any[];
  parts: any[];
  loadingDeviceData: boolean;
  loadingParts: boolean;
  loadBrands: (deviceTypeId: string) => Promise<void>;
  loadModels: (brandId: string) => Promise<void>;
  loadPartsForModel: (modelId: string) => Promise<void>;
  partFields: any[];
  appendPart: (value: any) => void;
  removePart: (index: number) => void;
  watch: any;
  setValue: any;
  branchProfit: number;
  setBranchProfit: (v: number) => void;
  branchServiceFee: number;
  setBranchServiceFee: (v: number) => void;
  centralServiceFee: number;
  setCentralServiceFee: (v: number) => void;
  isCentral: 'yes' | 'no' | null;
  setIsCentral: (v: 'yes' | 'no') => void;
  [key: string]: any;
}

export default function DeviceStep(props: DeviceStepProps) {
  const { next, deviceTypes, brands, models, parts, loadingDeviceData, loadingParts, loadBrands, loadModels, loadPartsForModel, partFields, appendPart, removePart, watch, setValue,
    branchProfit, setBranchProfit, branchServiceFee, setBranchServiceFee, centralServiceFee, setCentralServiceFee, isCentral, setIsCentral } = props;

  const { control, getValues } = useFormContext();

  // Watch all necessary form fields for immediate updates
  const deviceType = watch('deviceType');
  const deviceBrand = watch('deviceBrand');
  const deviceModel = watch('deviceModel');
  const formParts = watch('parts');

  // Initial load of related data based on saved values
  useEffect(() => {
    const loadSavedData = async () => {
      if (deviceType) {
        await loadBrands(deviceType);
        if (deviceBrand) {
          await loadModels(deviceBrand);
          if (deviceModel) {
            await loadPartsForModel(deviceModel);
          }
        }
      }
    };
    loadSavedData();
  }, []);

  // load brands when deviceType changes
  useEffect(() => {
    if (deviceType) {
      loadBrands(deviceType);
      // Only reset brand & model if deviceType actually changed
      const currentValues = getValues();
      if (currentValues.deviceType !== deviceType) {
        setValue('deviceBrand', '', { shouldDirty: true, shouldTouch: true });
        setValue('deviceModel', '', { shouldDirty: true, shouldTouch: true });
        setValue('parts', [], { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [deviceType]);

  // load models when brand changes
  useEffect(() => {
    if (deviceBrand) {
      loadModels(deviceBrand);
      // Only reset model if brand actually changed
      const currentValues = getValues();
      if (currentValues.deviceBrand !== deviceBrand) {
        setValue('deviceModel', '', { shouldDirty: true, shouldTouch: true });
        setValue('parts', [], { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [deviceBrand]);

  // load parts when model selected
  useEffect(() => {
    if (deviceModel) {
      loadPartsForModel(deviceModel);
      // Only reset parts if model actually changed
      const currentValues = getValues();
      if (currentValues.deviceModel !== deviceModel) {
        setValue('parts', [], { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [deviceModel]);

  // helper: extract numeric amount from different schemas
  const extractAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object' && typeof val.amount === 'number') return val.amount;
    return 0;
  };

  const getPartPrice = (part: any): number => {
    if (!part) return 0;
    // Try to get branch_price first, if not available use regular price
    const price = part.branch_price || part.price;
    return extractAmount(price);
  };

  const getPartServiceFee = (part: any): number => {
    if (!part) return 0;
    // Try to get branch_serviceFee first, if not available use regular serviceFee
    const fee = part.branch_serviceFee || part.serviceFee;
    return extractAmount(fee);
  };

  // Calculate parts total whenever parts or quantities change
  const partsTotal = useMemo(() => {
    let total = 0;
    if (!formParts || !parts) return total;

    for (const part of formParts) {
      if (!part.partId) continue;
      const qty = parseInt(part.quantity?.toString() || '1');
      const partObj = parts.find((p) => p._id === part.partId);
      if (!partObj) continue;

      const price = getPartPrice(partObj);
      total += price * qty;
    }
    return total;
  }, [formParts, parts]);

  // Calculate service fee total
  const centralServiceFeeTotal = useMemo(() => {
    let maxFee = 0;
    if (!formParts || !parts) return maxFee;

    for (const part of formParts) {
      if (!part.partId) continue;
      const partObj = parts.find((p) => p._id === part.partId);
      if (!partObj) continue;

      const fee = getPartServiceFee(partObj);
      maxFee = Math.max(maxFee, fee);
    }
    return maxFee;
  }, [formParts, parts]);

  const calculateCentralCustomerTotal = () => {
    return partsTotal + centralServiceFeeTotal + branchServiceFee;
  };

  const calculateBranchCustomerTotal = () => {
    return partsTotal + branchProfit + branchServiceFee;
  };

  const priceOptions = Array.from({ length: 37 }, (_, i) => 20 + i * 5);

  const getPartName = (part:any)=>{
    if(!part) return '-';
    if(typeof part.name==='string') return part.name;
    return part.name.tr || part.name.en || part.name.de || 'Unnamed';
  }

  const getPartStock = (part: any): number => {
    if (!part) return 0;
    return part.stock || 0;
  }

  return (
    <div className="space-y-6">
      {/* Device Selection Card */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>Cihaz Seçimi</CardTitle>
          <CardDescription>Cihaz türü, marka ve model seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Device Type */}
            <div className="space-y-2">
              <Label htmlFor="deviceType">Cihaz Türü</Label>
              <Controller
                control={control}
                name="deviceType"
                rules={{ required: 'Device type is required' }}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={(v)=>field.onChange(v)}>
                    <SelectTrigger><SelectValue placeholder="Cihaz türü seçin" /></SelectTrigger>
                    <SelectContent className="custom-select-content">
                      {deviceTypes.map((dt:any)=>(
                        <SelectItem key={dt._id} value={dt._id} className="custom-select-item">{dt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="deviceBrand">Marka</Label>
              <Controller
                control={control}
                name="deviceBrand"
                rules={{ required: 'Brand is required' }}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={(v)=>field.onChange(v)} disabled={!deviceType || loadingDeviceData}>
                    <SelectTrigger><SelectValue placeholder={!deviceType? 'Önce cihaz türü seçin':'Marka seçin'} /></SelectTrigger>
                    <SelectContent className="custom-select-content">
                      {brands.map((b:any)=>(
                        <SelectItem key={b._id} value={b._id} className="custom-select-item">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="deviceModel">Model</Label>
              <Controller
                control={control}
                name="deviceModel"
                rules={{ required: 'Model is required' }}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={(v)=>field.onChange(v)} disabled={!deviceBrand || loadingDeviceData}>
                    <SelectTrigger><SelectValue placeholder={!deviceBrand? 'Önce marka seçin':'Model seçin'} /></SelectTrigger>
                    <SelectContent className="custom-select-content max-h-60 overflow-y-auto">
                      {models.map((m:any)=>(
                        <SelectItem key={m._id} value={m._id} className="custom-select-item">
                          {typeof m.name==='string' ? m.name : m.name.tr || m.name.en || m.name.de}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Parts table */}
          {deviceModel && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Parçalar</Label>
                <Button 
                  onClick={() => appendPart({ partId: '', quantity: 1 })}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white hover:bg-slate-50"
                >
                  <Plus size={16} />
                  Yeni Parça Ekle
                </Button>
              </div>
              
              {loadingParts ? (
                <div className="flex items-center justify-center p-8 border rounded-lg bg-white/50">
                  <p className="text-slate-600">Parçalar yükleniyor...</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-white dark:bg-slate-900/60 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Parça</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Stok</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Miktar</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Birim Fiyat</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Toplam</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {partFields.map((fieldItem: any, idx: number) => {
                        const selectedPartId = watch(`parts.${idx}.partId`);
                        const quantity = parseInt(watch(`parts.${idx}.quantity`) || '1');
                        const selectedPart = parts.find(p => p._id === selectedPartId);
                        const unitPrice = getPartPrice(selectedPart);
                        const stock = getPartStock(selectedPart);
                        const total = unitPrice * quantity;

                        return (
                          <tr key={fieldItem.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <Controller
                                control={control}
                                name={`parts.${idx}.partId` as const}
                                render={({ field }) => (
                                  <Select 
                                    value={field.value || ''} 
                                    onValueChange={(v) => {
                                      field.onChange(v);
                                      // Reset quantity when part changes
                                      setValue(`parts.${idx}.quantity`, 1, { 
                                        shouldDirty: true, 
                                        shouldTouch: true,
                                        shouldValidate: true 
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="w-[240px]">
                                      <SelectValue placeholder="Parça seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {parts.map((p) => (
                                        <SelectItem 
                                          key={p._id} 
                                          value={p._id}
                                          disabled={getPartStock(p) === 0}
                                        >
                                          {getPartName(p)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={stock > 0 ? "success" : "destructive"}
                                className="font-medium"
                              >
                                {stock}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 w-[120px]">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const newQty = Math.max(1, quantity - 1);
                                    setValue(`parts.${idx}.quantity`, newQty, {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                      shouldValidate: true
                                    });
                                  }}
                                  disabled={!selectedPartId || quantity <= 1}
                                >
                                  <span className="text-lg font-medium">−</span>
                                </Button>
                                <Controller
                                  control={control}
                                  name={`parts.${idx}.quantity` as const}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      className="w-14 text-center"
                                      min={1}
                                      max={stock}
                                      value={field.value || 1}
                                      disabled={!selectedPartId}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= stock) {
                                          field.onChange(val);
                                        }
                                      }}
                                    />
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const newQty = Math.min(stock, quantity + 1);
                                    setValue(`parts.${idx}.quantity`, newQty, {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                      shouldValidate: true
                                    });
                                  }}
                                  disabled={!selectedPartId || quantity >= stock}
                                >
                                  <span className="text-lg font-medium">+</span>
                                </Button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {selectedPartId ? `${Number(unitPrice).toFixed(2)} €` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {selectedPartId ? `${Number(total).toFixed(2)} €` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                                onClick={() => {
                                  removePart(idx);
                                  // Force form update after removing part
                                  const currentParts = getValues('parts') || [];
                                  setValue('parts', currentParts.filter((_: any, i: number) => i !== idx), {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true
                                  });
                                }}
                              >
                                <X size={16} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {partFields.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            Henüz parça eklenmemiş. Yukarıdaki "Yeni Parça Ekle" butonunu kullanarak parça ekleyebilirsiniz.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {partFields.length > 0 && (
                      <tfoot className="border-t bg-slate-50">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-right font-medium">
                            Toplam:
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formParts?.some((p: { partId: string }) => p.partId) ? `${Number(partsTotal).toFixed(2)} €` : '-'}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Options Card */}
      {partFields.length > 0 && formParts?.some((p: { partId: string }) => p.partId) && (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>Servis Seçenekleri</CardTitle>
            <CardDescription>Servis tipini ve ücretleri belirleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Central Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="isCentral">Aygıt merkeze gönderilecek mi?</Label>
              <Select 
                value={isCentral || ''} 
                onValueChange={(v: 'yes' | 'no') => {
                  setIsCentral(v);
                  // Reset service fees when changing service type
                  if (v === 'yes') {
                    setBranchServiceFee(0);
                    setCentralServiceFee(0);
                    setBranchProfit(0);
                  } else {
                    setBranchServiceFee(0);
                    setCentralServiceFee(0);
                    setBranchProfit(0);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Merkez servis seçimi yapın" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Evet</SelectItem>
                  <SelectItem value="no">Hayır</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fee Selection */}
            <div className="space-y-4">
              {isCentral === 'yes' ? (
                // Merkez Servis Ücreti - Only show if isCentral is 'yes'
                <div className="space-y-2">
                  <Label htmlFor="centralServiceFee">Merkez Servis Ücreti (€)</Label>
                  <Select 
                    value={centralServiceFee.toString()} 
                    onValueChange={(v) => {
                      const fee = Number(v);
                      setCentralServiceFee(fee);
                      setBranchServiceFee(fee); // Merkez servis ücreti, şube servis ücretine yansıtılıyor
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Merkez servis ücreti seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceOptions.map((price) => (
                        <SelectItem key={price} value={price.toString()}>
                          {`${price.toFixed(2)} €`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // Şube Kar Payı - Only show if isCentral is 'no'
                <div className="space-y-2">
                  <Label htmlFor="branchProfit">Şube Servis Kar Payı (€)</Label>
                  <Select 
                    value={branchProfit.toString()} 
                    onValueChange={(v) => {
                      const profit = Number(v);
                      setBranchProfit(profit);
                      setBranchServiceFee(profit); // Kar payı, şube servis ücretine yansıtılıyor
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şube kar payı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceOptions.map((price) => (
                        <SelectItem key={price} value={price.toString()}>
                          {`${price.toFixed(2)} €`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="space-y-2 pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Parça Maliyeti:</span>
                  <span className="font-medium">{Number(partsTotal).toFixed(2)} €</span>
                </div>
                {isCentral === 'yes' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Merkez Servis Ücreti:</span>
                      <span className="font-medium">{Number(centralServiceFeeTotal).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Şube Servis Ücreti:</span>
                      <span className="font-medium">{Number(branchServiceFee).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Toplam:</span>
                      <span className="font-bold">{Number(calculateCentralCustomerTotal()).toFixed(2)} €</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Şube Servis Ücreti:</span>
                      <span className="font-medium">{branchServiceFee.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Toplam:</span>
                      <span className="font-bold">{calculateBranchCustomerTotal().toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end mt-6">
        <Button type="button" onClick={next} variant="default">Devam</Button>
      </div>
    </div>
  );
}