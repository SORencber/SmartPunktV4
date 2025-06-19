import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { createOrder, updateOrder } from '@/api/orders'
import { getCustomers } from '@/api/customers'
import { getInventory } from '@/api/inventory'
import { useSnackbar } from 'notistack'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Search, Plus, X, Phone, Mail, User, Printer } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils'
import { getDeviceTypes, type DeviceType } from '@/api/deviceTypes'
import { getBrands, type Brand } from '@/api/brands'
import { getModels, type Model as ApiModel } from '@/api/models'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useForm as useRegisterForm } from 'react-hook-form'
import { getParts, type Part } from '@/api/parts'
import { createCustomer, addOrderToCustomer } from '@/api/customers'
import { useBranch } from '@/contexts/BranchContext'
import type { User as AuthUser } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { QRCodeSVG } from 'qrcode.react'
// import logo image near top imports
import logoImg from '@/assets/brands/smartpunkt.jpg'

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  preferredLanguage?: string;
}

interface CustomerSearchResult extends Customer {
  totalOrders?: number;
  branchId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BranchPart extends Part {
  // Additional fields specific to BranchPart
}

interface OrderForm {
  customerId: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  deviceCondition: string;
  serviceType: string;
  estimatedCompletion: string;
  paymentMethod: string;
  paymentAmount: number;
  parts: Array<{ partId: string; quantity: number }>;
  labor: { total: number };
  phoneReturned: 'yes' | 'no';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  brand?: string;
  model?: string;
  imei?: string;
  faultDescription?: string;
  accessories?: Record<string, boolean>;
  notes?: string;
  loanedDevice?: {
    deviceType: string;
    deviceBrand: string;
    deviceModel: string;
    modelName: string;
    brandName: string;
    deviceTypeName: string;
  };
}

// Add a separate interface for the new customer form
interface NewCustomerForm {
  name?: string;  // Make name optional
  phone?: string;
  email?: string;
  address?: string;
}

interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  branchId: string;
  preferredLanguage: 'TR' | 'EN';
  isActive: boolean;
  address: string;
  createdBy: {
    id: string;
    email: string;
    fullName: string;
  };
}

// Props for edit/create mode
interface CreateOrderProps {
  mode?: 'create' | 'edit';
  order?: any;          // order data when editing
  orderId?: string;     // id for update
  onDone?: () => void;  // callback on success
}

export function CreateOrder({ mode = 'create', order, orderId, onDone }: CreateOrderProps) {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(() => {
    const stepParam = Number(searchParams.get('step'));
    return stepParam && !isNaN(stepParam) ? stepParam : 1;
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [deviceLeftForService, setDeviceLeftForService] = useState(false)
  const [sendToCentralService, setSendToCentralService] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(true)
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [parts, setParts] = useState<Part[]>([])
  const [loadingParts, setLoadingParts] = useState(false)
  const { user } = useAuth()

  const initialDefaults: OrderForm = mode === 'edit' && order ? {
    customerId: order.customerId?._id || order.customerId || '',
    deviceType: order.device?.deviceTypeId || order.device?.type || '',
    deviceBrand: order.device?.brandId || order.device?.brand || '',
    deviceModel: order.device?.modelId || order.device?.model || '',
    serialNumber: order.device?.serialNumber || '',
    deviceCondition: order.device?.condition || '',
    serviceType: order.serviceType || '',
    estimatedCompletion: order.estimatedCompletion || '',
    paymentMethod: order.payment?.method || '',
    paymentAmount: order.payment?.amount || 0,
    parts: order.products?.map((p: any) => ({ partId: p.productId, quantity: p.quantity })) || [],
    labor: order.labor || { total: 0 },
    phoneReturned: order.phoneReturned || 'no',
    customerName: order.customerId?.name || order.customerName || '',
    customerPhone: order.customerId?.phone || order.customerPhone || '',
    customerEmail: order.customerId?.email || order.customerEmail || '',
    brand: '', model: '', imei: '', faultDescription: order.description || '', accessories: order.accessories || {}, notes: order.notes || '',
  } : {
    customerId: '',
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    serialNumber: '',
    deviceCondition: '',
    serviceType: '',
    estimatedCompletion: '',
    paymentMethod: '',
    paymentAmount: 0,
    parts: [],
    labor: { total: 0 },
    phoneReturned: 'no',
  } as any;

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<OrderForm>({
    defaultValues: mode === 'edit' && order ? { ...order } : {
      customerId: '',
      deviceType: '',
      deviceBrand: '',
      deviceModel: '',
      serialNumber: '',
      deviceCondition: '',
      serviceType: '',
      estimatedCompletion: '',
      paymentMethod: '',
      paymentAmount: 0,
      parts: [],
      labor: { total: 0 },
      phoneReturned: 'no',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      brand: '',
      model: '',
      imei: '',
      faultDescription: '',
      accessories: {},
      notes: '',
      loanedDevice: undefined,
    }
  });

  const { fields: partFields, append: appendPart, remove: removePart, replace: replaceParts } = useFieldArray({
    control,
    name: 'parts'
  });

  // Add useEffect for customer selection after all declarations
  useEffect(() => {
    if (selectedCustomer?._id) {
      console.log('Customer selected:', selectedCustomer);
      setValue('customerId', selectedCustomer._id);
      setValue('customerName', selectedCustomer.name);
      setValue('customerPhone', selectedCustomer.phone);
      setValue('customerEmail', selectedCustomer.email || '');
    }
  }, [selectedCustomer, setValue]);

  const deviceType = watch('deviceType')
  const deviceBrand = watch('deviceBrand')
  const deviceModel = watch('deviceModel')

  // Add new state variables for device selection
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<ApiModel[]>([])
  const [loadingDeviceData, setLoadingDeviceData] = useState(false)

  // Update the component to use a separate form for new customer
  const { register: registerNewCustomer, handleSubmit: handleNewCustomerSubmit, setValue: setNewCustomerValue, formState: { errors: newCustomerErrors } } = useForm<NewCustomerForm>({
    defaultValues: {
      name: '',
      phone: '',
      email: ''
    },
    mode: 'onChange'
  });
  const [newCustomerLoading, setNewCustomerLoading] = useState(false);

  // Service adımı için state
  const [serviceFee, setServiceFee] = useState<number>(40);

  // Step 1 için ek state'ler
  const [isCentral, setIsCentral] = useState<'yes' | 'no' | null>(null);
  const [branchProfit, setBranchProfit] = useState<number>(20);
  const [branchServiceFee, setBranchServiceFee] = useState<number>(20);
  const [centralServiceFee, setCentralServiceFee] = useState<number>(20);
  const priceOptions = Array.from({length: 37}, (_, i) => 20 + i * 5); // 20, 25, ... 200

  // Add a state to track when the add customer form is shown
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Add state to store current order information
  const [currentOrderInfo, setCurrentOrderInfo] = useState({
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    serialNumber: '',
    deviceCondition: '',
    serviceType: '',
    estimatedCompletion: '',
    parts: [] as Array<{ partId: string; quantity: number }>,
    labor: { total: 0 }
  });

  // Add branch context
  const { branch } = useBranch();

  // Memoized branch address lines for receipt
  const branchAddressLines = useMemo(() => {
    if (!branch) return [] as string[];
    const lines: string[] = [];
    if (branch.name) lines.push(branch.name);

    // address yoksa veya null ise hiçbir şey ekleme
    if (!branch.address) {
      // skip
    } else if (typeof branch.address === 'string') {
      const trimmedAddress = (branch.address as string).trim();
      if (trimmedAddress) lines.push(trimmedAddress);
    } else if (typeof branch.address === 'object') {
      const street = typeof branch.address.street === 'string' ? branch.address.street.trim() : '';
      if (street) lines.push(street);

      const postalCode = typeof branch.address.postalCode === 'string' ? branch.address.postalCode.trim() : '';
      const city = typeof branch.address.city === 'string' ? branch.address.city.trim() : '';
      if (postalCode || city) lines.push([postalCode, city].filter(Boolean).join(' '));

      const state = typeof branch.address.state === 'string' ? branch.address.state.trim() : '';
      if (state) lines.push(state);

      const country = typeof branch.address.country === 'string' ? branch.address.country.trim() : '';
      if (country) lines.push(country);
    }

    if (branch.phone) lines.push(`Telefon: ${branch.phone}`);

    return lines.filter(Boolean);
  }, [branch]);

  // Add these helper functions at the top level of the component
  const isEmail = (str: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  };

  const isPhoneNumber = (str: string) => {
    // Remove any non-digit characters for comparison
    const digitsOnly = str.replace(/\D/g, '');
    // Check if it's a valid Turkish phone number (10 or 11 digits)
    return digitsOnly.length >= 10 && digitsOnly.length <= 11;
  };

  const isName = (str: string) => {
    // Check if the string contains only letters, spaces, and Turkish characters
    const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
    return nameRegex.test(str) && str.length >= 2;
  };

  // Fetch all customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true)
        console.log('Fetching customers...')
        const response = await getCustomers({ limit: 100 }) // Get all customers for search
        console.log('Full response:', response)
        
        // getCustomers returns { success, data, totalPages, etc. }
        const customerData = response.success ? response.data : []
        console.log('Customers fetched:', customerData.length)
        setAllCustomers(Array.isArray(customerData) ? customerData : [])
      } catch (error) {
        console.error('Error fetching customers:', error)
        setAllCustomers([]) // Ensure we always have an array
        enqueueSnackbar("Error", {
          variant: "error",
        })
      } finally {
        setCustomersLoading(false)
      }
    }

    fetchCustomers()
  }, [enqueueSnackbar])

  // Customer selection handler
  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer._id);
    setShowSearchResults(false);
    setCustomerSearchTerm('');
    // Müşteri seçildiğinde 3. adıma geç
    setCurrentStep(3);
    // Başarılı seçim bildirimi göster
    enqueueSnackbar("Müşteri seçildi", {
      variant: "success",
    });
  };

  // Auto-select customer if customerId is provided in URL
  useEffect(() => {
    const customerId = searchParams.get('customerId')
    console.log('Auto-select useEffect triggered:')
    console.log('- customerId:', customerId)
    console.log('- customersLoading:', customersLoading)
    console.log('- allCustomers length:', allCustomers?.length)
    console.log('- selectedCustomer:', selectedCustomer?.name)
    
    // Only proceed if customers are loaded and we have a customerId and no customer is already selected
    if (customerId && !customersLoading && allCustomers && allCustomers.length > 0 && !selectedCustomer) {
      const customer = allCustomers.find(c => c._id === customerId)
      console.log('Found customer:', customer?.name || 'Not found')
      if (customer) {
        console.log('Auto-selecting customer from URL:', customer.name)
        handleCustomerSelect(customer)
        // Show success message
        enqueueSnackbar("Müşteri Seçildi", {
          variant: "success",
        })
      } else {
        console.log('Customer not found with ID:', customerId)
        enqueueSnackbar("Uyarı", {
          variant: "error",
        })
      }
    }
  }, [searchParams, customersLoading, allCustomers, handleCustomerSelect, enqueueSnackbar, selectedCustomer])

  // Handle customer search
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setCustomerSearchResults([])
      setShowSearchResults(false)
      return
    }

    if (!allCustomers || allCustomers.length === 0) {
      setCustomerSearchResults([])
      setShowSearchResults(false)
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    
    // Simulate API delay
    const searchTimeout = setTimeout(() => {
      const filteredCustomers = allCustomers.filter(customer => {
        if (isEmail(customerSearchTerm)) {
          return customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase());
        } else if (isPhoneNumber(customerSearchTerm)) {
          const digitsOnly = customerSearchTerm.replace(/\D/g, '');
          return customer.phone?.replace(/\D/g, '').includes(digitsOnly);
        } else if (isName(customerSearchTerm)) {
          return customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase());
        } else {
          return (
            customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            customer.phone?.includes(customerSearchTerm)
          );
        }
      });
      
      setCustomerSearchResults(filteredCustomers)
      setShowSearchResults(true)
      setSearchLoading(false)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [customerSearchTerm, allCustomers])

  // Add useEffect to load device types
  useEffect(() => {
    const loadDeviceTypes = async () => {
      try {
        setLoadingDeviceData(true)
        const response = await getDeviceTypes()
        if (response.success) {
          setDeviceTypes(response.data.filter((dt: DeviceType) => dt.isActive))
        }
      } catch (error) {
        console.error('Error loading device types:', error)
        enqueueSnackbar("Error", {
          variant: "error",
        })
      } finally {
        setLoadingDeviceData(false)
      }
    }

    loadDeviceTypes()
  }, [enqueueSnackbar])

  // Add useEffect to load brands when device type is selected
  useEffect(() => {
    const loadBrands = async () => {
      if (!deviceType || deviceType === '') return

      try {
        setLoadingDeviceData(true)
        const response = await getBrands({ deviceTypeId: deviceType })
        if (response.success) {
          setBrands(response.data.filter((brand: Brand) => brand.isActive))
        }
      } catch (error) {
        console.error('Error loading brands:', error)
        enqueueSnackbar("Error", {
          variant: "error",
        })
      } finally {
        setLoadingDeviceData(false)
      }
    }

    loadBrands()
  }, [deviceType, enqueueSnackbar])

  // Add useEffect to load models when brand is selected
  useEffect(() => {
    const loadModels = async () => {
      if (!deviceBrand || deviceBrand === '') return

      try {
        setLoadingDeviceData(true)
        const response = await getModels({ brandId: deviceBrand })
        if (response.success) {
          setModels(response.data.filter((model: ApiModel) => model.isActive))
        }
      } catch (error) {
        console.error('Error loading models:', error)
        enqueueSnackbar("Error", {
          variant: "error",
        })
      } finally {
        setLoadingDeviceData(false)
      }
    }

    loadModels()
  }, [deviceBrand, enqueueSnackbar])

  // loadParts fonksiyonunu güncelle
  useEffect(() => {
    const loadParts = async () => {
      // Eğer model seçili değilse, mevcut parçaları koru
      if (!deviceModel) {
        return;
      }
      try {
        setLoadingParts(true);
        const response = await getParts();
        if (response.success) {
          // Seçili model için parçaları filtrele
          const filteredParts = response.data.filter(
            (part) => {
              const partModelId = typeof part.modelId === 'string' ? part.modelId : part.modelId?._id;
              return partModelId === deviceModel && part.isActive;
            }
          );
          
          // Mevcut parçaları koru, sadece yeni parçaları ekle
          setParts(prevParts => {
            // Mevcut parçaların ID'lerini bir Set'e ekle
            const existingPartIds = new Set(prevParts.map(p => p._id));
            
            // Yeni parçaları filtrele (sadece mevcut olmayanları ekle)
            const newParts = filteredParts.filter(p => !existingPartIds.has(p._id));
            
            // Mevcut parçaları ve yeni parçaları birleştir
            return [...prevParts, ...newParts];
          });
        }
      } catch (error) {
        console.error('Error loading parts:', error);
        enqueueSnackbar('Error', { variant: 'error' });
      } finally {
        setLoadingParts(false);
      }
    };
    loadParts();
  }, [deviceModel, enqueueSnackbar]);

  // Helper function to get part name safely
  const getPartName = (part: Part | undefined) => {
    if (!part) return '-';
    if (typeof part.name === 'string') return part.name;
    return part.name.tr || part.name.en || part.name.de || 'Unnamed Part';
  };

  const extractAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object' && typeof val.amount === 'number') return val.amount;
    return 0;
  };

  const getPartPrice = (part?: Part): number => {
    if (!part) return 0;
    return extractAmount(part.branch_price) || extractAmount(part.price);
  };

  const getPartStock = (part?: Part): number => {
    if (!part) return 0;
    return extractAmount(part.branch_serviceFee) || extractAmount(part.serviceFee);
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'TR': return '🇹🇷'
      case 'DE': return '🇩🇪'
      default: return '🇺🇸'
    }
  }

  const onSubmit = async (data: OrderForm) => {
    try {
      const isCentralServiceOrder = isCentral === 'yes';
      const orderData = {
        customerId: selectedCustomer?._id,
        products: selectedProducts,
        deviceLeftForService,
        sendToCentralService: isCentralServiceOrder,
        device: {
          deviceTypeId: selectedDeviceIds.deviceTypeId || watch('deviceType'),
          brandId: selectedDeviceIds.brandId || watch('deviceBrand'),
          modelId: selectedDeviceIds.modelId || watch('deviceModel'),
          type: selectedDeviceIds.deviceTypeId || watch('deviceType'),
          brand: selectedDeviceIds.brandId || watch('deviceBrand'),
          model: selectedDeviceIds.modelId || watch('deviceModel'),
          serialNumber: data.serialNumber || undefined,
          condition: data.deviceCondition || undefined,
          names: {
            deviceType: findNameByIdDe(deviceTypes, selectedDeviceIds.deviceTypeId || watch('deviceType')),
            brand: findNameByIdDe(brands, selectedDeviceIds.brandId || watch('deviceBrand')),
            model: findNameByIdDe(models, selectedDeviceIds.modelId || watch('deviceModel'))
          }
        },
        loanedDevice: isLoanedDeviceGiven ? {
          deviceTypeId: watch('loanedDevice')?.deviceType,
          brandId: watch('loanedDevice')?.deviceBrand,
          modelId: watch('loanedDevice')?.deviceModel,
          names: {
            deviceType: watch('loanedDevice')?.deviceTypeName || '',
            brand: watch('loanedDevice')?.brandName || '',
            model: watch('loanedDevice')?.modelName || ''
          }
        } : null,
        isLoanedDeviceGiven,
        payment: {
          method: data.paymentMethod,
          amount: data.paymentAmount,
          status: data.paymentMethod === 'pending' ? 'pending' : 'paid',
          depositAmount: depositAmount,
          remainingAmount: ((isCentral==='yes'? calculateCentralCustomerTotal(): calculateBranchCustomerTotal()) - depositAmount)
        },
        isCentralService: isCentralServiceOrder,
        centralPartPrices: isCentralServiceOrder ? centralPartPrices : undefined,
        centralServiceFee: isCentralServiceOrder ? centralServiceFee : undefined,
        branchServiceFee,
        centralPartPayment: !isCentralServiceOrder ? calculateCentralPartsCost() : undefined,
        branchPartProfit: !isCentralServiceOrder ? branchProfit : undefined,
        totalCentralPayment: totalCentralPayment,
        branchSnapshot: branch
      };

      let response;
      if (mode === 'edit' && orderId) {
        response = await updateOrder(orderId, orderData);
      } else {
        response = await createOrder(orderData);
      }

      if (response && response.order) {
        const fullOrder = {
          ...response.order,
          device: {
            ...response.order.device,
            names: orderData.device.names,
          },
          loanedDevice: orderData.loanedDevice
            ? {
                ...response.order.loanedDevice,
                names: orderData.loanedDevice.names,
              }
            : null,
          isLoanedDeviceGiven: orderData.isLoanedDeviceGiven,
          branchSnapshot: branch,
        };
        setSavedOrder(fullOrder);
      }
      setOrderSaved(true);
      enqueueSnackbar(mode === 'edit' ? 'Sipariş başarıyla güncellendi' : 'Order created successfully', {
        variant: 'success',
      });
      // Do not navigate away so user can print
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  }

  // Add function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  // Update the handleNewCustomer function's state updates
  const handleNewCustomer = async (data: NewCustomerForm): Promise<{ newCustomer: CustomerSearchResult; allFormValues: OrderForm } | undefined> => {
    try {
      setNewCustomerLoading(true);

      // Store all current form values before any changes
      const allFormValues = watch();
      console.log('Current form values before customer creation:', allFormValues);

      // Get user's branch ID
      const userBranchId = branch?._id;
      if (!userBranchId) {
        console.error('Branch ID not found:', { branch });
        enqueueSnackbar('Şube bilgisi bulunamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      // Get user ID for createdBy field
      const userId = (user as AuthUser)?.id;
      if (!userId) {
        console.error('User ID not found:', { user });
        enqueueSnackbar('Kullanıcı bilgisi bulunamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      // Generate a default name if not provided
      const customerName = data.name?.trim() || `SP-Customer-${Date.now()}`;

      // Prepare customer data with required fields
      const customerData: CreateCustomerData = {
        name: customerName,
        phone: data.phone || '',
        email: data.email || '',
        branchId: userBranchId,
        preferredLanguage: 'TR',
        isActive: true,
        address: data.address || '',
        createdBy: {
          id: userId,
          email: (user as AuthUser)?.email || '',
          fullName: (user as AuthUser)?.fullName || ''
        }
      };

      // Create new customer
      const response = await createCustomer(customerData);
      console.log('Customer creation response:', response);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Müşteri oluşturulurken bir hata oluştu');
      }

      // Create a complete customer object from the response
      const newCustomer: CustomerSearchResult = {
        _id: response.data._id,
        name: response.data.name,
        phone: response.data.phone,
        email: response.data.email,
        preferredLanguage: response.data.preferredLanguage,
        totalOrders: response.data.totalOrders || 0,
        branchId: response.data.branchId,
        isActive: response.data.isActive,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };

      // Update all customers list first
      setAllCustomers(prevCustomers => [...prevCustomers, newCustomer]);
      
      // Then update selected customer
      setSelectedCustomer(newCustomer);

      // Clear customer search UI
      setCustomerSearchTerm('');
      setShowNewCustomerForm(false);
      setShowSearchResults(false);

      // Show success message
      enqueueSnackbar(`${newCustomer.name} müşterisi başarıyla oluşturuldu`, { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });

      // Move to next step
      setCurrentStep(3);

      return { newCustomer, allFormValues: watch() };

    } catch (error) {
      console.error('Error adding new customer:', error);
      if (error instanceof Error) {
        if (error.message.includes('Oturum süresi dolmuş')) {
          enqueueSnackbar('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.', { 
            variant: 'error',
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
            action: () => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Giriş Yap
              </Button>
            ),
          });
        } else {
          enqueueSnackbar(error.message, { 
            variant: 'error',
            anchorOrigin: { vertical: 'top', horizontal: 'right' }
          });
        }
      } else {
        enqueueSnackbar('Müşteri eklenirken bir hata oluştu', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
      return undefined;
    } finally {
      setNewCustomerLoading(false);
    }
  };

  // Update the customer search button click handler
  const handleAddCustomerClick = () => {
    setShowNewCustomerForm(true);
  };

  // Sync the search value to the form fields when the form is shown
  useEffect(() => {
    if (showNewCustomerForm) {
      setNewCustomerValue('name', '');
      setNewCustomerValue('phone', '');
      setNewCustomerValue('email', '');
      if (isEmail(customerSearchTerm)) {
        setNewCustomerValue('email', customerSearchTerm, { shouldValidate: true });
      } else if (isPhoneNumber(customerSearchTerm)) {
        setNewCustomerValue('phone', customerSearchTerm, { shouldValidate: true });
      } else if (isName(customerSearchTerm)) {
        setNewCustomerValue('name', customerSearchTerm, { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewCustomerForm]);

  // Step sıralaması
  const steps = [
    { id: 1, name: 'Device', description: 'Device information' },
    { id: 2, name: 'Customer', description: 'Add or select customer' },
    { id: 3, name: 'Service', description: 'Service options' },
    { id: 4, name: 'Payment', description: 'Payment details' },
  ];

  // Helper function to calculate parts total
  const calculatePartsTotal = () => {
    let partsTotal = 0;
    partFields.forEach((field, index) => {
      const partId = watch(`parts.${index}.partId`);
      const quantity = watch(`parts.${index}.quantity`) || 1;
      const part = parts.find(p => p._id === partId);
      if (part) {
        partsTotal += getPartPrice(part) * quantity;
      }
    });
    return partsTotal;
  };

  // Helper function to calculate service fee
  const calculateServiceFee = () => {
    if (isCentral === 'yes') {
      return centralServiceFee;
    } else if (isCentral === 'no') {
      return branchServiceFee;
    }
    return 0;
  };

  // Helper function to calculate central parts cost
  const calculateCentralPartsCost = () => {
    let total = 0;
    partFields.forEach((field, index) => {
      const partId = watch(`parts.${index}.partId`);
      const quantity = watch(`parts.${index}.quantity`) || 1;
      const part = parts.find(p => p._id === partId);
      if (part) {
        total += getPartPrice(part) * quantity;
      }
    });
    return total;
  };

  // Helper function to calculate central service fee
  const calculateCentralServiceFee = () => {
    let total = 0;
    partFields.forEach((field, index) => {
      const partId = watch(`parts.${index}.partId`);
      const part = parts.find(p => p._id === partId);
      if (part) {
        total += getPartServiceFee(part);
      }
    });
    return total;
  };

  // Helper function to calculate total amount to pay to central service
  const calculateTotalCentralPayment = () => {
    return calculateCentralPartsCost() + calculateCentralServiceFee();
  };

  // Add helper functions for total amount calculations
  const calculateCentralCustomerTotal = () => {
    return calculateCentralPartsCost() + calculateCentralServiceFee() + branchServiceFee;
  };

  const calculateBranchCustomerTotal = () => {
    return calculatePartsTotal() + branchProfit + branchServiceFee;
  };

  // Helper function to calculate grand total
  const calculateGrandTotal = () => {
    if (isCentral === 'yes') {
      return calculateCentralCustomerTotal();
    } else {
      return calculateBranchCustomerTotal();
    }
  };

  // Add fetchCustomers function
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }

      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }

      if (!response.ok) {
        throw new Error('Müşteri listesi alınamadı');
      }

      const data = await response.json();
      setAllCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error instanceof Error) {
        if (error.message.includes('Oturum süresi dolmuş')) {
          enqueueSnackbar('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.', { 
            variant: 'error',
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
            action: () => (
              <Button
                color="inherit"
                size="sm"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Giriş Yap
              </Button>
            ),
          });
        } else {
          enqueueSnackbar(error.message, { 
            variant: 'error',
            anchorOrigin: { vertical: 'top', horizontal: 'right' }
          });
        }
      }
    }
  };

  // Add state to track if we're in step 3
  const isStep3 = currentStep === 3;

  // Handle device type change
  const handleDeviceTypeChange = (value: string) => {
    if (isStep3) {
      // In step 3, only update loaned device info
      const selectedDeviceType = deviceTypes.find(dt => dt._id === value);
      if (selectedDeviceType) {
        setValue('loanedDevice', {
          ...watch('loanedDevice'),
          deviceType: selectedDeviceType._id,
          deviceTypeName: selectedDeviceType.name,
          deviceBrand: watch('loanedDevice')?.deviceBrand || '',
          deviceModel: watch('loanedDevice')?.deviceModel || '',
          brandName: watch('loanedDevice')?.brandName || '',
          modelName: watch('loanedDevice')?.modelName || ''
        } as any);
      }
    } else {
      // In other steps, update device type and reset related fields
      setValue('deviceType', value);
      setValue('deviceBrand', '');
      setValue('deviceModel', '');
      setValue('loanedDevice', undefined);
      // Parçaları sıfırlamıyoruz
    }
  };

  // Handle brand change
  const handleBrandChange = (value: string) => {
    if (isStep3) {
      // In step 3, only update loaned device info
      const selectedBrand = brands.find(b => b._id === value);
      if (selectedBrand) {
        setValue('loanedDevice', {
          ...watch('loanedDevice'),
          deviceBrand: selectedBrand._id,
          brandName: selectedBrand.name,
          deviceType: watch('loanedDevice')?.deviceType || '',
          deviceModel: watch('loanedDevice')?.deviceModel || '',
          deviceTypeName: watch('loanedDevice')?.deviceTypeName || '',
          modelName: watch('loanedDevice')?.modelName || ''
        } as any);
      }
    } else {
      // In other steps, update brand and reset model
      setValue('deviceBrand', value);
      setValue('deviceModel', '');
      // Parçaları sıfırlamıyoruz
    }
  };

  // Handle model change
  const handleModelChange = (value: string) => {
    if (isStep3) {
      // In step 3, only update loaned device info
      const selectedModel = models.find(m => m._id === value);
      const selectedBrand = brands.find(b => b._id === watch('loanedDevice')?.deviceBrand);
      const selectedDeviceType = deviceTypes.find(dt => dt._id === watch('loanedDevice')?.deviceType);
      if (selectedModel) {
        setValue('loanedDevice', {
          ...watch('loanedDevice'),
          deviceModel: selectedModel._id,
          modelName: typeof selectedModel.name === 'string' 
            ? selectedModel.name 
            : (selectedModel.name as { tr?: string; en?: string; de?: string }).tr || 
              (selectedModel.name as { tr?: string; en?: string; de?: string }).en || 
              (selectedModel.name as { tr?: string; en?: string; de?: string }).de || 
              'İsimsiz Model',
          brandName: selectedBrand?.name || '',
          deviceTypeName: selectedDeviceType?.name || '',
        } as any);
      }
    } else {
      // In other steps, update model and loaned device info
      const selectedModel = models.find(m => m._id === value);
      const selectedBrand = brands.find(b => b._id === watch('deviceBrand'));
      const selectedDeviceType = deviceTypes.find(dt => dt._id === watch('deviceType'));
      
      if (selectedModel && selectedBrand && selectedDeviceType) {
        setValue('deviceModel', value);
        setValue('loanedDevice', {
          deviceType: selectedDeviceType._id,
          deviceBrand: selectedBrand._id,
          deviceModel: selectedModel._id,
          modelName: typeof selectedModel.name === 'string' 
            ? selectedModel.name 
            : (selectedModel.name as { tr?: string; en?: string; de?: string }).tr || 
              (selectedModel.name as { tr?: string; en?: string; de?: string }).en || 
              (selectedModel.name as { tr?: string; en?: string; de?: string }).de || 
              'İsimsiz Model',
          brandName: selectedBrand.name,
          deviceTypeName: selectedDeviceType.name
        } as any);
        // Parçaları sıfırlamıyoruz
      }
    }
  };

  // State ekle (diğer state'lerin yanına)
  const [isLoanedDeviceGiven, setIsLoanedDeviceGiven] = useState(false);

  // Add state variable after other useState declarations
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // EDIT MODU: depositAmount'ı order verisinden yükle
  useEffect(() => {
    if (mode === 'edit' && order) {
      // Order verisinden deposit amount'ı al
      const depositValue = order.payment?.depositAmount || 
                          order.payment?.paidAmount || 
                          order.depositAmount || 
                          0;
      setDepositAmount(Number(depositValue));
    }
  }, [mode, order]);

  // EDIT MODU: Tüm servis ücreti ve fiyat alanlarını order verisinden yükle
  useEffect(() => {
    if (mode === 'edit' && order) {
      // Central/Branch service belirleme
      if (typeof order.isCentralService === 'boolean') {
        setIsCentral(order.isCentralService ? 'yes' : 'no');
      }

      // Branch service fee
      if (order.branchService?.branchServiceFee !== undefined) {
        setBranchServiceFee(Number(order.branchService.branchServiceFee));
      } else if (order.branchServiceFee !== undefined) {
        setBranchServiceFee(Number(order.branchServiceFee));
      }

      // Central service fee (şube payı için branchServiceFee kullan)
      if (order.branchService?.branchServiceFee !== undefined) {
        setBranchServiceFee(Number(order.branchService.branchServiceFee));
      } else if (order.branchServiceFee !== undefined) {
        setBranchServiceFee(Number(order.branchServiceFee));
      }

      // Branch profit
      if (order.branchService?.branchPartProfit !== undefined) {
        setBranchProfit(Number(order.branchService.branchPartProfit));
      } else if (order.branchPartProfit !== undefined) {
        setBranchProfit(Number(order.branchPartProfit));
      }

      // Central part prices
      if (order.centralService?.partPrices !== undefined) {
        setCentralPartPrices(Number(order.centralService.partPrices));
      } else if (order.centralPartPrices !== undefined) {
        setCentralPartPrices(Number(order.centralPartPrices));
      }

      // Service fee (genel)
      if (order.serviceFee !== undefined) {
        setServiceFee(Number(order.serviceFee));
      }

      // Total central payment
      if (order.totalCentralPayment !== undefined) {
        setTotalCentralPayment(Number(order.totalCentralPayment));
      }

      console.log('Edit mode: loaded order values', {
        isCentralService: order.isCentralService,
        branchServiceFee: order.branchServiceFee || order.branchService?.branchServiceFee,
        branchProfit: order.branchPartProfit || order.branchService?.branchPartProfit,
        centralPartPrices: order.centralPartPrices || order.centralService?.partPrices,
        depositAmount: order.payment?.depositAmount || order.payment?.paidAmount || order.depositAmount || 0
      });
    }
  }, [mode, order]);

  // EDIT MODU: Tüm servis ücreti ve fiyat alanlarını order verisinden yükle
  useEffect(() => {
    if (mode === 'edit' && order) {
      // Central/Branch service belirleme
      if (typeof order.isCentralService === 'boolean') {
        setIsCentral(order.isCentralService ? 'yes' : 'no');
      }

      // Branch service fee
      if (order.branchService?.branchServiceFee !== undefined) {
        setBranchServiceFee(Number(order.branchService.branchServiceFee));
      } else if (order.branchServiceFee !== undefined) {
        setBranchServiceFee(Number(order.branchServiceFee));
      }

      // Central service fee
      if (order.centralService?.serviceFee !== undefined) {
        setCentralServiceFee(Number(order.centralService.serviceFee));
      } else if (order.centralServiceFee !== undefined) {
        setCentralServiceFee(Number(order.centralServiceFee));
      }

      // Branch profit
      if (order.branchService?.branchPartProfit !== undefined) {
        setBranchProfit(Number(order.branchService.branchPartProfit));
      } else if (order.branchPartProfit !== undefined) {
        setBranchProfit(Number(order.branchPartProfit));
      }

      // Central part prices
      if (order.centralService?.partPrices !== undefined) {
        setCentralPartPrices(Number(order.centralService.partPrices));
      } else if (order.centralPartPrices !== undefined) {
        setCentralPartPrices(Number(order.centralPartPrices));
      }

      // Service fee (genel)
      if (order.serviceFee !== undefined) {
        setServiceFee(Number(order.serviceFee));
      }

      // Total central payment
      if (order.totalCentralPayment !== undefined) {
        setTotalCentralPayment(Number(order.totalCentralPayment));
      }

      console.log('Edit mode: loaded order values', {
        isCentralService: order.isCentralService,
        branchServiceFee: order.branchServiceFee || order.branchService?.branchServiceFee,
        centralServiceFee: order.centralServiceFee || order.centralService?.serviceFee,
        branchProfit: order.branchPartProfit || order.branchService?.branchPartProfit,
        centralPartPrices: order.centralPartPrices || order.centralService?.partPrices,
        depositAmount: order.payment?.depositAmount || order.payment?.paidAmount || order.depositAmount || 0
      });
    }
  }, [mode, order]);

  // Add after other calculation functions
  const calculateBranchProfit = () => {
    // Şube kar payı: parça fiyatlarının %20'si
    const partsTotal = calculateCentralPartsCost();
    return Math.round(partsTotal * 0.20);
  };

  const calculateTotalAmount = () => {
    const partsTotal = partFields.reduce((total, part) => {
      const partData = parts.find(p => p._id === part.partId);
      return total + Number(getPartPrice(partData)) * part.quantity;
    }, 0);
    return partsTotal + calculateServiceFee() + calculateBranchProfit();
  };

  // Add with other state variables
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Add state to store total amount from order details
  const [orderTotalAmount, setOrderTotalAmount] = useState<number>(0);

  // Add state to store total amount
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Add state to store total amount
  const [customerTotalAmount, setCustomerTotalAmount] = useState<number>(0);

  // Add useEffect to update total amount when form values change
  useEffect(() => {
    const calculateTotal = () => {
      const partsTotal = partFields.reduce((sum, part) => {
        const partData = parts.find(p => p._id === part.partId);
        return sum + Number(getPartPrice(partData)) * part.quantity;
      }, 0);
      
      const serviceFee = calculateServiceFee();
      const branchProfit = calculateBranchProfit();
      
      setTotalAmount(partsTotal + serviceFee + branchProfit);
    };

    calculateTotal();
  }, [partFields, parts, calculateServiceFee, calculateBranchProfit]);

  // Add useEffect to update total amount
  useEffect(() => {
    const total = isCentral === 'yes' 
      ? calculatePartsTotal() + calculateCentralServiceFee() + centralServiceFee
      : calculatePartsTotal() + branchProfit + branchServiceFee;
    setCustomerTotalAmount(total);
  }, [isCentral, partFields, parts, calculateServiceFee, calculateBranchProfit, branchProfit, branchServiceFee, centralServiceFee]);

  // Helper function to get part service fee safely (branch override first)
  const getPartServiceFee = (part: Part | undefined) => {
    if (!part) return 0;
    if (typeof part.branch_serviceFee === 'number') return part.branch_serviceFee;
    if (typeof part.branch_serviceFee === 'object' && part.branch_serviceFee?.amount) return part.branch_serviceFee.amount;
    if (typeof part.serviceFee === 'number') return part.serviceFee as unknown as number;
    if (typeof part.serviceFee === 'object' && part.serviceFee?.amount) return part.serviceFee.amount;
    return 0;
  };

  // 1. Adımda hesaplanacak değerler için state'ler
  const [centralPartPrices, setCentralPartPrices] = useState(0);
  const [centralPartPayment, setCentralPartPayment] = useState(0);
  const [branchPartProfit, setBranchPartProfit] = useState(0);
  const [totalCentralPayment, setTotalCentralPayment] = useState(0);

  // Seçilen ürün/servis değiştikçe otomatik hesaplama
  useEffect(() => {
    setCentralPartPrices(calculateCentralPartsCost());
    setCentralPartPayment(calculateCentralPartsCost());
    setBranchPartProfit(calculateBranchProfit());
    setTotalCentralPayment(calculateTotalCentralPayment());
  }, [partFields, parts, sendToCentralService]);

  // Add new state lines after existing ones
  const [orderSaved, setOrderSaved] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Order-${savedOrder?.orderNumber || ''}`,
    onBeforeGetContent: () => {
      if (receiptRef.current) {
        receiptRef.current.classList.remove('hidden');
        receiptRef.current.classList.add('print:block');
      }
    },
    onAfterPrint: () => {
      if (receiptRef.current) {
        // Sadece görünürlüğü kapat, print:block sınıfı kalmaya devam etsin
        receiptRef.current.classList.add('hidden');
      }
    },
    pageStyle: `
      @page {
        size: A5 portrait;
        margin: 0;
      }
      @media print {
        body * { visibility: hidden; }
        .receipt-content, .receipt-content * { visibility: visible; }
        .receipt-content {
          position: absolute; left: 0; top: 0; width: 80mm; padding: 10px; margin: 0; background: white;
        }
      }
    `,
  } as any);

  // After helper functions isEmail, isPhoneNumber, isName
  const getDisplayName = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.tr || val.en || val.de || '';
    }
    return String(val);
  };

  // After getDisplayName helper
  const getDisplayNameDe = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.de || val.en || val.tr || '';
    }
    return String(val);
  };

  function findNameByIdDe(arr: any[], id: string | undefined) {
    if (!id) return '';
    const obj = arr.find((o) => o._id === id);
    return obj ? getDisplayNameDe((obj as any).name || obj) : '';
  }

  // Normalize a Mongo ObjectId that may come as string, {_id}, {$oid}, etc.
  const normalizeId = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return val.$oid || val._id || undefined;
    }
    return undefined;
  };

  // Persist main device selections even if form fields get unregistered in later steps
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<{
    deviceTypeId?: string;
    brandId?: string;
    modelId?: string;
    deviceTypeName?: string;
    brandName?: string;
    modelName?: string;
  }>({})
  
  useEffect(() => {
    if (currentStep === 1) {
      const deviceTypeId = watch('deviceType')
      const brandId = watch('deviceBrand')
      const modelId = watch('deviceModel')
      
      setSelectedDeviceIds({
        deviceTypeId: deviceTypeId || undefined,
        brandId: brandId || undefined,
        modelId: modelId || undefined,
        deviceTypeName: findNameByIdDe(deviceTypes, deviceTypeId) || undefined,
        brandName: findNameByIdDe(brands, brandId) || undefined,
        modelName: findNameByIdDe(models, modelId) || undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch('deviceType'), watch('deviceBrand'), watch('deviceModel'), currentStep])

  useEffect(() => {
    if (savedOrder) {
      console.log('Order object for printing:', savedOrder);
    }
  }, [savedOrder]);

  // Parçaları model değişince sıfırla
  useEffect(() => {
    // Eğer model değiştiyse, seçili parçaları ve yüklü parçaları sıfırla
    if (deviceModel) {
      removePart(); // Tüm partFields'ı temizle
      setParts([]); // Parça listesini de temizle
    }
  }, [deviceModel]);

  // 1. Add new state for loaned device selections
  const [loanedDeviceType, setLoanedDeviceType] = useState('');
  const [loanedDeviceBrand, setLoanedDeviceBrand] = useState('');
  const [loanedDeviceModel, setLoanedDeviceModel] = useState('');

  // 2. When 'Evet' is selected for isLoanedDeviceGiven, do not reset or setValue for deviceType/deviceBrand/deviceModel
  // 3. In the loaned device step, use these new states for Select values and onChange
  // 4. When all three are selected, setValue('loanedDevice', { ... })
  // 5. When 'Hayır' is selected, clear the loaned device states and setValue('loanedDevice', undefined)

  // Ödünç cihaz için modelleri yükle
  useEffect(() => {
    if (!loanedDeviceType || !loanedDeviceBrand) {
      return;
    }
    const loadLoanedDeviceModels = async () => {
      try {
        setLoadingDeviceData(true);
        const response = await getModels({ brandId: loanedDeviceBrand });
        if (response.success) {
          // Sadece seçili deviceTypeId ve brandId'ye ait modelleri al
          setModels(
            response.data.filter(
              (model: ApiModel) =>
                model.isActive &&
                model.deviceTypeId === loanedDeviceType &&
                model.brandId === loanedDeviceBrand
            )
          );
        }
      } catch (error) {
        enqueueSnackbar("Error", { variant: "error" });
      } finally {
        setLoadingDeviceData(false);
      }
    };
    loadLoanedDeviceModels();
  }, [loanedDeviceType, loanedDeviceBrand, enqueueSnackbar]);

  // If edit mode and order changes, update form values
  useEffect(() => {
    if (mode === 'edit' && order) {
      reset(order);
      if (order.parts && Array.isArray(order.parts)) {
        replaceParts(order.parts);
      }
    }
  }, [mode, order, reset, replaceParts]);

  // Add this after isCentral state declaration
  useEffect(() => {
    if (mode === 'edit' && order && typeof order.isCentral === 'string') {
      setIsCentral(order.isCentral);
    }
  }, [mode, order]);

  // Add this after selectedCustomer state declaration
  useEffect(() => {
    if (
      mode === 'edit' &&
      order &&
      (order.customerId || order.customerName || order.customerPhone || order.customerEmail)
    ) {
      setSelectedCustomer({
        _id: order.customerId || '',
        name: order.customerName || '',
        phone: order.customerPhone || '',
        email: order.customerEmail || '',
      });
      // Set the search term to the customer's name so that step 2 shows the customer info
      if (order.customerName) {
        setCustomerSearchTerm(order.customerName);
      }
    }
  }, [mode, order]);

  useEffect(() => {
    if (mode === 'edit' && order) {
      // ... existing selectedCustomer logic ...
      // Set loaned device states if present
      if (typeof order.isLoanedDeviceGiven === 'boolean') {
        setIsLoanedDeviceGiven(order.isLoanedDeviceGiven);
      }
      if (order.loanedDevice) {
        const deviceType = order.loanedDevice.deviceType || '';
        const deviceBrand = order.loanedDevice.deviceBrand || '';
        const deviceModel = order.loanedDevice.deviceModel || '';
        
        setLoanedDeviceType(deviceType);
        setLoanedDeviceBrand(deviceBrand);
        setLoanedDeviceModel(deviceModel);
        
        // Edit modda ödünç cihaz modelleri için ayrıca yükleme yap
        if (deviceType && deviceBrand) {
          const loadLoanedDeviceModelsForEdit = async () => {
            try {
              setLoadingDeviceData(true);
              const response = await getModels({ brandId: deviceBrand });
              if (response.success) {
                // Sadece seçili deviceTypeId ve brandId'ye ait modelleri al
                const filteredModels = response.data.filter(
                  (model: ApiModel) =>
                    model.isActive &&
                    model.deviceTypeId === deviceType &&
                    model.brandId === deviceBrand
                );
                // Mevcut models array'ine ödünç cihaz modellerini ekle (duplicate'ları önlemek için)
                setModels(prevModels => {
                  const existingIds = new Set(prevModels.map(m => m._id));
                  const newModels = filteredModels.filter(m => !existingIds.has(m._id));
                  return [...prevModels, ...newModels];
                });
              }
            } catch (error) {
              console.error('Error loading loaned device models for edit:', error);
            } finally {
              setLoadingDeviceData(false);
            }
          };
          loadLoanedDeviceModelsForEdit();
        }
      }
    }
  }, [mode, order]);

  // Sync selectedProducts with partFields
  useEffect(() => {
    const products = partFields.map((field, idx) => {
      const partId = watch(`parts.${idx}.partId`);
      const quantity = watch(`parts.${idx}.quantity`) || 1;
      const part = parts.find(p => p._id === partId);
      return part ? {
        partId,
        productId: partId,
        _id: partId,
        name: getPartName(part),
        quantity,
        price: getPartPrice(part),
      } : null;
    }).filter(Boolean);
    setSelectedProducts(products);
  }, [partFields, parts, watch]);

  // EDIT MODU: Sipariş düzenlenirken mevcut ürün/part listesini selectedProducts'a aktar
  useEffect(() => {
    if (mode === 'edit' && order && Array.isArray(order.items) && order.items.length > 0) {
      setSelectedProducts(order.items.map((item: any) => ({
        partId: item.partId || item.productId || item._id,
        productId: item.partId || item.productId || item._id,
        _id: item.partId || item.productId || item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })));
    }
  }, [mode, order]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Order
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Follow the steps to create a new repair order
          </p>
        </div>
      </div>

      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {step.id}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 1 && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle>Step 1: Device Information</CardTitle>
              <CardDescription>Select device type, brand, and model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Device Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Device Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="deviceType">Device Type</Label>
                  <Controller
                    name="deviceType"
                    control={control}
                    rules={{ required: 'Device type is required' }}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(value) => {
                          const currentValues = watch();
                          setValue('deviceType', value);
                          // Sadece bağımlı alanları sıfırla
                          if (currentValues.deviceBrand) setValue('deviceBrand', '');
                          if (currentValues.deviceModel) setValue('deviceModel', '');
                        }} 
                        value={field.value || ''}
                        disabled={loadingDeviceData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDeviceData ? "Loading..." : "Select device type"} />
                        </SelectTrigger>
                        <SelectContent className="custom-select-content">
                          {deviceTypes.map((dt) => (
                            <SelectItem key={dt._id} value={dt._id} className="custom-select-item">
                              {dt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.deviceType && (
                    <p className="text-sm text-red-600">{errors.deviceType.message}</p>
                  )}
                </div>

                {/* Brand Selection */}
                <div className="space-y-2">
                  <Label htmlFor="deviceBrand">Brand</Label>
                  <Controller
                    name="deviceBrand"
                    control={control}
                    rules={{ required: 'Brand is required' }}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(value) => {
                          const currentValues = watch();
                          setValue('deviceBrand', value);
                          // Sadece model alanını sıfırla
                          if (currentValues.deviceModel) setValue('deviceModel', '');
                        }} 
                        value={field.value || ''}
                        disabled={loadingDeviceData || !deviceType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingDeviceData 
                              ? "Loading..." 
                              : !deviceType 
                                ? "Select device type first" 
                                : "Select brand"
                          } />
                        </SelectTrigger>
                        <SelectContent className="custom-select-content">
                          {brands.map((brand) => (
                            <SelectItem key={brand._id} value={brand._id} className="custom-select-item">
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.deviceBrand && (
                    <p className="text-sm text-red-600">{errors.deviceBrand.message}</p>
                  )}
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label htmlFor="deviceModel">Model</Label>
                  <Controller
                    name="deviceModel"
                    control={control}
                    rules={{ required: 'Model is required' }}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(value) => {
                          setValue('deviceModel', value);
                        }} 
                        value={field.value || ''}
                        disabled={loadingDeviceData || !deviceBrand}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingDeviceData 
                              ? "Loading..." 
                              : !deviceBrand 
                                ? "Select brand first" 
                                : "Select model"
                          } />
                        </SelectTrigger>
                        <SelectContent className="custom-select-content">
                          {models.map((model: ApiModel) => (
                            <SelectItem key={model._id} value={model._id} className="custom-select-item">
                              {typeof model.name === 'string' 
                                ? model.name 
                                : (model.name as { tr?: string; en?: string; de?: string }).tr || 
                                  (model.name as { tr?: string; en?: string; de?: string }).en || 
                                  (model.name as { tr?: string; en?: string; de?: string }).de || 
                                  'Unnamed Model'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.deviceModel && (
                    <p className="text-sm text-red-600">{errors.deviceModel.message}</p>
                  )}
                </div>
              </div>

              {/* Parts Selection - Only show if model is selected */}
              {deviceModel && (
                <div className="space-y-2">
                  <Label>Parçalar</Label>
                  <div className="rounded-md border bg-white dark:bg-slate-900/60">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          <th className="px-3 py-2 text-left font-semibold">Parça</th>
                          <th className="px-3 py-2 text-left font-semibold">Miktar</th>
                          <th className="px-3 py-2 text-left font-semibold">Stok</th>
                          <th className="px-3 py-2 text-left font-semibold">Fiyat</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {partFields.map((item, idx) => {
                          const selectedPartId = watch(`parts.${idx}.partId`);
                          const selectedPart = parts.find(p => p._id === selectedPartId);
                          return (
                            <tr key={item.id} className="border-b last:border-b-0">
                              <td className="px-3 py-2">
                                <Controller
                                  name={`parts.${idx}.partId`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      disabled={loadingParts}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Parça seç" />
                                      </SelectTrigger>
                                      <SelectContent className="custom-select-content">
                                        {parts.map(part => (
                                          <SelectItem key={part._id} value={part._id} className="custom-select-item">
                                            <div className="flex flex-col">
                                              <span className="font-semibold">{getPartName(part)}</span>
                                              <span className="text-xs text-slate-500">
                                                Stok: {getPartStock(part)} | Fiyat: {getPartPrice(part) ? getPartPrice(part) + ' €' : '-'}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  type="number"
                                  min={1}
                                  {...register(`parts.${idx}.quantity` as const, { valueAsNumber: true, min: 1 })}
                                  className="w-20"
                                />
                              </td>
                              <td className="px-3 py-2">
                                {getPartStock(selectedPart)}
                              </td>
                              <td className="px-3 py-2">
                                {getPartPrice(selectedPart) ? `${getPartPrice(selectedPart)} €` : '-'}
                              </td>
                              <td className="px-3 py-2">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removePart(idx)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-4 flex justify-center">
                    <Button type="button" variant="outline" className="rounded-full px-6 py-2 flex items-center gap-2 text-base font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => appendPart({ partId: '', quantity: 1 })}>
                      <Plus className="w-5 h-5" /> Parça Ekle
                    </Button>
                  </div>
                </div>
              )}

              {/* Additional Information - Only show if model is selected */}
              {deviceModel && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="mt-4">
                    <Label className="text-lg font-semibold mb-2 block">Aygıt merkeze gönderilecek mi?</Label>
                    <div className="flex gap-4 mt-2 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          className="form-radio h-4 w-4 text-blue-600" 
                          checked={isCentral === 'yes'} 
                          onChange={() => setIsCentral('yes')} 
                        /> 
                        <span>Evet</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          className="form-radio h-4 w-4 text-blue-600" 
                          checked={isCentral === 'no'} 
                          onChange={() => setIsCentral('no')} 
                        /> 
                        <span>Hayır</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Fee Card - Only show after central/branch selection */}
              {deviceModel && isCentral !== null && (
                <>
                  {isCentral === 'yes' && (
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 mt-4 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white">
                        <CardTitle className="flex items-center gap-2">
                          <Badge className="bg-white text-red-600">Merkez Servis</Badge>
                          <span>Merkez Servis Ücretlendirmesi</span>
                        </CardTitle>
                        <CardDescription className="text-red-50">
                          Aygıt merkez servise gönderilecek.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-red-800">Merkez Parça Fiyatı:</span>
                            <span className="font-medium text-red-800">{calculateCentralPartsCost().toFixed(2)} €</span>
                          </div>
                          {/* Parça Detayları Listesi */}
                          {partFields.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium text-red-700 mb-1">Parçalar:</div>
                              <ul className="space-y-1">
                                {partFields.map((field, index) => {
                                  const partId = watch(`parts.${index}.partId`);
                                  const quantity = watch(`parts.${index}.quantity`) || 1;
                                  const part = parts.find(p => p._id === partId);
                                  if (!part) return null;
                                  const partName = getPartName(part);
                                  const unitPrice = getPartPrice(part);
                                  const totalPrice = unitPrice * quantity;
                                  return (
                                    <li key={field.id} className="flex justify-between text-red-900 text-sm">
                                      <span>{partName} ({quantity} adet)</span>
                                      <span>{unitPrice.toFixed(2)} € x {quantity} = <b>{totalPrice.toFixed(2)} €</b></span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-red-800">Merkez Servis Ücreti:</span>
                            <span className="font-medium text-red-800">
                              {calculateCentralServiceFee().toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-red-200 pt-2">
                            <span className="text-red-800 font-medium">Toplam Merkeze Ödenecek:</span>
                            <span className="font-bold text-red-800">
                              {calculateTotalCentralPayment().toFixed(2)} €
                            </span>
                          </div>

                          <div className="border-t border-red-200 pt-4 mt-4">
                            <Label className="text-red-800">Şube Servis Ücreti (Payınız):</Label>
                            <Select value={branchServiceFee.toString()} onValueChange={v => setBranchServiceFee(Number(v))}>
                              <SelectTrigger className="border-red-200 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="custom-select-content">
                                {priceOptions.map(val => (
                                  <SelectItem key={val} value={val.toString()} className="custom-select-item">{val} €</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="mt-4 p-3 bg-red-100 rounded-md border border-red-200">
                              <div className="flex justify-between items-center">
                                <span className="text-red-800">Merkeze Ödenecek Toplam:</span>
                                <span className="font-medium text-red-800">{calculateTotalCentralPayment().toFixed(2)} €</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-red-800">Şube Servis Ücreti:</span>
                                <span className="font-medium text-red-800">{branchServiceFee.toFixed(2)} €</span>
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-red-200">
                                <span className="font-medium text-red-900">Müşteriye Sunulacak Toplam:</span>
                                <span className="text-xl font-bold text-red-900">{calculateCentralCustomerTotal().toFixed(2)} €</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {isCentral === 'no' && (
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 mt-4 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                        <CardTitle className="flex items-center gap-2">
                          <Badge className="bg-white text-blue-600">Şube Servis</Badge>
                          <span>Şube Servis Ücretlendirmesi</span>
                        </CardTitle>
                        <CardDescription className="text-blue-50">
                          Aygıt şubede tamir edilecek.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-blue-800">Şube Toplam Parçalar için Kar Payı:</Label>
                            <Select value={branchProfit.toString()} onValueChange={v => setBranchProfit(Number(v))}>
                              <SelectTrigger className="border-blue-200 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="custom-select-content">
                                {priceOptions.map(val => (
                                  <SelectItem key={val} value={val.toString()} className="custom-select-item">{val} €</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-blue-800">Şube Servis Ücreti:</Label>
                            <Select value={branchServiceFee.toString()} onValueChange={v => setBranchServiceFee(Number(v))}>
                              <SelectTrigger className="border-blue-200 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="custom-select-content">
                                {priceOptions.map(val => (
                                  <SelectItem key={val} value={val.toString()} className="custom-select-item">{val} €</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-4 p-3 bg-blue-100 rounded-md border border-blue-200">
                            <div className="flex justify-between items-center">
                              <span className="text-blue-800">Parça Fiyatı:</span>
                              <span className="font-medium text-blue-800">{calculatePartsTotal().toFixed(2)} €</span>
                            </div>
                            {/* Parça Detayları Listesi */}
                            {partFields.length > 0 && (
                              <div className="mt-2">
                                <div className="font-medium text-blue-700 mb-1">Parçalar:</div>
                                <ul className="space-y-1">
                                  {partFields.map((field, index) => {
                                    const partId = watch(`parts.${index}.partId`);
                                    const quantity = watch(`parts.${index}.quantity`) || 1;
                                    const part = parts.find(p => p._id === partId);
                                    if (!part) return null;
                                    const partName = getPartName(part);
                                    const unitPrice = getPartPrice(part);
                                    const totalPrice = unitPrice * quantity;
                                    return (
                                      <li key={field.id} className="flex justify-between text-blue-900 text-sm">
                                        <span>{partName} ({quantity} adet)</span>
                                        <span>{unitPrice.toFixed(2)} € x {quantity} = <b>{totalPrice.toFixed(2)} €</b></span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-blue-800">Şube Toplam Parçalar için Kar Payı:</span>
                              <span className="font-medium text-blue-800">{branchProfit.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-blue-800">Merkeze Ödenecek Toplam:</span>
                              <span className="font-medium text-blue-800">{totalCentralPayment.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-blue-800">Şube Servis Ücreti:</span>
                              <span className="font-medium text-blue-800">{branchServiceFee.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                              <span className="font-medium text-blue-900">Müşteriye Sunulacak Toplam:</span>
                              <span className="text-xl font-bold text-blue-900">{calculateBranchCustomerTotal().toFixed(2)} €</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Reset Button and Next Button Container */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                {/* Reset Button - Left Side */}
                {(deviceType || deviceBrand || deviceModel) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setValue('deviceType', '')
                      setValue('deviceBrand', '')
                      setValue('deviceModel', '')
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Reset All Selections
                  </Button>
                )}
                
                {/* Next/Submit Button - Right Side */}
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sipariş Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Özet Kartı */}
            <div className="bg-blue-600 text-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  {isCentral === 'yes' ? 'Merkez Servis Ücretlendirmesi' : 'Şube Servis Ücretlendirmesi'}
                </h3>
                <span className="text-sm text-blue-100">{partFields.length} adet malzeme</span>
              </div>

              {/* Malzeme Listesi */}
              <div className="space-y-1.5 max-h-24 overflow-y-auto mb-3 pr-2">
                {partFields.map((field, index) => {
                  const partId = watch(`parts.${index}.partId`);
                  const quantity = watch(`parts.${index}.quantity`) || 1;
                  const part = parts.find(p => p._id === partId);
                  if (!part) return null;
                  
                  const partName = typeof part.name === 'object' ? part.name.tr || part.name.en || Object.values(part.name)[0] : part.name;
                  const totalPrice = getPartPrice(part) * quantity;
                  
                  return (
                    <div key={field.id} className="flex items-center justify-between text-sm bg-blue-500/50 rounded px-2 py-1">
                      <span className="truncate max-w-[200px]">{partName}</span>
                      <span className="font-medium ml-2">{totalPrice.toFixed(2)} €</span>
                    </div>
                  );
                })}
              </div>

              {/* Toplam Tutarlar */}
              <div className="pt-2 border-t border-blue-500">
                {isCentral === 'yes' ? (
                  // Merkez Servis Ücretlendirmesi
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-100">Parça Fiyatı</span>
                      <span className="font-medium">{calculatePartsTotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-100">Merkez Servis Ücreti</span>
                      <span className="font-medium">{calculateCentralServiceFee().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-100">Şube Servis Ücreti (Payınız)</span>
                      <span className="font-medium">{centralServiceFee.toFixed(2)} €</span>
                    </div>
                    <div className="pt-1.5 mt-1.5 border-t border-blue-500">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Müşteriye Sunulacak Toplam</span>
                        <span className="text-lg font-bold">
                          {calculateCentralCustomerTotal().toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Şube Servis Ücretlendirmesi
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-100">Parça Fiyatı</span>
                      <span className="font-medium">{calculatePartsTotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-100">Merkeze Ödenecek Toplam</span>
                      <span className="font-medium">{totalCentralPayment.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-100">Şube Kar Payı</span>
                      <span className="font-medium">{branchProfit.toFixed(2)} €</span>
                    </div>
                    <div className="pt-1.5 mt-1.5 border-t border-blue-500">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Müşteriye Sunulacak Toplam</span>
                        <span className="text-lg font-bold">
                          {calculateBranchCustomerTotal().toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Müşteri Arama Kartı */}
            <Card className="bg-white/90 dark:bg-slate-800/90">
              <CardHeader>
                <CardTitle>Müşteri Ara</CardTitle>
                <CardDescription>Müşteri adı, telefon veya email ile arama yapın</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Arama Çubuğu */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Müşteri adı, telefon veya email ile arama yapın..."
                      value={customerSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomerSearchTerm(value);
                        
                        if (value.trim()) {
                          let filteredCustomers = allCustomers;
                          
                          if (isEmail(value)) {
                            filteredCustomers = allCustomers.filter(c => 
                              c.email?.toLowerCase().includes(value.toLowerCase())
                            );
                          } else if (isPhoneNumber(value)) {
                            const digitsOnly = value.replace(/\D/g, '');
                            filteredCustomers = allCustomers.filter(c => 
                              c.phone.replace(/\D/g, '').includes(digitsOnly)
                            );
                          } else if (isName(value)) {
                            filteredCustomers = allCustomers.filter(c => 
                              c.name.toLowerCase().includes(value.toLowerCase())
                            );
                          } else {
                            filteredCustomers = allCustomers.filter(c => 
                              c.name.toLowerCase().includes(value.toLowerCase()) ||
                              c.email?.toLowerCase().includes(value.toLowerCase()) ||
                              c.phone.includes(value)
                            );
                          }
                          
                          setCustomerSearchResults(filteredCustomers);
                          setShowSearchResults(true);
                        } else {
                          setCustomerSearchResults([]);
                          setShowSearchResults(false);
                        }
                      }}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Arama Sonuçları veya Ekle Butonu */}
                  {showSearchResults && (
                    <div>
                      {customerSearchResults.length > 0 ? (
                        <div className="space-y-4">
                          {customerSearchResults.map((customer) => (
                            <Card key={customer._id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                              <CardContent className="p-4" onClick={() => handleCustomerSelect(customer)}>
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{customer.name}</span>
                                      <span className="text-slate-500">{getLanguageFlag(customer.preferredLanguage || '')}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                                      <span className="flex items-center">
                                        <Phone className="w-4 h-4 mr-1" />
                                        {customer.phone}
                                      </span>
                                      {customer.email && (
                                        <span className="flex items-center">
                                          <Mail className="w-4 h-4 mr-1" />
                                          {customer.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    Toplam Sipariş: {customer.totalOrders}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={handleAddCustomerClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isEmail(customerSearchTerm) ? 'Bu e-posta ile yeni müşteri ekle' :
                             isPhoneNumber(customerSearchTerm) ? 'Bu telefon numarası ile yeni müşteri ekle' :
                             isName(customerSearchTerm) ? 'Bu isimle yeni müşteri ekle' :
                             'Yeni müşteri ekle'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Update the new customer form section */}
                  {showNewCustomerForm && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Yeni Müşteri Ekle</CardTitle>
                        <CardDescription>
                          {isEmail(customerSearchTerm) ? 'E-posta adresi ile yeni müşteri ekleyin' :
                           isPhoneNumber(customerSearchTerm) ? 'Telefon numarası ile yeni müşteri ekleyin' :
                           isName(customerSearchTerm) ? 'İsim ile yeni müşteri ekleyin' :
                           'Müşteri bilgilerini girin (İsim boş bırakılırsa otomatik oluşturulacak)'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleNewCustomerSubmit(handleNewCustomer)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Müşteri Adı (Opsiyonel)</Label>
                            <Input
                              id="name"
                              {...registerNewCustomer('name', {
                                minLength: { value: 2, message: 'Müşteri adı en az 2 karakter olmalıdır' }
                              })}
                              placeholder="Müşteri adını girin (Boş bırakılabilir)"
                            />
                            {newCustomerErrors.name && (
                              <p className="text-sm text-red-600">{newCustomerErrors.name.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefon (Opsiyonel)</Label>
                            <Input
                              id="phone"
                              {...registerNewCustomer('phone', {
                                pattern: {
                                  value: /^[0-9+\s-()]*$/,
                                  message: 'Geçerli bir telefon numarası girin'
                                }
                              })}
                              placeholder="Telefon numarası girin (Boş bırakılabilir)"
                            />
                            {newCustomerErrors.phone && (
                              <p className="text-sm text-red-600">{newCustomerErrors.phone.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">E-posta (Opsiyonel)</Label>
                            <Input
                              id="email"
                              type="email"
                              {...registerNewCustomer('email', {
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Geçerli bir e-posta adresi girin'
                                }
                              })}
                              placeholder="E-posta adresi girin (Boş bırakılabilir)"
                            />
                            {newCustomerErrors.email && (
                              <p className="text-sm text-red-600">{newCustomerErrors.email.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="address">Adres (Opsiyonel)</Label>
                            <Input 
                              id="address"
                              {...registerNewCustomer('address')}
                              placeholder="Adres girin (Boş bırakılabilir)"
                            />
                            {newCustomerErrors.address && (
                              <p className="text-red-500 text-sm mt-1">{newCustomerErrors.address.message}</p>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              disabled={newCustomerLoading}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={async (e) => {
                                e.preventDefault();
                                await handleNewCustomerSubmit(handleNewCustomer)();
                              }}
                            >
                              {newCustomerLoading ? 'Kaydediliyor...' : 'İleri'}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <>
            {/* Müşteri Bilgileri */}
            {selectedCustomer && (
              <Card className="bg-blue-600 text-white mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Müşteri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-blue-100">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="text-white">{getDisplayName(selectedCustomer?.name)}</span>
                      <span className="text-blue-200">{getLanguageFlag(selectedCustomer?.preferredLanguage || 'TR')}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-white">
                        <Phone className="w-4 h-4 mr-1" />
                        {selectedCustomer.phone}
                      </span>
                      {selectedCustomer.email && (
                        <span className="flex items-center text-white">
                          <Mail className="w-4 h-4 mr-1" />
                          {selectedCustomer.email}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sipariş Detayları */}
            <Card className="bg-blue-600 text-white mb-6">
              <CardHeader>
                <CardTitle className="text-white">Sipariş Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-500/30 text-white rounded-lg p-4 border border-blue-400/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        {isCentral === 'yes' ? 'Merkez Servis Ücretlendirmesi' : 'Şube Servis Ücretlendirmesi'}
                      </h3>
                      <span className="text-sm text-blue-100">{partFields.length} adet malzeme</span>
                    </div>
                    {/* Malzeme Listesi */}
                    <div className="space-y-1.5 max-h-24 overflow-y-auto mb-3 pr-2">
                      {partFields.map((field, index) => {
                        const partId = watch(`parts.${index}.partId`);
                        const quantity = watch(`parts.${index}.quantity`) || 1;
                        const part = parts.find(p => p._id === partId);
                        if (!part) return null;
                        const partName = getDisplayName(part.name);
                        const totalPrice = getPartPrice(part) * quantity;
                        return (
                          <div key={field.id} className="flex items-center justify-between text-sm bg-blue-400/50 rounded px-2 py-1">
                            <span className="truncate max-w-[200px] text-white">{partName}</span>
                            <span className="font-medium ml-2 text-white">{totalPrice.toFixed(2)} €</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Toplam Tutarlar */}
                    <div className="pt-2 border-t border-blue-400/30">
                      {isCentral === 'yes' ? (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-100">Parça Fiyatı</span>
                            <span className="font-medium text-white">{calculatePartsTotal().toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-100">Merkez Servis Ücreti</span>
                            <span className="font-medium text-white">{calculateCentralServiceFee().toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-100">Şube Servis Ücreti (Payınız)</span>
                            <span className="font-medium text-white">{centralServiceFee.toFixed(2)} €</span>
                          </div>
                          <div className="pt-1.5 mt-1.5 border-t border-blue-400/30">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-white">Müşteriye Sunulacak Toplam</span>
                              <span className="text-lg font-bold text-white">
                                {calculateCentralCustomerTotal().toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-100">Parça Fiyatı</span>
                            <span className="font-medium text-white">{calculatePartsTotal().toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-100">Merkeze Ödenecek Toplam</span>
                            <span className="font-medium text-white">{totalCentralPayment.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-100">Şube Kar Payı</span>
                            <span className="font-medium text-white">{branchProfit.toFixed(2)} €</span>
                          </div>
                          <div className="pt-1.5 mt-1.5 border-t border-blue-400/30">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-white">Müşteriye Sunulacak Toplam</span>
                              <span className="text-lg font-bold text-white">
                                {calculateBranchCustomerTotal().toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ödünç Cihaz Sorusu */}
            <div className="mb-4">
              <Label className="text-base font-medium text-slate-900">Ödünç Cihaz Alındı mı?</Label>
              <div className="flex gap-4 mt-2 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-900">
                  <input 
                    type="radio" 
                    className="form-radio h-4 w-4 text-blue-600 border-slate-400" 
                    checked={isLoanedDeviceGiven} 
                    onChange={() => setIsLoanedDeviceGiven(true)} 
                  /> 
                  <span>Evet</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-slate-900">
                  <input 
                    type="radio" 
                    className="form-radio h-4 w-4 text-blue-600 border-slate-400" 
                    checked={!isLoanedDeviceGiven} 
                    onChange={() => {
                      setIsLoanedDeviceGiven(false);
                      setLoanedDeviceType('');
                      setLoanedDeviceBrand('');
                      setLoanedDeviceModel('');
                      setValue('loanedDevice', undefined);
                    }} 
                  /> 
                  <span>Hayır</span>
                </label>
              </div>
            </div>

            {/* Ödünç Cihaz Bilgileri Kartı */}
            {isLoanedDeviceGiven && (
              <Card className="bg-blue-600 text-white mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Ödünç Cihaz Bilgileri</CardTitle>
                  <CardDescription className="text-blue-100">Ödünç verilecek cihazın tip, marka ve modelini seçin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Device Type Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="loanedDeviceType">Cihaz Tipi</Label>
                      <Select
                        onValueChange={(value) => {
                          setLoanedDeviceType(value);
                          setLoanedDeviceBrand('');
                          setLoanedDeviceModel('');
                          setValue('loanedDevice', undefined);
                        }}
                        value={loanedDeviceType}
                        disabled={loadingDeviceData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDeviceData ? "Yükleniyor..." : "Cihaz tipi seçin"} />
                        </SelectTrigger>
                        <SelectContent className="custom-select-content">
                          {deviceTypes.map((dt) => (
                            <SelectItem key={dt._id} value={dt._id} className="custom-select-item">
                              {dt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Brand Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="loanedDeviceBrand">Marka</Label>
                      <Select
                        onValueChange={(value) => {
                          setLoanedDeviceBrand(value);
                          setLoanedDeviceModel('');
                          setValue('loanedDevice', undefined);
                        }}
                        value={loanedDeviceBrand}
                        disabled={loadingDeviceData || !loanedDeviceType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDeviceData ? "Yükleniyor..." : !loanedDeviceType ? "Önce cihaz tipi seçin" : "Marka seçin"} />
                        </SelectTrigger>
                        <SelectContent className="custom-select-content">
                          {brands
                            .filter(brand => brand.deviceTypeId === loanedDeviceType)
                            .map((brand) => (
                              <SelectItem key={brand._id} value={brand._id} className="custom-select-item">
                                {brand.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="loanedDeviceModel">Model</Label>
                      <Select
                        onValueChange={(value) => {
                          setLoanedDeviceModel(value);
                          const selectedDeviceType = deviceTypes.find(dt => dt._id === loanedDeviceType);
                          const selectedBrand = brands.find(b => b._id === loanedDeviceBrand);
                          const selectedModel = models.find(m => m._id === value);
                          if (selectedDeviceType && selectedBrand && selectedModel) {
                            setValue('loanedDevice', {
                              deviceType: selectedDeviceType._id,
                              deviceBrand: selectedBrand._id,
                              deviceModel: selectedModel._id,
                              deviceTypeName: selectedDeviceType.name,
                              brandName: selectedBrand.name,
                              modelName: typeof selectedModel.name === 'string'
                                ? selectedModel.name
                                : (selectedModel.name as { tr?: string; en?: string; de?: string }).tr ||
                                  (selectedModel.name as { tr?: string; en?: string; de?: string }).en ||
                                  (selectedModel.name as { tr?: string; en?: string; de?: string }).de ||
                                  'İsimsiz Model',
                            });
                          } else {
                            setValue('loanedDevice', undefined);
                          }
                        }}
                        value={loanedDeviceModel}
                        disabled={loadingDeviceData || !loanedDeviceBrand}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDeviceData ? "Yükleniyor..." : !loanedDeviceBrand ? "Önce marka seçin" : "Model seçin"} />
                        </SelectTrigger>
                        <SelectContent className="custom-select-content">
                          {models
                            .filter(model => model.deviceTypeId === loanedDeviceType && model.brandId === loanedDeviceBrand)
                            .map((model) => (
                              <SelectItem key={model._id} value={model._id} className="custom-select-item">
                                {typeof model.name === 'string'
                                  ? model.name
                                  : (model.name as { tr?: string; en?: string; de?: string }).tr ||
                                    (model.name as { tr?: string; en?: string; de?: string }).en ||
                                    (model.name as { tr?: string; en?: string; de?: string }).de ||
                                    'İsimsiz Model'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Show loaned device info when all selections are made */}
                  {loanedDeviceType && loanedDeviceBrand && loanedDeviceModel && watch('loanedDevice') && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Seçilen Ödünç Cihaz Bilgileri</h4>
                      <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                        <p><span className="font-medium">Cihaz Tipi:</span> {watch('loanedDevice')?.deviceTypeName}</p>
                        <p><span className="font-medium">Marka:</span> {watch('loanedDevice')?.brandName}</p>
                        <p><span className="font-medium">Model:</span> {watch('loanedDevice')?.modelName}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Next Button */}
            <div className="flex justify-end mt-6">
              <Button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Ödeme Adımına Geç
              </Button>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            {/* Ödeme Bilgileri */}
            <Card className="bg-blue-600 border-blue-500">
              <CardHeader>
                <CardTitle className="text-white">Ödeme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Alınan Deposit Miktarı</Label>
                    <Select
                      value={depositAmount.toString()}
                      onValueChange={(value) => setDepositAmount(Number(value))}
                      defaultValue="0"
                    >
                      <SelectTrigger className="bg-blue-500/30 border-blue-400/30 text-white">
                        <SelectValue placeholder="Deposit miktarı seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {[0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((amount) => (
                          <SelectItem 
                            key={amount} 
                            value={amount.toString()}
                            className="text-gray-900 hover:bg-gray-100"
                          >
                            {amount === 0 ? "Deposit Alınmadı" : `${amount} Euro`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-500/30 rounded-lg p-4 border border-blue-400/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Müşteriye Sunulacak Toplam:</span>
                      <span className="text-white font-medium">
                        {isCentral === 'yes' 
                          ? calculateCentralCustomerTotal().toFixed(2)
                          : calculateBranchCustomerTotal().toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-400/30">
                      <span className="text-blue-100">Alınan Deposit:</span>
                      <span className="text-white font-medium">{depositAmount.toFixed(2)} €</span>
                    </div>
                    {depositAmount > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-blue-400/30">
                        <span className="text-blue-100 font-medium">Kalan Ödenecek Miktar:</span>
                        <span className="text-white font-medium">
                          {(
                            (isCentral === 'yes'
                              ? calculateCentralCustomerTotal()
                              : calculateBranchCustomerTotal()
                            ) - depositAmount
                          ).toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-white text-blue-600 hover:bg-white/90"
                      disabled={orderSaved || isSubmitting}
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          setIsSubmitting(true);
                          
                          const totalAmount = isCentral === 'yes' 
                            ? calculateCentralCustomerTotal()
                            : calculateBranchCustomerTotal();
                          
                          // cihazın nerede servis göreceğine dair boolean önce tanımlanmalı
                          const isCentralServiceOrder = isCentral === 'yes';

                          // Prepare order data
                          const orderData = {
                            customerId: selectedCustomer?._id,
                            device: {
                              type: selectedDeviceIds.deviceTypeId || watch('deviceType'),
                              brand: selectedDeviceIds.brandId || watch('deviceBrand'),
                              model: selectedDeviceIds.modelId || watch('deviceModel'),
                              serialNumber: watch('serialNumber') || undefined,
                              condition: watch('deviceCondition') || undefined,
                              names: {
                                deviceType: selectedDeviceIds.deviceTypeName || '',
                                brand: selectedDeviceIds.brandName || '',
                                model: selectedDeviceIds.modelName || '',
                              },
                            },
                            loanedDevice: isLoanedDeviceGiven ? {
                              deviceTypeId: watch('loanedDevice')?.deviceType,
                              brandId: watch('loanedDevice')?.deviceBrand,
                              modelId: watch('loanedDevice')?.deviceModel,
                              names: {
                                deviceType: watch('loanedDevice')?.deviceTypeName || '',
                                brand: watch('loanedDevice')?.brandName || '',
                                model: watch('loanedDevice')?.modelName || ''
                              }
                            } : null,
                            isLoanedDeviceGiven,
                            serviceType: isCentralServiceOrder ? 'central_service' : 'branch_service',
                            description: (watch('faultDescription') || 'Repair order').trim(),
                            products: partFields.map((field, idx) => {
                              const pid = watch(`parts.${idx}.partId`);
                              const qty = watch(`parts.${idx}.quantity`) || 1;
                              const partInfo = parts.find(p => p._id === pid);
                              return {
                                productId: pid,
                                name: partInfo ? getPartName(partInfo) : '',
                                quantity: qty,
                                price: getPartPrice(partInfo)
                              };
                            }).filter(p => p.productId),
                            labor: { total: calculateServiceFee() },
                            estimatedCompletion: watch('estimatedCompletion') || undefined,
                            priority: 'standard',
                            payment: {
                              method: 'cash', // adjust if payment method collected elsewhere
                              amount: totalAmount,
                              depositAmount: depositAmount
                            },
                            depositAmount,
                            // merkez/şube bilgileri
                            isCentralService: isCentralServiceOrder,
                            centralPartPrices:  isCentralServiceOrder ? calculateCentralPartsCost() : undefined,
                            centralServiceFee:  isCentralServiceOrder ? calculateCentralServiceFee() : undefined,
                            branchServiceFee:   branchServiceFee,
                            centralPartPayment: !isCentralServiceOrder ? calculateCentralPartsCost() : undefined,
                            branchPartProfit:   !isCentralServiceOrder ? branchProfit : undefined,
                            totalCentralPayment: totalCentralPayment,
                            branchSnapshot: branch
                          };

                          // Save order to database - Edit veya Create moduna göre
                          let response;
                          if (mode === 'edit' && orderId) {
                            // Edit modda PUT endpoint kullan
                            response = await updateOrder(orderId, orderData);
                          } else {
                            // Create modda POST endpoint kullan
                            response = await createOrder(orderData);
                            
                            // Order successfully created - sadece create modda customer'a order ekle
                            if (response?.order?._id) {
                              const customerIdSafe = selectedCustomer?._id;
                              if (response?.order?._id && customerIdSafe) {
                                await addOrderToCustomer(customerIdSafe as string, {
                                  orderId: response.order._id,
                                  orderNumber: response.order.orderNumber,
                                  barcode: response.order.barcode,
                                  orderDetails: orderData
                                });
                              }
                            }
                          }

                          if (response.success) {
                            const fullOrder = {
                              ...response.order,
                              // merge names from orderData so they are always present for the receipt
                              device: {
                                ...response.order.device,
                                names: orderData.device.names,
                              },
                              loanedDevice: orderData.loanedDevice
                                ? {
                                    ...response.order.loanedDevice,
                                    names: orderData.loanedDevice.names,
                                  }
                                : null,
                              isLoanedDeviceGiven: orderData.isLoanedDeviceGiven,
                              branchSnapshot: branch,
                            } as any;
                            setSavedOrder(fullOrder);
                            setOrderSaved(true);
                            enqueueSnackbar(mode === 'edit' ? 'Sipariş başarıyla güncellendi' : 'Sipariş başarıyla oluşturuldu', { variant: 'success' });
                          } else {
                            throw new Error(response.error || (mode === 'edit' ? 'Sipariş güncellenirken bir hata oluştu' : 'Sipariş oluşturulurken bir hata oluştu'));
                          }
                        } catch (error) {
                          console.error('Sipariş oluşturma hatası:', error);
                          enqueueSnackbar(error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu', { 
                            variant: 'error' 
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {mode === 'edit' ? 'Sipariş Güncelleniyor...' : 'Sipariş Oluşturuluyor...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {mode === 'edit' ? 'Siparişi Güncelle' : 'Siparişi Tamamla'}
                        </>
                      )}
                    </Button>
                    {orderSaved && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 bg-white text-blue-600 hover:bg-white/90"
                        onClick={handlePrint}
                      >
                        <Printer className="w-4 h-4" />
                        Yazdır
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </form>
      {savedOrder && (
        <div
          ref={receiptRef}
          className="receipt-content hidden print:block bg-white"
          style={{ 
            width: '210mm', 
            height: '297mm', // A4 yüksekliği
            padding: '10mm', 
            margin: 0, 
            background: 'white',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          {/* DEBUG: branch ve branchAddressLines */}
          {(() => {
            console.log('PDF DEBUG branch:', branch);
            console.log('PDF DEBUG branchAddressLines:', branchAddressLines);
            return null;
          })()}
          <div className="space-y-4" style={{paddingBottom: branchAddressLines.length > 0 ? '40mm' : undefined}}>
            <div className="border-b pb-2">
              <div className="flex justify-between items-start">
                {/* Logo */}
                <img src={`${window.location.origin}/brands/smartpunkt.jpg`} alt="Smart Punkt GmbH" className="h-20 w-20 object-contain" />

                {/* Center titles */}
                <div className="flex-1 text-center">
                  <p className="font-semibold">Smart Punkt GmbH</p>
                  <h2 className="text-lg font-bold">Reparaturauftragsbeleg</h2>
                  <p className="text-sm">
                    Auftragsdatum: {new Date(savedOrder.createdAt || Date.now()).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} , Auftragsnummer: {savedOrder.orderNumber}
                  </p>
                </div>

                {/* QR code with order number */}
                <QRCodeSVG value={`${savedOrder.orderNumber}`} size={80} />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {/* Kunde */}
              <div className="border-b pb-1">
                <p className="font-semibold">Kunde</p>
                <p>{getDisplayNameDe(selectedCustomer?.name)}</p>
                <p>{selectedCustomer?.phone}</p>
                {selectedCustomer?.email && <p>{selectedCustomer.email}</p>}
              </div>
              {/* Bestellung Teile */}
              <div className="border-b pb-1">
                <p className="font-semibold">Bestellung Teile</p>
                {(() => {
                  const dt = getDisplayNameDe(savedOrder.device?.names?.deviceType) || findNameByIdDe(deviceTypes, normalizeId(savedOrder.device?.deviceTypeId));
                  const br = getDisplayNameDe(savedOrder.device?.names?.brand)        || findNameByIdDe(brands,      normalizeId(savedOrder.device?.brandId));
                  const md = getDisplayNameDe(savedOrder.device?.names?.model)       || findNameByIdDe(models,      normalizeId(savedOrder.device?.modelId));

                  const parts: string[] = [];
                  if (dt) parts.push(dt);
                  if (br) parts.push(br);
                  if (md) parts.push(md);

                  return <p>{parts.length ? parts.join(' / ') : '-'}</p>;
                })()}
                {partFields.map((field, idx) => {
                  const pid = watch(`parts.${idx}.partId`);
                  const qty = watch(`parts.${idx}.quantity`) || 1;
                  const partInfo = parts.find(p => p._id === pid);
                  const name = getDisplayNameDe(partInfo?.name);
                  return <p key={idx}>• {name} x{qty}</p>;
                })}
              </div>
              {/* Zahlung */}
              <div className="border-b pb-1">
                <p className="font-semibold">Zahlung</p>
                <p>Bezahlt: {depositAmount.toFixed(2)} €</p>
                <p>Restbetrag: {( (isCentral==='yes'? calculateCentralCustomerTotal(): calculateBranchCustomerTotal()) - depositAmount).toFixed(2)} €</p>
              </div>
              {savedOrder.isLoanedDeviceGiven && (
                <div className="border-b pb-1">
                  <p className="font-semibold">Leihgerät</p>
                  {(() => {
                    const dt = getDisplayNameDe(savedOrder.loanedDevice?.names?.deviceType) || findNameByIdDe(deviceTypes, normalizeId(savedOrder.loanedDevice?.deviceTypeId));
                    const br = getDisplayNameDe(savedOrder.loanedDevice?.names?.brand)        || findNameByIdDe(brands,      normalizeId(savedOrder.loanedDevice?.brandId));
                    const md = getDisplayNameDe(savedOrder.loanedDevice?.names?.model)       || findNameByIdDe(models,      normalizeId(savedOrder.loanedDevice?.modelId));

                    const parts: string[] = [];
                    if (dt) parts.push(dt);
                    if (br) parts.push(br);
                    if (md) parts.push(md);

                    return <p>{parts.length ? parts.join(' / ') : '-'}</p>;
                  })()}
                </div>
              )}
            </div>
          </div>
          {/* Company address footer (dynamic, always at bottom) */}
          {branchAddressLines.length > 0 && (
            <div
              className="pt-2 text-center text-xs border-t"
              style={{
                position: 'absolute',
                bottom: '10mm',
                left: 0,
                width: 'calc(100% - 20mm)', // padding'i hesaba kat
                background: 'white',
                paddingTop: '4mm'
              }}
            >
              {branchAddressLines.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}