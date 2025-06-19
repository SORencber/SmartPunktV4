import React, { useState, useEffect, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Smartphone, Wrench, Euro } from 'lucide-react';

interface ServiceStepProps {
  next(): void;
  prev(): void;
  // from shared
  isCentral: 'yes' | 'no' | null;
  branchProfit: number;
  branchServiceFee: number;
  centralServiceFee: number;
  parts: any[];
  partFields: any[];
  watch: any;
  deviceTypes: any[];
  brands: any[];
  models: any[];
  loadBrands: (deviceTypeId: string) => Promise<void>;
  loadModels: (brandId: string) => Promise<void>;
  loadingDeviceData: boolean;
}

export default function ServiceStep(props: ServiceStepProps) {
  const { next, prev, isCentral, branchProfit, branchServiceFee, centralServiceFee, parts, partFields, watch,
    deviceTypes, brands, models, loadBrands, loadModels, loadingDeviceData } = props;

  const { control, setValue } = useFormContext();

  // Loaned device state
  const [isLoaned, setIsLoaned] = useState<'yes' | 'no' | null>(null);
  const [loanType, setLoanType] = useState('');
  const [loanBrand, setLoanBrand] = useState('');
  const [loanModel, setLoanModel] = useState('');

  useEffect(() => {
    if (loanType) {
      loadBrands(loanType);
      setLoanBrand('');
      setLoanModel('');
    }
  }, [loanType]);

  useEffect(() => {
    if (loanBrand) {
      loadModels(loanBrand);
      setLoanModel('');
    }
  }, [loanBrand]);

  useEffect(() => {
    if (isLoaned === 'yes' && loanModel) {
      setValue('loanedDevice', {
        deviceType: loanType,
        deviceBrand: loanBrand,
        deviceModel: loanModel,
      });
    } else if (isLoaned === 'no') {
      setValue('loanedDevice', undefined);
    }
  }, [isLoaned, loanType, loanBrand, loanModel]);

  // helpers for prices
  const extractAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object' && typeof val.amount === 'number') return val.amount;
    return 0;
  };
  const getPartPrice = (p: any) => extractAmount(p?.branch_price) || extractAmount(p?.price);
  const getPartServiceFee = (p: any) => extractAmount(p?.branch_serviceFee) || extractAmount(p?.serviceFee);

  const partsTotal = useMemo(() => {
    let t = 0;
    partFields.forEach((f: any, idx: number) => {
      const pid = watch(`parts.${idx}.partId`);
      const qty = watch(`parts.${idx}.quantity`) || 1;
      const pObj = parts.find((p) => p._id === pid);
      t += getPartPrice(pObj) * qty;
    });
    return t;
  }, [partFields, parts, watch]);

  const centralPartsCost = partsTotal;
  const centralServiceFeeTotal = useMemo(() => {
    let maxFee = 0;
    partFields.forEach((f: any, idx: number) => {
      const pid = watch(`parts.${idx}.partId`);
      const pObj = parts.find((p) => p._id === pid);
      if (pObj) {
        const fee = getPartServiceFee(pObj);
        maxFee = Math.max(maxFee, fee);
      }
    });
    return maxFee;
  }, [partFields, parts, watch]);

  const totalCentralPayment = centralPartsCost + centralServiceFeeTotal;
  const customerTotalCentral = centralPartsCost + centralServiceFeeTotal + branchServiceFee;
  const customerTotalBranch = partsTotal + branchProfit + branchServiceFee;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Loaned Device Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ödünç Cihaz</CardTitle>
          <CardDescription>Müşteriye ödünç cihaz verilip verilmeyeceğini seçin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant={isLoaned === 'yes' ? 'default' : 'outline'}
                onClick={() => setIsLoaned('yes')}
                className="flex-1"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Evet, Ödünç Cihaz Verilecek
              </Button>
              <Button
                variant={isLoaned === 'no' ? 'default' : 'outline'}
                onClick={() => setIsLoaned('no')}
                className="flex-1"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Hayır, Ödünç Cihaz Verilmeyecek
              </Button>
            </div>

            {isLoaned === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Cihaz Türü</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cihaz türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((d) => (
                        <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Select 
                    value={loanBrand} 
                    onValueChange={setLoanBrand}
                    disabled={!loanType || loadingDeviceData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!loanType ? 'Önce cihaz türü seçin' : 'Marka seçin'} />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select 
                    value={loanModel} 
                    onValueChange={setLoanModel}
                    disabled={!loanBrand || loadingDeviceData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!loanBrand ? 'Önce marka seçin' : 'Model seçin'} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {typeof m.name === 'string' ? m.name : m.name.tr || m.name.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servis Özeti</CardTitle>
              <CardDescription>Servis detayları ve fiyatlandırma özeti</CardDescription>
            </div>
            <Badge variant={isCentral === 'yes' ? 'destructive' : 'default'}>
              {isCentral === 'yes' ? 'Merkez Servis' : 'Şube Servis'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Service Type Info */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-white">
                  <Wrench className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">
                    {isCentral === 'yes' ? 'Merkez Servis İşlemi' : 'Şube Servis İşlemi'}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {isCentral === 'yes' 
                      ? 'Cihaz merkez servise gönderilecek ve onarım merkez serviste yapılacak.'
                      : 'Cihaz şubede kalacak ve onarım şubede yapılacak.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h4 className="font-medium text-slate-900 flex items-center">
                  <Euro className="h-4 w-4 mr-2" />
                  Fiyat Detayları
                </h4>
              </div>
              <div className="p-4 space-y-3">
                {isCentral === 'yes' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Parça Maliyeti</span>
                      <span className="font-medium">{partsTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Merkez Servis Ücreti</span>
                      <span className="font-medium">{centralServiceFeeTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Şube Servis Ücreti</span>
                      <span className="font-medium">{branchServiceFee.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between font-medium text-base pt-3 border-t">
                      <span>Toplam</span>
                      <span className="text-blue-600">{customerTotalCentral.toFixed(2)} €</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Parça Maliyeti</span>
                      <span className="font-medium">{partsTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Merkeze Ödeme</span>
                      <span className="font-medium">{totalCentralPayment.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Kar Payı</span>
                      <span className="font-medium">{branchProfit.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Şube Servis Ücreti</span>
                      <span className="font-medium">{branchServiceFee.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between font-medium text-base pt-3 border-t">
                      <span>Toplam</span>
                      <span className="text-blue-600">{customerTotalBranch.toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={prev}>
          Geri
        </Button>
        <Button onClick={next}>
          Devam
        </Button>
      </div>
    </div>
  );
} 