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
import { getParts, Part as ApiPart } from '@/api/parts';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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
  serviceFee?: number;
  isInvoiced?: boolean;
  invoicedAt?: string;
}

const getDisplayName = (val:any) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.tr || val.en || val.de || '';
  return String(val);
};

// Parça ismini Almanca (name.de) öncelikli olarak döndürür, yoksa diğer dilleri veya ilk mevcut ismi kullanır.
function getDisplayNameDe(val: any) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.de || val.en || val.tr || Object.values(val)[0] || '';
  return String(val);
}

// Teknik servis ücretlerini toplayan yardımcı fonksiyon
function getTotalServiceFee(orders: any[]) {
  return orders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);
}

// Status seçenekleri enum'dan alınanlar ve i18n anahtarları
const ORDER_STATUSES = [
  'pending',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
];

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [branches, setBranches] = useState([] as Array<{ _id:string; name:string }>);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<{ [key: string]: boolean }>({});
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
  const [selectedShippedOrderIds, setSelectedShippedOrderIds] = useState<string[]>([]);
  const [showBulkInvoice, setShowBulkInvoice] = useState(false);
  const bulkInvoiceRef = useRef<HTMLDivElement>(null);
  const handleBulkInvoicePrint = useReactToPrint({
    contentRef: bulkInvoiceRef,
    documentTitle: 'Toplu-Fatura',
    onAfterPrint: async () => {
      try {
        setIsInvoicing(prev => {
          const newState = { ...prev };
          selectedShippedOrderIds.forEach(id => {
            newState[id] = true;
          });
          return newState;
        });

        // Get the correct token
        const token = localStorage.getItem('accessToken');
        console.log('Auth Token:', token);

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Create invoice in database
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderIds: selectedShippedOrderIds
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create invoice');
        }

        // Update invoice status for each order
        await Promise.all(selectedShippedOrderIds.map(async (orderId) => {
          const orderResponse = await fetch(`/api/orders/${orderId}/invoice`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!orderResponse.ok) {
            throw new Error(`Failed to update invoice status for order ${orderId}`);
          }
        }));

        // Refresh orders to update invoice status
        await loadOrders();
        
        // Clear selected orders
        setSelectedShippedOrderIds([]);
        
        enqueueSnackbar(t('orders.invoice.createSuccess'), { variant: 'success' });
      } catch (error) {
        console.error('Error creating invoice:', error);
        enqueueSnackbar(t('orders.invoice.createError'), { variant: 'error' });
        
        // If no token found, redirect to login
        if (error.message === 'No authentication token found') {
          window.location.href = '/login?session=expired';
        }
      } finally {
        setIsInvoicing(prev => {
          const newState = { ...prev };
          selectedShippedOrderIds.forEach(id => {
            newState[id] = false;
          });
          return newState;
        });
      }
    }
  });
  const [readyToPrint, setReadyToPrint] = useState(false);
  const [parts, setParts] = useState<ApiPart[]>([]);
  const [pendingStatus, setPendingStatus] = useState<{orderId: string, status: string} | null>(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<string | null>(null);
  const [isInvoicing, setIsInvoicing] = useState<{ [key: string]: boolean }>({});

  // 1. Tüm veriler: orders
  // 2. Arama ve filtreleme
  const filteredOrders = orders.filter(order => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;

    // Tarih stringini güvenli şekilde al
    let createdAtStr = '';
    try {
      createdAtStr = order.createdAt ? formatDate(order.createdAt).toLowerCase() : '';
    } catch {
      createdAtStr = '';
    }

    return (
      (order.orderNumber && order.orderNumber.toLowerCase().includes(search)) ||
      (order.orderId && order.orderId.toLowerCase().includes(search)) ||
      (order.customerId?.name && order.customerId.name.toLowerCase().includes(search)) ||
      (order.customerId?.phone && order.customerId.phone.toLowerCase().includes(search)) ||
      (order.branch?.name && order.branch.name.toLowerCase().includes(search)) ||
      (order.device?.brand && order.device.brand.toLowerCase().includes(search)) ||
      (order.device?.model && order.device.model.toLowerCase().includes(search)) ||
      (order.items && order.items.some(item =>
        (getDisplayNameDe(item.name).toLowerCase().includes(search)) ||
        (item.quantity !== undefined && String(item.quantity).toLowerCase().includes(search))
      )) ||
      (order.status && t(`orders.status.${order.status}`).toLowerCase().includes(search)) ||
      (createdAtStr && createdAtStr.includes(search)) ||
      (order.payment?.amount !== undefined && String(order.payment.amount).toLowerCase().includes(search)) ||
      (order.payment?.totalAmount !== undefined && String(order.payment.totalAmount).toLowerCase().includes(search))
    );
  });

  // 3. Sayfalama
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 4. Tablo sadece pagedOrders ile render edilir
  // shippedOrders ve nonShippedOrders da pagedOrders üzerinden alınır
  const shippedOrders = pagedOrders.filter(order => order.status === 'shipped');
  const nonShippedOrders = pagedOrders.filter(order => order.status !== 'shipped');

  // 5. Arama, filtre veya pageSize değiştiğinde currentPage = 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, branchFilter, pageSize]);

  // 6. Toplam sayfa sayısı güncelle
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredOrders.length / pageSize)));
    if ((currentPage - 1) * pageSize >= filteredOrders.length && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [filteredOrders, pageSize]);

  // API'den verileri sadece bir defa veya filtre değişince çek
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await (getOrders as any)({ status: statusFilter, branch: branchFilter, limit: 10000 });
      setOrders(response.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      enqueueSnackbar('Failed to load orders', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, branchFilter]);

  // currentPage değişince scroll başa al (isteğe bağlı)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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
      case 'delivered':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

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
    getParts().then(res => setParts(res.data));
  }, []);

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
      case 'delivered':
        return 'bg-gradient-to-r from-cyan-100 via-white to-cyan-50';
      case 'completed':
        return 'bg-gradient-to-r from-green-100 via-white to-green-50';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 via-white to-red-50';
      default:
        return 'bg-gradient-to-r from-gray-100 via-white to-gray-50';
    }
  };

  useEffect(() => {
    if (showBulkInvoice) {
      // DOM'a eklenmesi için küçük bir gecikme
      setTimeout(() => setReadyToPrint(true), 100);
    }
  }, [showBulkInvoice]);

  useEffect(() => {
    if (readyToPrint && bulkInvoiceRef.current) {
      handleBulkInvoicePrint();
      setShowBulkInvoice(false);
      setReadyToPrint(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToPrint]);

  // Select değişim handler'ı
  const handleStatusChange = (order: Order, newStatus: string) => {
    if (newStatus === 'cancelled') {
      setPendingStatus({ orderId: order._id, status: order.status });
      setConfirmCancelOrderId(order._id);
    } else {
      updateStatus(order, newStatus);
    }
  };

  const updateStatus = async (order: Order, newStatus: string) => {
    setStatusUpdating((prev) => ({ ...prev, [order._id]: true }));
    try {
      await updateOrderStatus(order._id, { status: newStatus });
      enqueueSnackbar(t('orders.updateStatus') + ' ✓', { variant: 'success' });
      await loadOrders();
    } catch (err) {
      enqueueSnackbar(t('orders.updateStatus') + ' ✗', { variant: 'error' });
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  // Add function to handle invoice status change
  const handleInvoiceStatusChange = async (orderId: string) => {
    try {
      setIsInvoicing(prev => ({ ...prev, [orderId]: true }));
      
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice status');
      }

      // Refresh orders after status update
      await loadOrders();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      enqueueSnackbar(t('orders.invoiceUpdateError'), { variant: 'error' });
    } finally {
      setIsInvoicing(prev => ({ ...prev, [orderId]: false }));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t('orders.title')}
        </h1>
        <Button
          onClick={() => navigate('/orders/create')}
          className="w-full sm:w-auto bg-white text-blue-700 border border-blue-600 hover:bg-blue-50 shadow font-semibold"
        >
          <Plus className="h-4 w-4 mr-2 text-blue-700" />
          {t('orders.create')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={t('orders.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('orders.statusFilterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
              <SelectItem value="shipped">{t('orders.status.shipped')}</SelectItem>
              <SelectItem value="delivered">{t('orders.status.delivered')}</SelectItem>
              <SelectItem value="completed">{t('orders.status.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {user?.role === 'admin' && (
          <div className="w-full sm:w-48">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('orders.branchFilterPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('orders.allBranches')}</SelectItem>
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
          <span>{t('orders.pagePerPage')}</span>
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
        {t('orders.totalOrders', { total: filteredOrders.length })}
      </div>

      {/* Kargoda Olan Siparişler Tablosu */}
      {shippedOrders.length > 0 && (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>{t('orders.shippedOrdersTitle')}</CardTitle>
            <CardDescription>{t('orders.shippedOrdersDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-slate-800">
                <thead>
                  <tr className="bg-orange-100 dark:bg-orange-900">
                    <th className="px-3 py-2 text-left"><input type="checkbox" checked={selectedShippedOrderIds.length === shippedOrders.length} onChange={e => setSelectedShippedOrderIds(e.target.checked ? shippedOrders.map(o => o._id) : [])} /></th>
                    <th className="px-3 py-2 text-left">{t('orders.table.createdAt')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.orderNo')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.branch')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.brand')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.model')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.parts')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.status')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.amount')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.invoice.status.title')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.actions')}</th>
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
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedShippedOrderIds.includes(order._id)}
                            onChange={e => {
                              setSelectedShippedOrderIds(ids =>
                                e.target.checked
                                  ? [...ids, order._id]
                                  : ids.filter(id => id !== order._id)
                              );
                            }}
                          />
                        </td>
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
                                <span key={idx} className="block">{getDisplayNameDe(item.name)} x {item.quantity}</span>
                              ))
                            : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={order.status}
                            onValueChange={(newStatus) => handleStatusChange(order, newStatus)}
                            disabled={statusUpdating[order._id]}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder={t('orders.selectStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status} disabled={order.status === 'cancelled' && status !== 'cancelled'}>
                                  {t(`orders.status.${status}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {statusUpdating[order._id] && <span className="ml-2 animate-spin">⏳</span>}
                        </td>
                        <td className="px-3 py-2">
                          {order.totalCentralPayment ? `${formatCurrency(order.totalCentralPayment)}` : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {order.isInvoiced ? (
                              <Badge variant="success" className="w-24">
                                {t('orders.invoice.status.yes')}
                                {order.invoicedAt && (
                                  <Tooltip content={format(new Date(order.invoicedAt), 'dd.MM.yyyy HH:mm')}>
                                    <Info className="w-4 h-4 ml-1" />
                                  </Tooltip>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="w-24">
                                {t('orders.invoice.status.no')}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 flex gap-2 items-center">
                          <Button size="icon" variant="outline" title={t('orders.view')} onClick={() => navigate(`/orders/${order._id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" title={t('orders.edit')} onClick={() => navigate(`/orders/edit/${order._id}`)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" title={t('orders.delete')} onClick={() => setOrderToDelete(order)} disabled={deleting}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" title={t('orders.print')} onClick={() => setPrintOrder(order)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Fatura Yazdır Butonu */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={selectedShippedOrderIds.length === 0}
                onClick={() => setShowBulkInvoice(true)}
              >
                <Printer className="w-4 h-4 mr-2" /> {t('orders.printBulkInvoice')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ana Siparişler Tablosu (Kargoda olmayanlar) */}
      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>{t('orders.allOrdersTitle')}</CardTitle>
          <CardDescription>{t('orders.allOrdersDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {nonShippedOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">{t('orders.noOrdersFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-slate-800">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700">
                    <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => setOrderSortDirection(d => d === 'asc' ? 'desc' : 'asc')}>
                      {t('orders.table.createdAt')} {orderSortDirection === 'asc' ? '▲' : '▼'}
                    </th>
                    <th className="px-3 py-2 text-left">{t('orders.table.orderNo')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.branch')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.brand')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.model')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.parts')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.status')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.amount')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.invoice.status.title')}</th>
                    <th className="px-3 py-2 text-left">{t('orders.table.actions')}</th>
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
                            onValueChange={(newStatus) => handleStatusChange(order, newStatus)}
                            disabled={statusUpdating[order._id]}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder={t('orders.selectStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status} disabled={order.status === 'cancelled' && status !== 'cancelled'}>
                                  {t(`orders.status.${status}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {statusUpdating[order._id] && <span className="ml-2 animate-spin">⏳</span>}
                        </td>
                        <td className="px-3 py-2">
                          {order.totalCentralPayment ? `${formatCurrency(order.totalCentralPayment)}` : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {order.isInvoiced ? (
                              <Badge variant="success" className="w-24">
                                {t('orders.invoice.status.yes')}
                                {order.invoicedAt && (
                                  <Tooltip content={format(new Date(order.invoicedAt), 'dd.MM.yyyy HH:mm')}>
                                    <Info className="w-4 h-4 ml-1" />
                                  </Tooltip>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="w-24">
                                {t('orders.invoice.status.no')}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 flex gap-2 items-center">
                          <Button size="icon" variant="outline" title={t('orders.view')} onClick={() => navigate(`/orders/${order._id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" title={t('orders.edit')} onClick={() => navigate(`/orders/edit/${order._id}`)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" title={t('orders.delete')} onClick={() => setOrderToDelete(order)} disabled={deleting}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {order.status === 'shipped' && (
                            <Button size="icon" variant="outline" title={t('orders.print')} onClick={() => setPrintOrder(order)}>
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
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">
          {t('orders.previous')}
        </button>
        <span>{t('orders.page', { current: currentPage, total: totalPages })}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">
          {t('orders.next')}
        </button>
      </div>

      <AlertDialog open={!!confirmCancelOrderId} onOpenChange={() => {
        setConfirmCancelOrderId(null);
        setPendingStatus(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orders.cancelOrderTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orders.cancelOrderDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmCancelOrderId(null);
              setPendingStatus(null);
            }}>{t('orders.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (pendingStatus) {
                await updateStatus({ _id: pendingStatus.orderId } as Order, 'cancelled');
              }
              setConfirmCancelOrderId(null);
              setPendingStatus(null);
            }} className="bg-red-600 hover:bg-red-700">
              {t('orders.confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orders.deleteOrderTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orders.deleteOrderDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDeleteOrder} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? t('orders.deleting') : t('orders.confirmDelete')}
            </AlertDialogAction>
            <AlertDialogCancel>{t('orders.cancel')}</AlertDialogCancel>
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
                  <div className="font-bold text-lg">{t('orders.orderNo')}</div>
                  <div className="text-xl">{printOrder.orderId}</div>
                </div>
                <QRCodeSVG value={printOrder.orderId} size={64} />
              </div>
              <div className="mb-2">
                <span className="font-semibold">{t('orders.deviceType')}:</span> {(() => {
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
                <span className="font-semibold">{t('orders.brand')}:</span> {(() => {
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
                <span className="font-semibold">{t('orders.model')}:</span> {(() => {
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
                <span className="font-semibold">{t('orders.parts')}:</span>
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
            </>
          )}
        </div>
      </div>
      {/* Print Dialog */}
      <Dialog open={!!printOrder} onOpenChange={() => setPrintOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('orders.printOrderTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview only, not for printing */}
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-bold text-lg">{t('orders.orderNo')}</div>
                  <div className="text-xl">{printOrder?.orderId}</div>
                </div>
                {printOrder && (
                  <QRCodeSVG value={printOrder.orderId} size={64} />
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">{t('orders.deviceType')}:</span> {(() => {
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
                <span className="font-semibold">{t('orders.brand')}:</span> {(() => {
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
                <span className="font-semibold">{t('orders.model')}:</span> {(() => {
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
                <span className="font-semibold">{t('orders.parts')}:</span>
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
              <Printer className="w-4 h-4 mr-2" /> {t('orders.printToPrinter')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div style={{ display: 'none' }}>
        <div ref={bulkInvoiceRef} className="bg-white p-8 rounded shadow print:block" style={{ width: 700, fontFamily: 'Arial, sans-serif' }}>
          {showBulkInvoice && selectedShippedOrderIds.length > 0 && (
            <>
              {/* Logo ve başlık */}
              <div className="flex items-center mb-8">
                <img src="/logo192.png" alt="Logo" style={{ height: 64, marginRight: 24 }} />
                <div>
                  <h2 className="text-2xl font-bold">{t('orders.bulkInvoiceTitle')}</h2>
                  <div className="text-sm text-gray-600">{t('orders.bulkInvoiceSubtitle')}</div>
                  <div className="text-xs text-gray-400">{t('orders.bulkInvoiceAddress')}</div>
                </div>
              </div>
              <div className="mb-4 text-sm text-gray-700">
                {t('orders.bulkInvoiceDate')} {new Date().toLocaleDateString('de-DE')}
              </div>
              {/* Parçalar Tablosu */}
              <table className="min-w-full text-sm border rounded-xl bg-white mb-8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-3 py-2 text-left border">{t('orders.bulkInvoice.part')}</th>
                    <th className="px-3 py-2 text-left border">{t('orders.bulkInvoice.unitPrice')}</th>
                    <th className="px-3 py-2 text-left border">{t('orders.bulkInvoice.quantity')}</th>
                    <th className="px-3 py-2 text-left border">{t('orders.bulkInvoice.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Seçili siparişlerdeki tüm parçaları partId'ye göre grupla
                    const partMap = new Map();
                    const selectedOrders = filteredOrders.filter(o => selectedShippedOrderIds.includes(o._id));
                    selectedOrders.forEach(order => {
                      (order.items || []).forEach(item => {
                        const key = item.partId || getDisplayNameDe(item.name); // partId varsa onunla, yoksa isimle grupla
                        const partObj = item.partId ? parts.find(p => p._id === item.partId) : undefined;
                        const nameDe = partObj?.name?.de || getDisplayNameDe(item.name);
                        if (!partMap.has(key)) {
                          partMap.set(key, {
                            name: nameDe,
                            unitPrice: item.unitPrice || 0,
                            quantity: 0,
                            total: 0,
                          });
                        }
                        const entry = partMap.get(key);
                        entry.quantity += item.quantity;
                        entry.total += (item.unitPrice || 0) * item.quantity;
                      });
                    });
                    const partRows = Array.from(partMap.values()).map((part, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 border">{part.name}</td>
                        <td className="px-3 py-2 border">{part.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 border">{part.quantity}</td>
                        <td className="px-3 py-2 border">{part.total.toFixed(2)}</td>
                      </tr>
                    ));
                    // Her order için serviceFee satırı ekle
                    const serviceFeeRows = selectedOrders
                      .filter(order => order.serviceFee && order.serviceFee > 0)
                      .map((order, idx) => {
                        const branchName = order.branchSnapshot?.name || order.branch?.name || '-';
                        return (
                          <tr key={"servicefee-"+order._id}>
                            <td className="px-3 py-2 border" colSpan={2}><b>{t('orders.bulkInvoice.serviceFee', { branch: branchName })}</b></td>
                            <td className="px-3 py-2 border text-center">1</td>
                            <td className="px-3 py-2 border">{order.serviceFee.toFixed(2)}</td>
                          </tr>
                        );
                      });
                    return [...partRows, ...serviceFeeRows];
                  })()}
                  {/* Teknik servis ücreti satırı */}
                  {(() => {
                    const selectedOrders = filteredOrders.filter(o => selectedShippedOrderIds.includes(o._id));
                    const totalServiceFee = getTotalServiceFee(selectedOrders);
                    if (totalServiceFee > 0) {
                      return (
                        <tr>
                          <td className="px-3 py-2 border" colSpan={2}><b>{t('orders.bulkInvoice.totalServiceFee')}</b></td>
                          <td className="px-3 py-2 border text-center">1</td>
                          <td className="px-3 py-2 border">{totalServiceFee.toFixed(2)}</td>
                        </tr>
                      );
                    }
                    return null;
                  })()}
                </tbody>
              </table>
              <div className="text-right font-bold text-lg mt-4">
                {t('orders.bulkInvoice.totalAmount')} € {(() => {
                  // Toplam fiyatı hesapla
                  const partMap = new Map();
                  const selectedOrders = filteredOrders.filter(o => selectedShippedOrderIds.includes(o._id));
                  selectedOrders.forEach(order => {
                    (order.items || []).forEach(item => {
                      const key = item.partId || getDisplayNameDe(item.name);
                      if (!partMap.has(key)) {
                        partMap.set(key, 0);
                      }
                      partMap.set(key, partMap.get(key) + (item.unitPrice || 0) * item.quantity);
                    });
                  });
                  // Tüm serviceFee'leri topla
                  const totalServiceFee = selectedOrders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);
                  return (Array.from(partMap.values()).reduce((a, b) => a + b, 0) + totalServiceFee).toFixed(2);
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}