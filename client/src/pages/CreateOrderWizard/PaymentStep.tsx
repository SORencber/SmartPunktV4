import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Euro, CreditCard, Receipt, ArrowRight } from 'lucide-react';

interface PaymentStepProps {
  prev(): void;
  isCentral: 'yes' | 'no' | null;
  branchProfit: number;
  branchServiceFee: number;
  centralServiceFee: number;
  parts: any[];
  partFields: any[];
  watch: any;
}

export default function PaymentStep(props: PaymentStepProps) {
  const { prev, isCentral, branchProfit, branchServiceFee, centralServiceFee, parts, partFields, watch } = props;
  const { control } = useFormContext();

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

  const grandTotal = isCentral === 'yes' ? customerTotalCentral : customerTotalBranch;
  const depositAmount = watch('depositAmount') || 0;
  const remainingAmount = grandTotal - depositAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sipariş Özeti</CardTitle>
              <CardDescription>Toplam tutar ve ödeme detayları</CardDescription>
            </div>
            <Badge variant={isCentral === 'yes' ? 'destructive' : 'default'}>
              {isCentral === 'yes' ? 'Merkez Servis' : 'Şube Servis'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Price Details */}
            <div className="rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h4 className="font-medium text-slate-900 flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
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
                  </>
                )}
                <div className="flex justify-between font-medium text-base pt-3 border-t">
                  <span>Toplam</span>
                  <span className="text-blue-600">{grandTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Deposit Input */}
            <div className="rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h4 className="font-medium text-slate-900 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Depozito
                </h4>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="depositAmount">Alınan Depozito (€)</Label>
                    <Controller
                      control={control}
                      name="depositAmount"
                      defaultValue={0}
                      render={({ field }) => (
                        <Input
                          id="depositAmount"
                          type="number"
                          min={0}
                          max={grandTotal}
                          step={0.01}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm pt-3 border-t">
                    <div>
                      <p className="text-slate-600">Kalan Tutar</p>
                      <p className={`text-lg font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {remainingAmount.toFixed(2)} €
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-slate-600">Toplam Tutar</p>
                      <p className="text-lg font-medium text-slate-900">{grandTotal.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
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
        <Button type="submit">
          Siparişi Tamamla
        </Button>
      </div>
    </div>
  );
} 