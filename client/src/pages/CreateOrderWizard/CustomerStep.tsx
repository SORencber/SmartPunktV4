import React, { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { createCustomer, type CreateCustomerData } from '@/api/customers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, User, Phone, Mail, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CustomerStepProps {
  next(): void;
  prev(): void;
  allCustomers: any[];
  customersLoading: boolean;
  selectedCustomer: any | null;
  setSelectedCustomer: (c: any) => void;
}

export default function CustomerStep({ next, prev, allCustomers, customersLoading, selectedCustomer, setSelectedCustomer }: CustomerStepProps) {
  const { register, setValue, getValues, formState } = useFormContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const isEmail = (s: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(s);
  const isPhone = (s: string) => /[0-9]{10,11}/.test(s.replace(/\D/g, ''));

  const filtered = useMemo(() => {
    if (!searchTerm) return [];
    return allCustomers.filter((c) => {
      if (isEmail(searchTerm)) return c.email?.toLowerCase().includes(searchTerm.toLowerCase());
      if (isPhone(searchTerm)) return c.phone.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''));
      return c.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, allCustomers]);

  const handleSelect = (c: any) => {
    setSelectedCustomer(c);
    setValue('customerId', c._id);
    setValue('customerName', c.name);
    setValue('customerPhone', c.phone);
    setValue('customerEmail', c.email);
    setShowResults(false);
    setSearchTerm('');
  };

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      setError('İsim ve telefon numarası zorunludur.');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const payload: CreateCustomerData = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
        preferredLanguage: 'TR',
        isActive: true,
        address: '',
        branchId: '', // Backend will override this with user's branch
        createdBy: {
          id: 'self', // Backend will override this with user's info
          email: undefined,
          fullName: undefined
        }
      };
      
      const res = await createCustomer(payload);
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        setValue('customerId', res.data._id);
        setValue('customerName', res.data.name);
        setValue('customerPhone', res.data.phone);
        setValue('customerEmail', res.data.email);
        setShowNewCustomerForm(false);
        next();
      } else {
        throw new Error(res.message || 'Müşteri oluşturulurken bir hata oluştu');
      }
    } catch (err: any) {
      console.error('Create customer error:', err);
      setError(err?.message || 'Müşteri eklenirken bir hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Müşteri Ara</CardTitle>
          <CardDescription>İsim, telefon numarası veya e-posta ile arama yapabilirsiniz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
                setShowNewCustomerForm(false);
              }}
            />
          </div>

          {customersLoading ? (
            <div className="mt-4 flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
            </div>
          ) : showResults && searchTerm && (
            <div className="mt-4">
              {filtered.length > 0 ? (
                <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
                  {filtered.map((c) => (
                    <button
                      key={c._id}
                      className="w-full px-4 py-3 flex items-start hover:bg-slate-50 transition-colors text-left"
                      onClick={() => handleSelect(c)}
                    >
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-slate-900">{c.name}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="flex items-center text-sm text-slate-500">
                            <Phone className="h-4 w-4 mr-1" />
                            {c.phone}
                          </span>
                          {c.email && (
                            <span className="flex items-center text-sm text-slate-500">
                              <Mail className="h-4 w-4 mr-1" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-600 mb-4">Müşteri bulunamadı</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewCustomerForm(true);
                      setShowResults(false);
                      setNewCustomer({
                        name: searchTerm,
                        phone: isPhone(searchTerm) ? searchTerm : '',
                        email: isEmail(searchTerm) ? searchTerm : ''
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Müşteri Ekle
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Customer Form */}
      {showNewCustomerForm && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Müşteri</CardTitle>
            <CardDescription>Müşteri bilgilerini girin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">İsim</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Müşteri adı"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Telefon numarası"
                  type="tel"
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta (Opsiyonel)</Label>
                <Input
                  id="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="E-posta adresi"
                  type="email"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewCustomerForm(false);
                    setError(null);
                  }}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    'Müşteri Ekle'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Customer Card */}
      {selectedCustomer && !showNewCustomerForm && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-900">Seçili Müşteri</CardTitle>
              <Badge variant="success">Seçildi</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-green-900">{selectedCustomer.name}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="flex items-center text-sm text-green-700">
                      <Phone className="h-4 w-4 mr-1" />
                      {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.email && (
                      <span className="flex items-center text-sm text-green-700">
                        <Mail className="h-4 w-4 mr-1" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={prev}>
          Geri
        </Button>
        {selectedCustomer && (
          <Button onClick={next}>
            Devam
          </Button>
        )}
      </div>
    </div>
  );
} 