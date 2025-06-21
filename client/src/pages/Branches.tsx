/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unused-params */
/* eslint-disable @typescript-eslint/no-unused-locals */
// If you also want to stop TypeScript itself from flagging them:
// // @ts-nocheck

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { api } from "@/api/api"
import { PageContainer } from '@/components/PageContainer'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

interface Branch {
  _id: string
  name: string
  code: string
  phone: string
  managerName: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode?: string
  }
  isCentral: boolean
  defaultLanguage: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface BranchForm {
  name: string
  code?: string
  phone: string
  managerName: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode?: string
  }
}

export default function Branches() {
  const { user: currentUser } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm<BranchForm>()
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue, formState: { errors: editErrors } } = useForm<BranchForm>()
  const { t } = useTranslation()

  useEffect(() => {
    // Sadece admin kullanıcısı tüm şubeleri görebilir
    if (currentUser?.role === 'admin') {
      fetchBranches()
    } else {
      setLoading(false)
    }
  }, [currentUser])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/api/branches')
      if (response.data.success) {
        setBranches(response.data.data)
      } else {
        enqueueSnackbar(response.data.message || "Şubeler yüklenemedi", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch branches:', error)
      enqueueSnackbar(error.response?.data?.message || "Şubeler yüklenemedi", {
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateBranchCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${randomNum}`;
  };

  const onSubmit = async (data: BranchForm) => {
    console.log('Branch form submitted with data:', data);
    console.log('Current user:', currentUser);
    
    try {
      if (!data.code) {
        data.code = generateBranchCode(data.name);
      }

      const branchData = {
        ...data,
        address: {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          country: data.address.country,
          postalCode: data.address.postalCode
        }
      };

      console.log('Sending POST request to /branches with data:', branchData);
      const response = await api.post('/branches', branchData);
      console.log('Branch creation response:', response.data);
      
      if (response.data.success) {
        enqueueSnackbar("Branch created successfully", {
          variant: "success",
        })
        setIsCreateDialogOpen(false)
        resetCreate()
        fetchBranches()
      } else {
        console.error('Branch creation failed:', response.data);
        enqueueSnackbar(response.data.message || "Failed to create branch", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Branch creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      enqueueSnackbar(error.response?.data?.message || "Failed to create branch", {
        variant: "error",
      })
    }
  }

  const handleEditClick = (branch: Branch) => {
    // Ensure address is an object
    const branchData = {
      ...branch,
      address: typeof branch.address === 'string' 
        ? { street: branch.address, city: '', state: '', country: '' }
        : branch.address || { street: '', city: '', state: '', country: '' }
    };

    setSelectedBranch(branchData);
    resetEdit({
      name: branchData.name,
      code: branchData.code,
      phone: branchData.phone,
      managerName: branchData.managerName,
      address: {
        street: branchData.address.street,
        city: branchData.address.city,
        state: branchData.address.state,
        country: branchData.address.country,
        postalCode: branchData.address.postalCode
      }
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) {
      return
    }

    try {
      const response = await api.delete(`/branches/${branchId}`)
      if (response.data.success) {
        enqueueSnackbar("Branch deleted successfully", {
          variant: "success",
        })
        fetchBranches()
      } else {
        enqueueSnackbar(response.data.message || "Failed to delete branch", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Delete branch error:', error.response?.data || error)
      enqueueSnackbar(error.response?.data?.message || "Failed to delete branch", {
        variant: "error",
      })
    }
  }

  const onEditSubmit = async (data: BranchForm) => {
    if (!selectedBranch) return

    try {
      const response = await api.put(`/branches/${selectedBranch._id}`, data)
      if (response.data.success) {
        enqueueSnackbar("Branch updated successfully", {
          variant: "success",
        })
        setIsEditDialogOpen(false)
        resetEdit()
        fetchBranches()
      } else {
        enqueueSnackbar(response.data.message || "Failed to update branch", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Update branch error:', error.response?.data || error)
      enqueueSnackbar(error.response?.data?.message || "Failed to update branch", {
        variant: "error",
      })
    }
  }

  const filteredBranches = branches.filter(branch => {
    const searchTerm = searchQuery.toLowerCase();
    const branchData = {
      ...branch,
      address: typeof branch.address === 'string' 
        ? { street: branch.address, city: '', state: '', country: '' }
        : branch.address || { street: '', city: '', state: '', country: '' }
    };

    return (
      branchData.name.toLowerCase().includes(searchTerm) ||
      branchData.code.toLowerCase().includes(searchTerm) ||
      branchData.phone.toLowerCase().includes(searchTerm) ||
      branchData.managerName.toLowerCase().includes(searchTerm) ||
      branchData.address.street.toLowerCase().includes(searchTerm) ||
      branchData.address.city.toLowerCase().includes(searchTerm) ||
      branchData.address.state.toLowerCase().includes(searchTerm) ||
      branchData.address.country.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <PageContainer title={t('branches.title')} description={t('branches.description')}>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('branches.title')}</h1>
        {currentUser?.role === "admin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('branches.add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('branches.createTitle')}</DialogTitle>
                <DialogDescription>
                  {t('branches.createDesc')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('branches.form.name')}</Label>
                  <Input
                    id="name"
                    {...registerCreate("name", { required: t('branches.form.nameRequired') })}
                  />
                  {createErrors.name && (
                    <p className="text-sm text-red-500">{createErrors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">{t('branches.form.code')}</Label>
                  <Input
                    id="code"
                    placeholder={t('branches.form.codePlaceholder')}
                    {...registerCreate("code")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('branches.form.codeHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('branches.form.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...registerCreate("phone", { required: t('branches.form.phoneRequired') })}
                  />
                  {createErrors.phone && (
                    <p className="text-sm text-red-500">{createErrors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerName">{t('branches.form.managerName')}</Label>
                  <Input
                    id="managerName"
                    {...registerCreate("managerName", { required: t('branches.form.managerNameRequired') })}
                  />
                  {createErrors.managerName && (
                    <p className="text-sm text-red-500">{createErrors.managerName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.street">{t('branches.form.street')}</Label>
                  <Input
                    id="address.street"
                    {...registerCreate("address.street", { required: t('branches.form.streetRequired') })}
                  />
                  {createErrors.address?.street && (
                    <p className="text-sm text-red-500">{createErrors.address.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.state">{t('branches.form.state')}</Label>
                    <Input
                      id="address.state"
                      {...registerCreate("address.state", { required: t('branches.form.stateRequired') })}
                    />
                    {createErrors.address?.state && (
                      <p className="text-sm text-red-500">{createErrors.address.state.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address.city">{t('branches.form.city')}</Label>
                    <Input
                      id="address.city"
                      {...registerCreate("address.city", { required: t('branches.form.cityRequired') })}
                    />
                    {createErrors.address?.city && (
                      <p className="text-sm text-red-500">{createErrors.address.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.country">{t('branches.form.country')}</Label>
                  <Input
                    id="address.country"
                    {...registerCreate("address.country", { required: t('branches.form.countryRequired') })}
                  />
                  {createErrors.address?.country && (
                    <p className="text-sm text-red-500">{createErrors.address.country.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">{t('branches.form.postalCode')}</Label>
                  <Input
                    id="address.postalCode"
                    {...registerCreate("address.postalCode")}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('branches.create')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('branches.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('branches.editDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('branches.form.name')}</Label>
              <Input
                id="edit-name"
                {...registerEdit("name", { required: t('branches.form.nameRequired') })}
              />
              {editErrors.name && (
                <p className="text-sm text-red-500">{editErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">{t('branches.form.code')}</Label>
              <Input
                id="edit-code"
                {...registerEdit("code")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t('branches.form.phone')}</Label>
              <Input
                id="edit-phone"
                type="tel"
                {...registerEdit("phone", { required: t('branches.form.phoneRequired') })}
              />
              {editErrors.phone && (
                <p className="text-sm text-red-500">{editErrors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-managerName">{t('branches.form.managerName')}</Label>
              <Input
                id="edit-managerName"
                {...registerEdit("managerName", { required: t('branches.form.managerNameRequired') })}
              />
              {editErrors.managerName && (
                <p className="text-sm text-red-500">{editErrors.managerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.street">{t('branches.form.street')}</Label>
              <Input
                id="edit-address.street"
                {...registerEdit("address.street", { required: t('branches.form.streetRequired') })}
              />
              {editErrors.address?.street && (
                <p className="text-sm text-red-500">{editErrors.address.street.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.city">{t('branches.form.city')}</Label>
              <Input
                id="edit-address.city"
                {...registerEdit("address.city", { required: t('branches.form.cityRequired') })}
              />
              {editErrors.address?.city && (
                <p className="text-sm text-red-500">{editErrors.address.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.state">{t('branches.form.state')}</Label>
              <Input
                id="edit-address.state"
                {...registerEdit("address.state", { required: t('branches.form.stateRequired') })}
              />
              {editErrors.address?.state && (
                <p className="text-sm text-red-500">{editErrors.address.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.country">{t('branches.form.country')}</Label>
              <Input
                id="edit-address.country"
                {...registerEdit("address.country", { required: t('branches.form.countryRequired') })}
              />
              {editErrors.address?.country && (
                <p className="text-sm text-red-500">{editErrors.address.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.postalCode">{t('branches.form.postalCode')}</Label>
              <Input
                id="edit-address.postalCode"
                {...registerEdit("address.postalCode")}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('branches.update')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>{t('branches.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('branches.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('branches.table.name')}</TableHead>
                  <TableHead>{t('branches.table.code')}</TableHead>
                  <TableHead>{t('branches.table.phone')}</TableHead>
                  <TableHead>{t('branches.table.manager')}</TableHead>
                  <TableHead>{t('branches.table.address')}</TableHead>
                  <TableHead>{t('branches.table.status')}</TableHead>
                  <TableHead>{t('branches.table.createdAt')}</TableHead>
                  {currentUser?.role === "admin" && <TableHead>{t('branches.table.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => {
                  // Ensure address is an object
                  const branchData = {
                    ...branch,
                    address: typeof branch.address === 'string' 
                      ? { street: branch.address, city: '', state: '', country: '' }
                      : branch.address || { street: '', city: '', state: '', country: '' }
                  };
                  
                  return (
                    <TableRow key={branchData._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-2" />
                          {branchData.name}
                        </div>
                      </TableCell>
                      <TableCell>{branchData.code}</TableCell>
                      <TableCell>{branchData.phone}</TableCell>
                      <TableCell>{branchData.managerName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {branchData.address.street}
                          <div className="text-muted-foreground">
                            {branchData.address.city}, {branchData.address.state}
                            <div>{branchData.address.country}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={branchData.status === 'active' ? "default" : "secondary"}>
                          {branchData.status === 'active' ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(branchData.createdAt).toLocaleDateString()}
                      </TableCell>
                      {currentUser?.role === "admin" && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(branchData)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(branchData._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  )
} 