import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '@/api/orders';
import { useSnackbar } from 'notistack';
import { Loader2 } from 'lucide-react';
import { CreateOrder as CreateOrderForm } from './CreateOrder';

export default function EditOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    getOrderById(id)
      .then((res) => {
        if (!res.success) throw new Error('Fetch failed');
        const o = res.order;
        const mapped = {
          customerId: o.customerId?._id ?? o.customerId ?? '',
          customerName: o.customer?.name ?? '',
          customerPhone: o.customer?.phone ?? '',
          customerEmail: o.customer?.email ?? '',
          deviceType: o.device?.deviceTypeId?._id ?? o.device?.deviceTypeId ?? '',
          deviceBrand: o.device?.brandId?._id ?? o.device?.brandId ?? '',
          deviceModel: o.device?.modelId?._id ?? o.device?.modelId ?? '',
          serialNumber: o.device?.serialNumber ?? '',
          deviceCondition: o.device?.condition ?? '',
          parts: (o.items && Array.isArray(o.items))
            ? o.items.map((item:any) => ({ partId: item.partId, quantity: item.quantity }))
            : (o.parts && Array.isArray(o.parts))
              ? o.parts.map((partId:any) => ({ partId: partId.$oid || partId, quantity: 1 }))
              : [],
          paymentMethod: o.payment?.paymentMethod ?? '',
          paymentAmount: o.payment?.totalAmount ?? 0,
          depositAmount: o.payment?.depositAmount ?? o.payment?.paidAmount ?? 0,
          notes: o.notes?.tr ?? (typeof o.notes === 'string' ? o.notes : ''),
          loanedDevice: o.loanedDevice
            ? {
                deviceType: o.loanedDevice.deviceTypeId?._id ?? o.loanedDevice.deviceTypeId ?? '',
                deviceBrand: o.loanedDevice.brandId?._id ?? o.loanedDevice.brandId ?? '',
                deviceModel: o.loanedDevice.modelId?._id ?? o.loanedDevice.modelId ?? '',
                modelName: o.loanedDevice.names?.model ?? '',
                brandName: o.loanedDevice.names?.brand ?? '',
                deviceTypeName: o.loanedDevice.names?.deviceType ?? '',
              }
            : undefined,
          isLoanedDeviceGiven: o.isLoanedDeviceGiven ?? false,
          isCentral: typeof o.isCentralService === 'boolean' ? (o.isCentralService ? 'yes' : 'no') : null,
          // Diğer alanlar eklenebilir
        };
        setOrderData(mapped);
      })
      .catch(() => {
        enqueueSnackbar('Sipariş bulunamadı', { variant: 'error' });
        navigate('/orders');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!orderData) return null;

  return (
    <CreateOrderForm
      mode="edit"
      orderId={id!}
      order={orderData}
      onDone={() => navigate('/orders')}
    />
  );
}