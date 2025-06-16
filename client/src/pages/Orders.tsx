// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useSnackbar } from 'notistack';
import { cancelOrder, getOrders, updateOrderStatus } from '@/api/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Search, Plus, Pencil, Trash2, Eye, Printer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/api';
import { BrandIcon } from '@/components/BrandIcon';
import { getBrands, Brand } from '@/api/brands';
import { getModels } from '@/api/models';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDeviceTypes, DeviceType } from '@/api/deviceTypes';

interface Order {
  _id: string;
  orderNumber: string;
  branch: {
    name: string;
  };
  customerId: {
    name: string;
    phone: string;
  };
  device: {
    brand: string;
    model: string;
    brandId?: string;
    modelId?: string;
    deviceTypeId?: string;
  };
  status: string;
  payment: {
    amount: number;
    totalAmount?: number;
  };
  items: Array<{ name:string; quantity:number }>;
  createdAt: string;
  orderId: string;
  branchSnapshot?: any;
  branch?: any;
  totalCentralPayment?: number;
}

const getDisplayName = (val:any) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.tr || val.en || val.de || '';
  return String(val);
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([] as Array<{ _id:string; name:string }>);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('desc');
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: printOrder ? `Order-${printOrder.orderNumber}` : 'Order',
  });
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await (getOrders as any)({ search: searchTerm, status: statusFilter, branch: branchFilter, page: currentPage, limit: pageSize });
      setOrders(response.orders);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Failed to load orders:', error);
      enqueueSnackbar('Failed to load orders', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (orderId: string) => {
    setOrderToCancel(orderId);
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    
    try {
      await cancelOrder(orderToCancel, 'Cancelled by branch staff');
      enqueueSnackbar('Order cancelled successfully', { variant: 'success' });
      await loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      enqueueSnackbar('Failed to cancel order', { variant: 'error' });
    } finally {
      setOrderToCancel(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  useEffect(() => {
    loadOrders();
  }, [searchTerm, statusFilter, branchFilter, currentPage, pageSize]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (user?.role !== 'admin') return;
      try {
        const res = await api.get('/api/branches?isActive=true');
        setBranches(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch branches', err);
      }
    };
    fetchBranches();
  }, [user]);

  useEffect(() => {
    getBrands().then(res => setBrands(res.data));
    getModels().then(res => setModels(res.data));
    getDeviceTypes().then(res => setDeviceTypes(res.data));
  }, []);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [pageSize, statusFilter, branchFilter, searchTerm]);

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await deleteOrder(orderToDelete._id);
      setOrderToDelete(null);
      await loadOrders();
    } finally {
      setDeleting(false);
    }
  };

  const getRowBgClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-yellow-100 via-white to-yellow-50';
      case 'shipped':
        return 'bg-gradient-to-r from-orange-200 via-white to-orange-100';
      case 'completed':
        return 'bg-gradient-to-r from-green-100 via-white to-green-50';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 via-white to-red-50';
      default:
        return 'bg-gradient-to-r from-gray-100 via-white to-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 dark:bg-slate-800/50 rounded w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-white/50 dark:bg-slate-800/50 rounded-xl" />
          <div className="h-64 bg-white/50 dark:bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  const shippedOrders = orders.filter(order => order.status === 'shipped');
  const nonShippedOrders = orders.filter(order => order.status !== 'shipped');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Siparişler
        </h1>
        <Button
          onClick={() => navigate('/orders/create')}
          className="w-full sm:w-auto bg-white text-blue-700 border border-blue-600 hover:bg-blue-50 shadow font-semibold"
        >
          <Plus className="h-4 w-4 mr-2 text-blue-700" />
          Yeni Sipariş Oluştur
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Siparişleri arama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Durum filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="shipped">Kargoda</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {user?.role === 'admin' && (
          <div className="w-full sm:w-48">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Şube filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şubeler</SelectItem>
                {branches.map(b => {
                  const branchId = typeof (b as any)._id === 'string' ? (b as any)._id : ((b as any)._id && typeof (b as any)._id === 'object' && 'oid' in (b as any)._id ? (b as any)._id.oid : b.name);
                  return (
                    <SelectItem key={branchId} value={branchId}>{b.name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span>Sayfa başına:</span>
          <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toplam sipariş sayısı */}
      <div className="text-sm text-slate-500">
        Toplam {orders.length + shippedOrders.length} sipariş var
      </div>

      {/* Kargoda Olan Siparişler Tablosu */}
      {shippedOrders.length > 0 && (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>Kargoda Olan Siparişler</CardTitle>
            <CardDescription>Kargoya verilmiş siparişler burada listelenir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-slate-800">
                <thead>
                  <tr className="bg-orange-100 dark:bg-orange-900">
                    <th className="px-3 py-2 text-left">Sipariş Tarihi</th>
                    <th className="px-3 py-2 text-left">Sipariş No</th>
                    <th className="px-3 py-2 text-left">Şube</th>
                    <th className="px-3 py-2 text-left">Marka</th>
                    <th className="px-3 py-2 text-left">Model</th>
                    <th className="px-3 py-2 text-left">Parça (Adet)</th>
                    <th className="px-3 py-2 text-left">Durum</th>
                    <th className="px-3 py-2 text-left">Tutar</th>
                    <th className="px-3 py-2 text-left">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {shippedOrders.map(order => {
                    // Brand lookup: try device.brandId, then device.brand, then model's brandId
                    let brandObj = null;
                    if (order.device.brandId) {
                      brandObj = brands.find(b => b._id === order.device.brandId);
                    }
                    if (!brandObj && order.device.brand) {
                      brandObj = brands.find(b => b._id === order.device.brand || b.name === order.device.brand);
                    }
                    // If still not found, try model's brandId
                    let modelObj = null;
                    if (order.device.modelId) {
                      modelObj = models.find(m => m._id === order.device.modelId || m.name === order.device.modelId);
                    }
                    if (!modelObj && order.device.model) {
                      modelObj = models.find(m => m._id === order.device.model || m.name === order.device.model);
                    }
                    if (!brandObj && modelObj && modelObj.brandId) {
                      brandObj = brands.find(b => b._id === modelObj.brandId);
                    }

                    return (
                      <tr key={order._id} className={getRowBgClass(order.status)}>
                        <td className="px-3 py-2">{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-2">{order.orderId}</td>
                        <td className="px-3 py-2">{order.branch?.name || order.branchSnapshot?.name || '-'}</td>
                        <td className="px-3 py-2">
                          <BrandIcon brand={brandObj || { name: '-' }} size={24} />
                          <span>{brandObj?.name || '-'}</span>
                        </td>
                        <td className="px-3 py-2">{modelObj?.name || '-'}</td>
                        <td className="px-3 py-2">
                          {order.items && order.items.length > 0
                            ? order.items.map((item, idx) => (
                                <span key={idx} className="block">{item.name} x {item.quantity}</span>
                              ))
                            : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={order.status}
                            disabled={!!statusUpdating[order._id]}
                            onValueChange={async (newStatus) => {
                              setStatusUpdating((prev) => ({ ...prev, [order._id]: true }));
                              try {
                                await updateOrderStatus(order._id, { status: newStatus });
                                setOrders(prevOrders =>
                                  prevOrders.map(o =>
                                    o._id === order._id ? { ...o, status: newStatus } : o
                                  )
                                );
                              } finally {
                                setStatusUpdating((prev) => ({ ...prev, [order._id]: false }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Beklemede</SelectItem>
                              <SelectItem value="shipped">Kargoda</SelectItem>
                              <SelectItem value="completed">Tamamlandı</SelectItem>
                              <SelectItem value="cancelled">İptal</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          {order.totalCentralPayment ? `${formatCurrency(order.totalCentralPayment)}` : '-'}
                        </td>
                        <td className="px-3 py-2 flex gap-2 items-center">
                          <Button size="icon" variant="outline" title="Göster" onClick={() => navigate(`/orders/${order._id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" title="Sil" onClick={() => setOrderToDelete(order)} disabled={deleting}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" title="Yazdır" onClick={() => setPrintOrder(order)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ana Siparişler Tablosu (Kargoda olmayanlar) */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>Tüm Siparişler</CardTitle>
          <CardDescription>Siparişleri yönetin ve izleyin</CardDescription>
        </CardHeader>
        <CardContent>
          {nonShippedOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">Sipariş bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-slate-800">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700">
                    <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => setOrderSortDirection(d => d === 'asc' ? 'desc' : 'asc')}>
                      Sipariş Tarihi {orderSortDirection === 'asc' ? '▲' : '▼'}
                    </th>
                    <th className="px-3 py-2 text-left">Sipariş No</th>
                    <th className="px-3 py-2 text-left">Şube</th>
                    <th className="px-3 py-2 text-left">Marka</th>
                    <th className="px-3 py-2 text-left">Model</th>
                    <th className="px-3 py-2 text-left">Parça (Adet)</th>
                    <th className="px-3 py-2 text-left">Durum</th>
                    <th className="px-3 py-2 text-left">Tutar</th>
                    <th className="px-3 py-2 text-left">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {nonShippedOrders.map(order => {
                    // Brand lookup: try device.brandId, then device.brand, then model's brandId
                    let brandObj = null;
                    if (order.device.brandId) {
                      brandObj = brands.find(b => b._id === order.device.brandId);
                    }
                    if (!brandObj && order.device.brand) {
                      brandObj = brands.find(b => b._id === order.device.brand || b.name === order.device.brand);
                    }
                    // If still not found, try model's brandId
                    let modelObj = null;
                    if (order.device.modelId) {
                      modelObj = models.find(m => m._id === order.device.modelId || m.name === order.device.modelId);
                    }
                    if (!modelObj && order.device.model) {
                      modelObj = models.find(m => m._id === order.device.model || m.name === order.device.model);
                    }
                    if (!brandObj && modelObj && modelObj.brandId) {
                      brandObj = brands.find(b => b._id === modelObj.brandId);
                    }

                    return (
                      <tr key={order._id} className={getRowBgClass(order.status)}>
                        <td className="px-3 py-2">{formatDate(order.createdAt)}</td>
                        <td className="px-3 py-2">{order.orderId}</td>
                        <td className="px-3 py-2">{order.branch?.name || order.branchSnapshot?.name || '-'}</td>
                        <td className="px-3 py-2">
                          <BrandIcon brand={brandObj || { name: '-' }} size={24} />
                          <span>{brandObj?.name || '-'}</span>
                        </td>
                        <td className="px-3 py-2">{modelObj?.name || '-'}</td>
                        <td className="px-3 py-2">
                          {order.items && order.items.length > 0
                            ? order.items.map((item, idx) => (
                                <span key={idx} className="block">{item.name} x {item.quantity}</span>
                              ))
                            : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={order.status}
                            disabled={!!statusUpdating[order._id]}
                            onValueChange={async (newStatus) => {
                              setStatusUpdating((prev) => ({ ...prev, [order._id]: true }));
                              try {
                                await updateOrderStatus(order._id, { status: newStatus });
                                setOrders(prevOrders =>
                                  prevOrders.map(o =>
                                    o._id === order._id ? { ...o, status: newStatus } : o
                                  )
                                );
                              } finally {
                                setStatusUpdating((prev) => ({ ...prev, [order._id]: false }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Beklemede</SelectItem>
                              <SelectItem value="shipped">Kargoda</SelectItem>
                              <SelectItem value="completed">Tamamlandı</SelectItem>
                              <SelectItem value="cancelled">İptal</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          {order.totalCentralPayment ? `${formatCurrency(order.totalCentralPayment)}` : '-'}
                        </td>
                        <td className="px-3 py-2 flex gap-2 items-center">
                          <Button size="icon" variant="outline" title="Göster" onClick={() => navigate(`/orders/${order._id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" title="Sil" onClick={() => setOrderToDelete(order)} disabled={deleting}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {order.status === 'shipped' && (
                            <Button size="icon" variant="outline" title="Yazdır" onClick={() => setPrintOrder(order)}>
                              <Printer className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Önceki</button>
        <span>Sayfa {currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Sonraki</button>
      </div>

      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sipariş İptal</AlertDialogTitle>
            <AlertDialogDescription>
              Bu siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
              Evet, Sipariş İptal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDeleteOrder} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Siliniyor...' : 'Evet, Sil'}
            </AlertDialogAction>
            <AlertDialogCancel>İptal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden print area always in DOM for react-to-print */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="bg-white p-4 rounded shadow print:block">
          {printOrder && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-bold text-lg">Sipariş No</div>
                  <div className="text-xl">{printOrder.orderId}</div>
                </div>
                <QRCodeSVG value={printOrder.orderId} size={64} />
              </div>
              <div className="mb-2">
                <span className="font-semibold">Cihaz Tipi:</span> {(() => {
                  const device = printOrder.device || {};
                  let deviceTypeName = '-';
                  if (device.deviceType) {
                    deviceTypeName = device.deviceType;
                  } else if (device.modelId) {
                    const modelObj = models.find(m => m._id === device.modelId || m.name === device.modelId);
                    if (modelObj) {
                      if (modelObj.deviceType) {
                        deviceTypeName = modelObj.deviceType;
                      } else if (modelObj.deviceTypeId) {
                        const dt = deviceTypes.find(dt => dt._id === modelObj.deviceTypeId);
                        if (dt) deviceTypeName = dt.name;
                      }
                    }
                  } else if (device.brandId) {
                    const brandObj = brands.find(b => b._id === device.brandId || b.name === device.brandId);
                    if (brandObj) {
                      if (brandObj.deviceType) {
                        deviceTypeName = brandObj.deviceType;
                      } else if (brandObj.deviceTypeId) {
                        const dt = deviceTypes.find(dt => dt._id === brandObj.deviceTypeId);
                        if (dt) deviceTypeName = dt.name;
                      }
                    }
                  }
                  return deviceTypeName || '-';
                })()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Marka:</span> {(() => {
                  const device = printOrder.device || {};
                  let brandName = '-';
                  if (device.brandId) {
                    const brandObj = brands.find(b => b._id === device.brandId || b.name === device.brandId);
                    if (brandObj) brandName = brandObj.name;
                  }
                  if (brandName === '-' && device.brand) brandName = device.brand;
                  return brandName || '-';
                })()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Model:</span> {(() => {
                  const device = printOrder.device || {};
                  let modelName = '-';
                  if (device.modelId) {
                    const modelObj = models.find(m => m._id === device.modelId || m.name === device.modelId);
                    if (modelObj) modelName = modelObj.name;
                  }
                  if (modelName === '-' && device.model) modelName = device.model;
                  return modelName || '-';
                })()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Parçalar:</span>
                <ul className="list-disc ml-6">
                  {printOrder.items && printOrder.items.length > 0 ? (
                    printOrder.items.map((item, idx) => (
                      <li key={idx}>{item.name} x {item.quantity}</li>
                    ))
                  ) : (
                    <li>-</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Print Dialog */}
      <Dialog open={!!printOrder} onOpenChange={() => setPrintOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sipariş Yazdır</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview only, not for printing */}
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-bold text-lg">Sipariş No</div>
                  <div className="text-xl">{printOrder?.orderId}</div>
                </div>
                {printOrder && (
                  <QRCodeSVG value={printOrder.orderId} size={64} />
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Cihaz Tipi:</span> {(() => {
                  if (!printOrder) return '-';
                  const device = printOrder.device || {};
                  let deviceTypeName = '-';
                  if (device.deviceType) {
                    deviceTypeName = device.deviceType;
                  } else if (device.modelId) {
                    const modelObj = models.find(m => m._id === device.modelId || m.name === device.modelId);
                    if (modelObj) {
                      if (modelObj.deviceType) {
                        deviceTypeName = modelObj.deviceType;
                      } else if (modelObj.deviceTypeId) {
                        const dt = deviceTypes.find(dt => dt._id === modelObj.deviceTypeId);
                        if (dt) deviceTypeName = dt.name;
                      }
                    }
                  } else if (device.brandId) {
                    const brandObj = brands.find(b => b._id === device.brandId || b.name === device.brandId);
                    if (brandObj) {
                      if (brandObj.deviceType) {
                        deviceTypeName = brandObj.deviceType;
                      } else if (brandObj.deviceTypeId) {
                        const dt = deviceTypes.find(dt => dt._id === brandObj.deviceTypeId);
                        if (dt) deviceTypeName = dt.name;
                      }
                    }
                  }
                  return deviceTypeName || '-';
                })()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Marka:</span> {(() => {
                  if (!printOrder) return '-';
                  const device = printOrder.device || {};
                  let brandName = '-';
                  if (device.brandId) {
                    const brandObj = brands.find(b => b._id === device.brandId || b.name === device.brandId);
                    if (brandObj) brandName = brandObj.name;
                  }
                  if (brandName === '-' && device.brand) brandName = device.brand;
                  return brandName || '-';
                })()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Model:</span> {(() => {
                  if (!printOrder) return '-';
                  const device = printOrder.device || {};
                  let modelName = '-';
                  if (device.modelId) {
                    const modelObj = models.find(m => m._id === device.modelId || m.name === device.modelId);
                    if (modelObj) modelName = modelObj.name;
                  }
                  if (modelName === '-' && device.model) modelName = device.model;
                  return modelName || '-';
                })()}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Parçalar:</span>
                <ul className="list-disc ml-6">
                  {printOrder?.items && printOrder.items.length > 0 ? (
                    printOrder.items.map((item, idx) => (
                      <li key={idx}>{item.name} x {item.quantity}</li>
                    ))
                  ) : (
                    <li>-</li>
                  )}
                </ul>
              </div>
            </div>
            <Button onClick={() => printOrder && handlePrint()} className="w-full" variant="outline" disabled={!printOrder}>
              <Printer className="w-4 h-4 mr-2" /> Yazıcıya Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}