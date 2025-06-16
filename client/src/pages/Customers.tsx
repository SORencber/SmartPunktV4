import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Building,
  Loader2,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer
} from '@/api/customers';
import { getAllBranches, type Branch as ApiBranch } from '@/api/branches';
import { PageContainer } from '@/components/PageContainer';

// Types
interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  preferredLanguage: 'TR' | 'DE' | 'EN';
  notes?: string;
  branchId: string;
  branch?: {
    _id: string;
    name: string;
    code: string;
  };
  createdBy: string;
  createdByUser?: {
    _id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Use ApiBranch type from the API

// Form validation schema
const customerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır'),
  email: z.union([
    z.string().email('Geçerli bir email adresi giriniz'),
    z.literal(''),
    z.undefined()
  ]).optional(),
  address: z.string().optional(),
  preferredLanguage: z.enum(['TR', 'DE', 'EN']),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

// Helper to format address object
const formatAddress = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const { street, city, state, zipCode, country } = addr;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
};

const Customers: React.FC = () => {
  // Hooks
  const { user, isAuthenticated } = useAuth();
  const { branch } = useBranch();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'central_staff';

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      preferredLanguage: 'TR'
    }
  });

  // Filter customers based on search only
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm) ||
                          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Add ref outside the effect
  const initRef = useRef<boolean>(false);

  // Load data on mount
  useEffect(() => {
    const initializedRef = initRef.current;

    if (isAuthenticated && !initializedRef) {
      initRef.current = true;
      console.log('🎯 Customer Page Loaded for user:', {
        isAuthenticated,
        userEmail: user?.email,
        userRole: user?.role,
        isAdmin
      });
      
      loadInitialData();
    }

    // Add debug functions to window for testing
    (window as any).debugCustomers = () => {
      console.log('🔍 Debug Customer Data:', {
        customers: customers.length,
        isAdmin,
        user: {
          id: user?.id || user?._id,
          email: user?.email,
          role: user?.role
        },
        branch: {
          id: branch?._id,
          name: branch?.name
        },
        filteredCustomers: filteredCustomers.length,
        searchTerm,
        selectedBranchFilter
      });
    };

    (window as any).testSearch = (term: string) => {
      console.log('🔍 Testing search with term:', term);
      setSearchTerm(term);
    };

    (window as any).testCustomerCreation = (testData?: any) => {
      const defaultData = {
        name: 'Test Customer - ' + new Date().getTime(),
        phone: '05551234567',
        email: 'test@example.com',
        preferredLanguage: 'TR' as const
      };
      
      console.log('🧪 Test Customer Creation Data:', testData || defaultData);
      return testData || defaultData;
    };
  }, [isAuthenticated, loadInitialData]);

  // Load branches for admin filter
  // Load branches for admin users
  const loadBranches = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await getAllBranches();
      if (response.success && response.data) {
        setBranches(response.data.filter((b: ApiBranch) => b.status === 'active'));
        console.log('Branches loaded for admin filter:', response.data.length);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  // Load customers based on user role and branch filter
  const loadCustomers = useCallback(async () => {
    console.log('🔄 [DEBUG] Starting loadCustomers...');
    
    try {
      const params: any = {
        page: 1,
        limit: 100,
      };

      // Add search parameter
      if (searchTerm) {
        params.search = searchTerm;
      }

      // For admin users, add branch filter if selected
      if (isAdmin && selectedBranchFilter && selectedBranchFilter !== 'all') {
        params.branchId = selectedBranchFilter;
      }
      
      console.log('🔄 [DEBUG] Calling getCustomers API with params:', params);
      
      const response = await getCustomers(params);
      
      console.log('🔍 [DEBUG] getCustomers API response:', {
        success: response.success,
        dataLength: response.data?.length,
        total: response.total,
        data: response.data,
        message: response.message,
        fullResponse: response
      });
      
      if (response.success && response.data) {
        console.log('🔄 [DEBUG] Setting customers state with data:', response.data);
        setCustomers(response.data);
        console.log('✅ [DEBUG] Customers setState called successfully with:', response.data.length, 'items');
        
        const branchInfo = isAdmin 
          ? (selectedBranchFilter === 'all' ? 'tüm şubelerden' : `seçili şubeden`)
          : 'şubenizden';
        
        enqueueSnackbar(`${response.data.length} müşteri ${branchInfo} yüklendi`, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
      } else {
        throw new Error(response.message || 'Müşteriler yüklenemedi');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error in loadCustomers:', error);
      console.error('❌ [DEBUG] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      enqueueSnackbar(error instanceof Error ? error.message : 'Müşteriler yüklenirken hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  }, [searchTerm, selectedBranchFilter, isAdmin, enqueueSnackbar]);

  // Reload customers when search or branch filter changes (with debounce for search)
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('🔄 Search/Filter changed, reloading customers...', { searchTerm, selectedBranchFilter });
      
      // Debounce search - wait 500ms after user stops typing
      const timeoutId = setTimeout(() => {
        loadCustomers();
      }, searchTerm ? 500 : 0); // No delay for branch filter changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedBranchFilter, isAuthenticated, loading, loadCustomers]);

  // Load initial data including branches for admin
  async function loadInitialData() {
    console.log('🚀 [DEBUG] Starting loadInitialData...');
    console.log('🚀 [DEBUG] User context:', { 
      isAuthenticated, 
      userEmail: user?.email, 
      userRole: user?.role,
      isAdmin 
    });
    
    setLoading(true);
    console.log('🚀 [DEBUG] Set loading to true');
    
    try {
      // Load branches if admin
      if (isAdmin) {
        console.log('🚀 [DEBUG] User is admin, loading branches...');
        await loadBranches();
        console.log('🚀 [DEBUG] loadBranches completed successfully');
      } else {
        console.log('🚀 [DEBUG] User is not admin, skipping branches');
      }

      console.log('🚀 [DEBUG] About to call loadCustomers...');
      await loadCustomers();
      console.log('🚀 [DEBUG] loadCustomers completed successfully');
      
      console.log('✅ [DEBUG] Initial data loading completed successfully');
      
    } catch (error) {
      console.error('❌ [DEBUG] Error in loadInitialData:', error);
      console.error('❌ [DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack');
      enqueueSnackbar('Veriler yüklenirken bir hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    } finally {
      console.log('🚀 [DEBUG] Setting loading to false in finally block');
      setLoading(false);
      
      setTimeout(() => {
        console.log('🚀 [DEBUG] Final state check - customers:', customers.length, 'loading:', loading);
      }, 200);
    }
  }

  // Create customer
  const onCreateSubmit = async (data: CustomerForm) => {
    try {
      let customerData: any = {
        ...data,
        createdBy: user?.id || user?._id || (user as any)?._id
      };

      // Always use user's current branch - no manual branch selection
      const userBranchId = (user as any)?.branchId || 
                         user?.branchId || 
                         branch?._id || 
                         (user as any)?.branch?.id || 
                         (user as any)?.branch?._id || 
                         (user as any)?.branch;
      
      if (!userBranchId) {
        console.error('Branch assignment failed:', { 
          branch, 
          userBranchFromContext: branch?._id,
          userBranchFromUser: (user as any)?.branchId,
          user 
        });
        enqueueSnackbar('Şube bilgisi bulunamadı', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        return;
      }
      
      customerData.branchId = typeof userBranchId === 'string' ? userBranchId : userBranchId._id || userBranchId;

      const response = await createCustomer(customerData);
      
      if (response.success) {
        enqueueSnackbar('Müşteri başarıyla oluşturuldu', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        setIsCreateDialogOpen(false);
        reset();
        await loadCustomers();
      } else {
        throw new Error(response.message || 'Müşteri oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Create customer error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Müşteri oluşturulurken hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  // Edit customer
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('name', customer.name);
    setValue('phone', customer.phone);
    setValue('email', customer.email || '');
    setValue('address', customer.address || '');
    setValue('preferredLanguage', customer.preferredLanguage);
    setValue('notes', customer.notes || '');
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: CustomerForm) => {
    if (!selectedCustomer) return;

    try {
      let updateData: any = { ...data };

      // Always keep the existing branch - no manual branch selection
      updateData.branchId = selectedCustomer.branchId;

      const response = await updateCustomer(selectedCustomer._id, updateData);
      
      if (response.success) {
        enqueueSnackbar('Müşteri başarıyla güncellendi', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
        reset();
        await loadCustomers();
      } else {
        throw new Error(response.message || 'Müşteri güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Update customer error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Müşteri güncellenirken hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  // Delete customer
  const onDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await deleteCustomer(selectedCustomer._id);
      
      if (response.success) {
        enqueueSnackbar('Müşteri başarıyla silindi', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        setIsDeleteDialogOpen(false);
        setSelectedCustomer(null);
        await loadCustomers();
      } else {
        throw new Error(response.message || 'Müşteri silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Müşteri silinirken hata oluştu', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
    }
  };

  if (loading) {
    console.log('🔄 [DEBUG] Still in loading state:', {
      loading,
      customersLength: customers.length,
      isAuthenticated,
      userEmail: user?.email,
      branchName: branch?.name
    });
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Müşteriler yükleniyor...</p>
          <p className="text-xs text-gray-400 mt-2">
            Debug: {customers.length} müşteri - Auth: {isAuthenticated ? 'OK' : 'NO'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer title="Müşteri Yönetimi" description="Müşterilerinizi ve müşteri kayıtlarını yönetin.">
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Müşteri Yönetimi</h1>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-blue-600">
              📍 {branch?.name || 'Şube Yükleniyor...'}
            </p>
            <p className="text-gray-600">
              Şube Kodu: {branch?.code || 'Yükleniyor...'} • {filteredCustomers.length} müşteri
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔄 Refreshing customer data...');
              loadCustomers();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Yenile
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müşteri
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
                <DialogDescription>
                  Yeni bir müşteri kaydı oluşturun. Müşteri otomatik olarak mevcut şubenize ({branch?.name}) atanacaktır.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Ad Soyad *</Label>
                  <Input
                    id="create-name"
                    {...register('name')}
                    placeholder="Müşteri adı"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-phone">Telefon *</Label>
                  <Input
                    id="create-phone"
                    {...register('phone')}
                    placeholder="05xx xxx xx xx"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    {...register('email')}
                    placeholder="ornek@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-address">Adres</Label>
                  <Textarea
                    id="create-address"
                    {...register('address')}
                    placeholder="Müşteri adresi"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="create-preferredLanguage">Tercih Edilen Dil</Label>
                  <Select 
                    value={watch('preferredLanguage') || 'TR'} 
                    onValueChange={(value) => setValue('preferredLanguage', value as 'TR' | 'DE' | 'EN')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TR">🇹🇷 Türkçe</SelectItem>
                      <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="EN">🇺🇸 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="create-notes">Notlar</Label>
                  <Textarea
                    id="create-notes"
                    {...register('notes')}
                    placeholder="Müşteri hakkında notlar"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      reset();
                    }}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      'Oluştur'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Müşteri ara (isim, telefon, email)..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('🔍 Search input changed:', e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>
            </div>
            
            {/* Branch filter for admin users */}
            {isAdmin && branches.length > 0 && (
              <div className="w-48">
                <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                  <SelectTrigger>
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şubeler</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
          <CardDescription>
            {filteredCustomers.length} müşteri bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              {searchTerm 
                ? 'Arama kriterlerinize uygun müşteri bulunamadı'
                : 'Henüz müşteri kaydı bulunmuyor'
              }
              <div className="text-xs text-gray-400 mt-2">
                Debug: Total customers: {customers.length}, Filtered: {filteredCustomers.length}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCustomers.map((customer) => (
                <Card key={customer._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{customer.name}</h3>
                          <Badge variant="outline">
                            {customer.preferredLanguage === 'TR' ? '🇹🇷' : 
                             customer.preferredLanguage === 'DE' ? '🇩🇪' : '🇺🇸'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </div>
                          
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {customer.email}
                            </div>
                          )}
                          
                          {customer.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {formatAddress(customer.address).substring(0, 30)}...
                            </div>
                          )}
                        </div>

                        {isAdmin && customer.branch && (
                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Building className="h-4 w-4" />
                            {customer.branch.name}
                          </div>
                        )}

                        {customer.createdByUser && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            {customer.createdByUser.fullName} tarafından eklendi
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/customers/${customer._id}`)}
                          title="Müşteri Detayları"
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/orders/create?customerId=${customer._id}`)}
                          title="Sipariş Ekle"
                        >
                          <ShoppingCart className="h-4 w-4 text-green-500" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(customer)}
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
            <DialogDescription>
              Müşteri bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Ad Soyad *</Label>
              <Input
                id="edit-name"
                {...register('name')}
                placeholder="Müşteri adı"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-phone">Telefon *</Label>
              <Input
                id="edit-phone"
                {...register('phone')}
                placeholder="05xx xxx xx xx"
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...register('email')}
                placeholder="ornek@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-address">Adres</Label>
              <Textarea
                id="edit-address"
                {...register('address')}
                placeholder="Müşteri adresi"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-preferredLanguage">Tercih Edilen Dil</Label>
              <Select 
                value={watch('preferredLanguage')} 
                onValueChange={(value) => setValue('preferredLanguage', value as 'TR' | 'DE' | 'EN')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TR">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="EN">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notlar</Label>
              <Textarea
                id="edit-notes"
                {...register('notes')}
                placeholder="Müşteri hakkında notlar"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCustomer(null);
                  reset();
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Güncelleniyor...
                  </>
                ) : (
                  'Güncelle'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedCustomer?.name}" adlı müşteriyi silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PageContainer>
  );
};

export default Customers; 