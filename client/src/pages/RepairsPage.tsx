// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useSnackbar } from 'notistack';
import { cancelRepair, getRepairs, updateRepairStatus, deleteRepair } from '@/api/repairs';
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
import { MoreVertical, Search, Plus, Pencil, Trash2, Eye, Printer, Mail } from 'lucide-react';
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
import type { Repair } from '@/api/repairs';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

function formatBranchAddress(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    return [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean).join(', ');
  }
  return String(address);
}

// Mesajda "Bestellte Teile" kısmında, her parça için Almanca isim (name.de) gösterilir.
function formatRepairItemsDe(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return '';
  return '\n\nBestellte Teile:' +
    items.map(it => `\n• ${getDisplayNameDe(it.name)} x${it.quantity}`).join('');
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [repairToCancel, setRepairToCancel] = useState<string | null>(null);
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
  const [repairSortDirection, setRepairSortDirection] = useState<'asc' | 'desc'>('desc');
  const [repairToDelete, setRepairToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [printRepair, setPrintRepair] = useState<Repair | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: printRepair ? `Repair-${printRepair.orderId}` : 'Repair',
  });
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageRepair, setMessageRepair] = useState<any>(null);
  const [messageChannels, setMessageChannels] = useState<{ email: boolean; sms: boolean; whatsapp: boolean }>({ email: true, sms: false, whatsapp: false });
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrInMessageDialog, setShowQrInMessageDialog] = useState(false);
  const { t } = useTranslation();

  const whatsappSessionUser = user?.username || user?.email || 'default';

  // 1. Tüm veriler: repairs
  // 2. Arama ve filtreleme
  const filteredRepairs = repairs.filter(repair => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;

    let createdAtStr = '';
    try {
      createdAtStr = repair.createdAt ? formatDate(repair.createdAt).toLowerCase() : '';
    } catch {
      createdAtStr = '';
    }

    return (
      (repair.orderNumber && repair.orderNumber.toLowerCase().includes(search)) ||
      (repair.orderId && repair.orderId.toLowerCase().includes(search)) ||
      (repair.customerId?.name && repair.customerId.name.toLowerCase().includes(search)) ||
      (repair.customerId?.phone && repair.customerId.phone.toLowerCase().includes(search)) ||
      (repair.branch?.name && repair.branch.name.toLowerCase().includes(search)) ||
      (repair.device?.brand && repair.device.brand.toLowerCase().includes(search)) ||
      (repair.device?.model && repair.device.model.toLowerCase().includes(search)) ||
      (repair.items && repair.items.some(item =>
        (getDisplayNameDe(item.name).toLowerCase().includes(search)) ||
        (item.quantity !== undefined && String(item.quantity).toLowerCase().includes(search))
      )) ||
      (repair.status && t(`orders.status.${repair.status}`).toLowerCase().includes(search)) ||
      (createdAtStr && createdAtStr.includes(search)) ||
      (repair.payment?.amount !== undefined && String(repair.payment.amount).toLowerCase().includes(search)) ||
      (repair.payment?.totalAmount !== undefined && String(repair.payment.totalAmount).toLowerCase().includes(search))
    );
  });

  // 3. Sayfalama
  const pagedRepairs = filteredRepairs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 4. Tablo sadece pagedRepairs ile render edilir
  // 5. Arama, filtre veya pageSize değiştiğinde currentPage = 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, branchFilter, pageSize]);

  // 6. Toplam sayfa sayısı güncelle
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredRepairs.length / pageSize)));
    if ((currentPage - 1) * pageSize >= filteredRepairs.length && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [filteredRepairs, pageSize]);

  // API'den verileri sadece bir defa veya filtre değişince çek
  const loadRepairs = async () => {
    try {
      setLoading(true);
      const response = await getRepairs({ status: statusFilter, branch: branchFilter, limit: 10000 });
      setRepairs(response.repairs);
    } catch (error) {
      console.error('Failed to load repairs:', error);
      enqueueSnackbar('Failed to load repairs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, [statusFilter, branchFilter]);

  const handleCancelClick = (repairId: string) => {
    setRepairToCancel(repairId);
  };

  const handleCancelConfirm = async () => {
    if (!repairToCancel) return;
    try {
      await cancelRepair(repairToCancel, 'Cancelled by branch staff');
      enqueueSnackbar('Repair cancelled successfully', { variant: 'success' });
      await loadRepairs();
    } catch (error) {
      console.error('Failed to cancel repair:', error);
      enqueueSnackbar('Failed to cancel repair', { variant: 'error' });
    } finally {
      setRepairToCancel(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
      case 'delivered':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
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
  }, []);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [pageSize, statusFilter, branchFilter, searchTerm]);

  useEffect(() => {
    if (messageRepair) {
      const branch = messageRepair.branchSnapshot || {};
      setMessageText(
        `Sehr geehrte/r Kundin / Kunde,\n\nIhre Reparatur ist in unserer Filiale eingetroffen.\n\nBestellte Teile:\n${(messageRepair.items || []).map(it => `• ${getDisplayNameDe(it.name)} x${it.quantity}`).join('\n')}\n\nFiliale: ${branch.name || ''}\nAdresse: ${formatBranchAddress(branch.address)}\n\nMit freundlichen Grüßen\nSmart Punkt GmbH`
      );
    }
  }, [messageRepair]);

  const handleDeleteRepair = async () => {
    if (!repairToDelete) return;
    setDeleting(true);
    try {
      await deleteRepair(repairToDelete._id);
      setRepairToDelete(null);
      await loadRepairs();
    } finally {
      setDeleting(false);
    }
  };

  const getRowBgClass = (status: string) => {
    switch (status) {
      case 'pending':
      case 'delivered':
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

  const handleSendMessage = async () => {
    if (!messageRepair) return;
    setMessageSending(true);
    try {
      // WhatsApp seçiliyse ve QR kodu gerekiyorsa önce kontrol et
      if (messageChannels.whatsapp) {
        const res = await api.get(`/api/repairs/whatsapp/qr?user=${encodeURIComponent(whatsappSessionUser)}`);
        if (res.data?.success && res.data.qr) {
          setQrCode(res.data.qr);
          setShowQrInMessageDialog(true);
          setMessageSending(false);
          enqueueSnackbar(t('repairs.form.whatsappQrInfo'), { variant: 'info' });
          return; // QR kodu varsa mesajı göndermeden çık
        }
      }
      const channels = [];
      if (messageChannels.email) channels.push('email');
      if (messageChannels.sms) channels.push('sms');
      if (messageChannels.whatsapp) channels.push('whatsapp');
      await api.post(`/api/repairs/${messageRepair._id}/message`, {
        channels,
        message: messageText,
        whatsappUser: whatsappSessionUser,
      });
      enqueueSnackbar('Mesaj gönderildi', { variant: 'success' });
      setMessageDialogOpen(false);
      setMessageRepair(null);
    } catch (err) {
      enqueueSnackbar('Mesaj gönderilemedi', { variant: 'error' });
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <PageContainer title={t('repairs.title')} description={t('repairs.description')}>
      {/* WhatsApp QR Code Dialog - always present at root */}
      <Dialog open={!!qrCode} onOpenChange={() => setQrCode(null)}>
        <DialogContent className="max-w-md flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>{t('repairs.whatsappTitle')}</DialogTitle>
          </DialogHeader>
          <div className="mb-2">{t('repairs.whatsappDesc')}</div>
          {qrCode && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200`}
              alt={t('repairs.whatsappQrAlt')}
              style={{ border: '1px solid #ccc', background: '#fff', padding: 8 }}
            />
          )}
          <div className="text-xs text-gray-500 mt-2">{t('repairs.whatsappHint')}</div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t('repairs.title')}
        </h1>
        <Button
          onClick={() => navigate('/repairs/create')}
          className="w-full sm:w-auto bg-white text-blue-700 border border-blue-600 hover:bg-blue-50 shadow font-semibold"
        >
          <Plus className="h-4 w-4 mr-2 text-blue-700" />
          {t('repairs.create')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={t('repairs.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('repairs.statusFilterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('repairs.allStatuses')}</SelectItem>
              <SelectItem value="delivered">{t('repairs.status.delivered')}</SelectItem>
              <SelectItem value="completed">{t('repairs.status.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('repairs.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {user?.role === 'admin' && (
          <div className="w-full sm:w-48">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('repairs.branchFilterPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('repairs.allBranches')}</SelectItem>
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
          <span>{t('repairs.pagePerPage')}</span>
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
        {t('repairs.totalRepairs', { total: repairs.length })}
      </div>

      {/* Kargoda Olan Tamirler Tablosu */}
      {pagedRepairs.length > 0 && (
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle>{t('repairs.shippedRepairsTitle')}</CardTitle>
            <CardDescription>{t('repairs.shippedRepairsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-slate-800">
                <thead>
                  <tr className="bg-orange-100 dark:bg-orange-900">
                    <th className="px-3 py-2 text-left">{t('repairs.table.createdAt')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.orderNo')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.branch')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.brand')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.model')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.parts')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.centralService')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.status')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.amount')}</th>
                    <th className="px-3 py-2 text-left">{t('repairs.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRepairs.map(repair => {
                    // Brand lookup: try device.brandId, then device.brand, then model's brandId
                    let brandObj = null;
                    if (repair.device.brandId) {
                      brandObj = brands.find(b => b._id === repair.device.brandId);
                    }
                    if (!brandObj && repair.device.brand) {
                      brandObj = brands.find(b => b._id === repair.device.brand || b.name === repair.device.brand);
                    }
                    // If still not found, try model's brandId
                    let modelObj = null;
                    if (repair.device.modelId) {
                      modelObj = models.find(m => m._id === repair.device.modelId || m.name === repair.device.modelId);
                    }
                    if (!modelObj && repair.device.model) {
                      modelObj = models.find(m => m._id === repair.device.model || m.name === repair.device.model);
                    }
                    if (!brandObj && modelObj && modelObj.brandId) {
                      brandObj = brands.find(b => b._id === modelObj.brandId);
                    }

                    return (
                      <tr key={repair._id} className={getRowBgClass(repair.status)}>
                        <td className="px-3 py-2">{formatDate(repair.createdAt)}</td>
                        <td className="px-3 py-2">{repair.orderId}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-black">
                            {repair.branchSnapshot?.name || '-'}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <BrandIcon brand={brandObj || { name: '-' }} size={24} />
                          <span>{brandObj?.name || '-'}</span>
                        </td>
                        <td className="px-3 py-2">{modelObj?.name || '-'}</td>
                        <td className="px-3 py-2">
                          {repair.items && repair.items.length > 0
                            ? repair.items.map((item, idx) => (
                                <span key={idx} className="block">{getDisplayNameDe(item.name)} x {item.quantity}</span>
                              ))
                            : '-'}
                        </td>
                        <td className="px-3 py-2">{repair.isCentralService ? t('common.yes') : t('common.no')}</td>
                        <td className="px-3 py-2">
                          {t(`repairs.status.${repair.status}`)}
                        </td>
                        <td className="px-3 py-2">
                          {repair.totalCentralPayment ? `${formatCurrency(repair.totalCentralPayment)}` : '-'}
                        </td>
                        <td className="px-3 py-2 flex gap-2 items-center">
                          <Button size="icon" variant="outline" title={t('repairs.view')} onClick={() => navigate(`/repairs/${repair._id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" title={t('repairs.delete')} onClick={() => setRepairToDelete(repair)} disabled={deleting}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" title={t('repairs.print')} onClick={() => setPrintRepair(repair)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" title={t('repairs.sendMessage')} onClick={() => { setMessageRepair(repair); setMessageDialogOpen(true); }}>
                            <Mail className="w-4 h-4" />
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

      <div className="flex items-center justify-between mt-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">{t('common.previous')}</button>
        <span>{t('repairs.page', { current: currentPage, total: totalPages })}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">{t('common.next')}</button>
      </div>

      <AlertDialog open={!!repairToCancel} onOpenChange={() => setRepairToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('repairs.cancelRepairTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('repairs.cancelRepairDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
              {t('repairs.confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!repairToDelete} onOpenChange={() => setRepairToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('repairs.deleteRepairTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('repairs.deleteRepairDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDeleteRepair} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? t('repairs.deleting') : t('repairs.confirmDelete')}
            </AlertDialogAction>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden print area always in DOM for react-to-print */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="bg-white p-4 rounded shadow print:block">
          {printRepair && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-bold text-lg">{t('repairs.form.orderNo')}</div>
                  <div className="text-xl">{printRepair.orderId}</div>
                </div>
                <QRCodeSVG value={printRepair.orderId} size={64} />
              </div>
              <div className="mb-2">
                <span className="font-semibold">{t('repairs.form.deviceType')}:</span> {(() => {
                  const device = printRepair.device || {};
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
                <span className="font-semibold">{t('repairs.form.brand')}:</span> {(() => {
                  const device = printRepair.device || {};
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
                <span className="font-semibold">{t('repairs.form.model')}:</span> {(() => {
                  const device = printRepair.device || {};
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
                <span className="font-semibold">{t('repairs.form.parts')}:</span>
                <ul className="list-disc ml-6">
                  {printRepair?.items && printRepair.items.length > 0 ? (
                    printRepair.items.map((item, idx) => (
                      <li key={idx}>{getDisplayNameDe(item.name)} x {item.quantity}</li>
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
      <Dialog open={!!printRepair} onOpenChange={() => setPrintRepair(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('repairs.printTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview only, not for printing */}
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-bold text-lg">{t('repairs.form.orderNo')}</div>
                  <div className="text-xl">{printRepair?.orderId}</div>
                </div>
                {printRepair && (
                  <QRCodeSVG value={printRepair.orderId} size={64} />
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">{t('repairs.form.deviceType')}:</span> {(() => {
                  if (!printRepair) return '-';
                  const device = printRepair.device || {};
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
                <span className="font-semibold">{t('repairs.form.brand')}:</span> {(() => {
                  if (!printRepair) return '-';
                  const device = printRepair.device || {};
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
                <span className="font-semibold">{t('repairs.form.model')}:</span> {(() => {
                  if (!printRepair) return '-';
                  const device = printRepair.device || {};
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
                <span className="font-semibold">{t('repairs.form.parts')}:</span>
                <ul className="list-disc ml-6">
                  {printRepair?.items && printRepair.items.length > 0 ? (
                    printRepair.items.map((item, idx) => (
                      <li key={idx}>{getDisplayNameDe(item.name)} x {item.quantity}</li>
                    ))
                  ) : (
                    <li>-</li>
                  )}
                </ul>
              </div>
            </div>
            <Button onClick={() => printRepair && handlePrint()} className="w-full" variant="outline" disabled={!printRepair}>
              <Printer className="w-4 h-4 mr-2" /> {t('repairs.printButton')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mesaj Gönderme Dialogu */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('repairs.sendMessageTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <Checkbox id="email" checked={messageChannels.email} onCheckedChange={v => setMessageChannels(ch => ({ ...ch, email: !!v }))} />
              <label htmlFor="email">{t('repairs.form.email')}</label>
              <Checkbox id="sms" checked={messageChannels.sms} onCheckedChange={v => setMessageChannels(ch => ({ ...ch, sms: !!v }))} />
              <label htmlFor="sms">{t('repairs.form.sms')}</label>
              <Checkbox id="whatsapp" checked={messageChannels.whatsapp} onCheckedChange={async v => {
                setMessageChannels(ch => ({ ...ch, whatsapp: !!v }));
                if (v) {
                  const res = await api.get(`/api/repairs/whatsapp/qr?user=${encodeURIComponent(whatsappSessionUser)}`);
                  if (res.data?.success && res.data.qr) {
                    setQrCode(res.data.qr);
                    setShowQrInMessageDialog(true);
                    enqueueSnackbar(t('repairs.form.whatsappQrInfo'), { variant: 'info' });
                  } else {
                    setShowQrInMessageDialog(false);
                    setQrCode(null);
                  }
                } else {
                  setShowQrInMessageDialog(false);
                  setQrCode(null);
                }
              }} />
              <label htmlFor="whatsapp">WhatsApp</label>
            </div>
            <div>
              <label className="block mb-1 font-medium">{t('repairs.form.messageLabel')}</label>
              <textarea className="w-full border rounded p-2 min-h-[100px]" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={t('repairs.form.messagePlaceholder')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSendMessage} disabled={messageSending} className="bg-blue-600 text-white">
                {messageSending ? t('repairs.form.sending') : t('repairs.form.send')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}