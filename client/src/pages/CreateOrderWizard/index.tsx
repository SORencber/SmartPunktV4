import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { getOrderById } from '@/api/orders';
import { getDeviceTypes } from '@/api/deviceTypes';
import { getBrands } from '@/api/brands';
import { getModels } from '@/api/models';
import { getParts } from '@/api/parts';
import { getCustomers } from '@/api/customers';
import { createOrder, updateOrder } from '@/api/orders';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DeviceStep from './DeviceStep';
import CustomerStep from './CustomerStep';
import ServiceStep from './ServiceStep';
import PaymentStep from './PaymentStep';

// Step definitions with icons and descriptions
const steps = [
  { 
    id: 1, 
    name: 'Cihaz', 
    description: 'Cihaz ve parça seçimi',
    Component: DeviceStep 
  },
  { 
    id: 2, 
    name: 'Müşteri', 
    description: 'Müşteri bilgileri',
    Component: CustomerStep 
  },
  { 
    id: 3, 
    name: 'Servis', 
    description: 'Servis detayları',
    Component: ServiceStep 
  },
  { 
    id: 4, 
    name: 'Ödeme', 
    description: 'Ödeme bilgileri',
    Component: PaymentStep 
  }
];

interface WizardProps {
  mode?: 'create' | 'edit';
  orderId?: string;
  onDone?: () => void;
}

export default function CreateOrderWizard({ mode = 'create', orderId, onDone }: WizardProps) {
  const methods = useForm<any>({
    defaultValues: {
      parts: [],
      deviceType: '',
      deviceBrand: '',
      deviceModel: '',
      serialNumber: '',
      deviceCondition: '',
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      loanedDevice: undefined,
      selectedParts: []
    },
    mode: 'onChange'
  });
  const { control, watch, setValue, getValues } = methods;
  const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({ control, name: 'parts' });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<any[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loadingDeviceData, setLoadingDeviceData] = useState(false);
  const [isCentral, setIsCentral] = useState<'yes' | 'no' | null>(null);
  const [branchServiceFee, setBranchServiceFee] = useState<number>(20);
  const [centralServiceFee, setCentralServiceFee] = useState<number>(20);
  const [branchProfit, setBranchProfit] = useState<number>(20);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any|null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Load order in edit mode
  useEffect(() => {
    const loadOrder = async () => {
      if (mode === 'edit' && orderId) {
        try {
          setLoading(true);
          const response = await getOrderById(orderId);
          if (response.success && response.order) {
            const defaults: any = {
              customerId: response.order.customerId?._id || response.order.customerId || '',
              deviceType: response.order.device?.deviceTypeId || response.order.device?.type || '',
              deviceBrand: response.order.device?.brandId || response.order.device?.brand || '',
              deviceModel: response.order.device?.modelId || response.order.device?.model || '',
              serialNumber: response.order.device?.serialNumber || '',
              deviceCondition: response.order.device?.condition || '',
              parts: (response.order.items || []).map((p: any) => ({ 
                partId: p.partId || p.productId, 
                quantity: p.quantity 
              })),
            };
            methods.reset(defaults);
          }
        } catch (err) {
          console.error('Error loading order', err);
          setFormErrors(['Sipariş yüklenirken bir hata oluştu.']);
        } finally {
          setLoading(false);
        }
      }
    };
    loadOrder();
  }, [mode, orderId]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingDeviceData(true);
        const [deviceTypesRes, customersRes] = await Promise.all([
          getDeviceTypes(),
          getCustomers({ limit: 100 })
        ]);
        
        if (deviceTypesRes.success) setDeviceTypes(deviceTypesRes.data);
        if (customersRes.success) setAllCustomers(customersRes.data);
      } catch (err) {
        console.error('Failed to load initial data', err);
        setFormErrors(['Başlangıç verileri yüklenirken bir hata oluştu.']);
      } finally {
        setLoadingDeviceData(false);
      }
    };
    loadInitialData();
  }, []);

  const loadBrands = async (deviceTypeId: string) => {
    try {
      setLoadingDeviceData(true);
      const res = await getBrands({ deviceTypeId });
      if (res.success) setBrands(res.data);
    } catch (err) {
      console.error('Failed to load brands', err);
    } finally {
      setLoadingDeviceData(false);
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      setLoadingDeviceData(true);
      const res = await getModels({ brandId });
      if (res.success) setModels(res.data);
    } catch (err) {
      console.error('Failed to load models', err);
    } finally {
      setLoadingDeviceData(false);
    }
  };

  const loadPartsForModel = async (modelId: string) => {
    try {
      setLoadingParts(true);
      const res = await getParts();
      if (res.success) {
        const filtered = res.data.filter((p: any) => {
          const mId = typeof p.modelId === 'object' ? p.modelId._id : p.modelId;
          return mId === modelId && p.isActive;
        });
        setParts(filtered);
      }
    } catch (err) {
      console.error('Failed to load parts', err);
    } finally {
      setLoadingParts(false);
    }
  };

  // Persist form data between steps
  const handleStepChange = (direction: 'next' | 'prev') => {
    const currentValues = getValues();
    
    // Save current form state
    methods.reset(currentValues, { 
      keepDefaultValues: true,
      keepDirty: true,
      keepTouched: true,
      keepIsValid: true,
      keepErrors: true
    });

    // Update step
    setCurrentStep(current => {
      if (direction === 'next') {
        return Math.min(current + 1, steps.length - 1);
      } else {
        return Math.max(current - 1, 0);
      }
    });
  };

  const next = () => handleStepChange('next');
  const prev = () => handleStepChange('prev');

  const StepComponent = steps[currentStep].Component;

  const shared = {
    deviceTypes, brands, models, parts, loadingDeviceData, loadingParts,
    loadBrands, loadModels, loadPartsForModel,
    partFields, appendPart, removePart, watch, setValue,
    isCentral, setIsCentral, branchServiceFee, setBranchServiceFee, 
    centralServiceFee, setCentralServiceFee, branchProfit, setBranchProfit,
    allCustomers, customersLoading, selectedCustomer, setSelectedCustomer
  } as any;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        {/* Stepper */}
        <Card className="border-slate-200/50 bg-white/70 backdrop-blur-xl">
          <CardContent className="pt-6">
            <nav aria-label="Progress">
              <ol role="list" className="flex items-center">
                {steps.map((step, index) => (
                  <li key={step.id} className={`relative ${index === steps.length - 1 ? 'flex-1' : 'flex-1'}`}>
                    {currentStep > index ? (
                      <div className="group">
                        <span className="flex items-center">
                          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 group-hover:bg-blue-800">
                            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="ml-4 text-sm font-medium text-slate-900">{step.name}</span>
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5 ml-14 block">{step.description}</span>
                      </div>
                    ) : currentStep === index ? (
                      <div className="group" aria-current="step">
                        <span className="flex items-center">
                          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          </span>
                          <span className="ml-4 text-sm font-medium text-blue-600">{step.name}</span>
                        </span>
                        <span className="text-xs text-blue-600 mt-0.5 ml-14 block">{step.description}</span>
                      </div>
                    ) : (
                      <div className="group">
                        <span className="flex items-center">
                          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white group-hover:border-slate-400">
                            <span className="text-slate-500 text-sm">{step.id}</span>
                          </span>
                          <span className="ml-4 text-sm font-medium text-slate-500 group-hover:text-slate-600">{step.name}</span>
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 ml-14 block">{step.description}</span>
                      </div>
                    )}

                    {index !== steps.length - 1 && (
                      <div className={`absolute left-20 top-5 -ml-px mt-0.5 h-0.5 w-full ${
                        currentStep > index ? 'bg-blue-600' : 'bg-slate-300'
                      }`} />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </CardContent>
        </Card>

        {/* Error Messages */}
        {formErrors.length > 0 && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Aşağıdaki hataları düzeltin:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul role="list" className="list-disc list-inside">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-lg border border-slate-200/50 shadow-sm">
          <div className="p-6">
            <StepComponent next={next} prev={prev} {...shared} />
          </div>
        </div>

        {/* Order Summary (after save) */}
        {orderSaved && savedOrder && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Sipariş Başarıyla Oluşturuldu</h3>
                  <p className="text-sm text-green-700">Sipariş No: {savedOrder.orderNumber || savedOrder._id}</p>
                </div>
                <QRCodeSVG value={`${savedOrder.orderNumber||savedOrder._id}`} size={64} />
              </div>
              
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="space-y-4">
                  {/* Device Info */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Cihaz Bilgileri</h4>
                    <div className="mt-2 text-sm text-slate-500">
                      <p>Tür: {savedOrder.device?.deviceTypeName}</p>
                      <p>Marka: {savedOrder.device?.brandName}</p>
                      <p>Model: {savedOrder.device?.modelName}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Müşteri Bilgileri</h4>
                    <div className="mt-2 text-sm text-slate-500">
                      <p>{savedOrder.customerId?.name}</p>
                      <p>{savedOrder.customerId?.phone}</p>
                      {savedOrder.customerId?.email && <p>{savedOrder.customerId.email}</p>}
                    </div>
                  </div>

                  {/* Service Info */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">Servis Bilgileri</h4>
                    <div className="mt-2 text-sm text-slate-500">
                      <p>Servis Tipi: {savedOrder.isCentralService ? 'Merkez Servis' : 'Şube Servis'}</p>
                      <p>Toplam Tutar: {savedOrder.totalAmount?.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                >
                  Yazdır
                </Button>
                {onDone && (
                  <Button 
                    variant="default"
                    onClick={onDone}
                  >
                    Tamam
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FormProvider>
  );
}