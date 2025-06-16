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
    <PageContainer title="Şube Yönetimi" description="Şubelerinizi yönetin.">
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Branch Management</h1>
        {currentUser?.role === "admin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogDescription>
                  Add a new branch to the system. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    {...registerCreate("name", { required: "Branch name is required" })}
                  />
                  {createErrors.name && (
                    <p className="text-sm text-red-500">{createErrors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code</Label>
                  <Input
                    id="code"
                    placeholder="Will be auto-generated if left empty"
                    {...registerCreate("code")}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to auto-generate a code based on branch name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...registerCreate("phone", { required: "Phone is required" })}
                  />
                  {createErrors.phone && (
                    <p className="text-sm text-red-500">{createErrors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input
                    id="managerName"
                    {...registerCreate("managerName", { required: "Manager name is required" })}
                  />
                  {createErrors.managerName && (
                    <p className="text-sm text-red-500">{createErrors.managerName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.street">Street Address</Label>
                  <Input
                    id="address.street"
                    {...registerCreate("address.street", { required: "Street address is required" })}
                  />
                  {createErrors.address?.street && (
                    <p className="text-sm text-red-500">{createErrors.address.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.state">State</Label>
                    <Input
                      id="address.state"
                      {...registerCreate("address.state", { required: "State is required" })}
                    />
                    {createErrors.address?.state && (
                      <p className="text-sm text-red-500">{createErrors.address.state.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address.city">City</Label>
                    <Input
                      id="address.city"
                      {...registerCreate("address.city", { required: "City is required" })}
                    />
                    {createErrors.address?.city && (
                      <p className="text-sm text-red-500">{createErrors.address.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.country">Country</Label>
                  <Input
                    id="address.country"
                    {...registerCreate("address.country", { required: "Country is required" })}
                  />
                  {createErrors.address?.country && (
                    <p className="text-sm text-red-500">{createErrors.address.country.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">Postal Code</Label>
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
                    Cancel
                  </Button>
                  <Button type="submit">Create Branch</Button>
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
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch information. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Branch Name</Label>
              <Input
                id="edit-name"
                {...registerEdit("name", { required: "Branch name is required" })}
              />
              {editErrors.name && (
                <p className="text-sm text-red-500">{editErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">Branch Code</Label>
              <Input
                id="edit-code"
                {...registerEdit("code")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                {...registerEdit("phone", { required: "Phone is required" })}
              />
              {editErrors.phone && (
                <p className="text-sm text-red-500">{editErrors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-managerName">Manager Name</Label>
              <Input
                id="edit-managerName"
                {...registerEdit("managerName", { required: "Manager name is required" })}
              />
              {editErrors.managerName && (
                <p className="text-sm text-red-500">{editErrors.managerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.street">Street Address</Label>
              <Input
                id="edit-address.street"
                {...registerEdit("address.street", { required: "Street address is required" })}
              />
              {editErrors.address?.street && (
                <p className="text-sm text-red-500">{editErrors.address.street.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.city">City</Label>
              <Input
                id="edit-address.city"
                {...registerEdit("address.city", { required: "City is required" })}
              />
              {editErrors.address?.city && (
                <p className="text-sm text-red-500">{editErrors.address.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.state">State</Label>
              <Input
                id="edit-address.state"
                {...registerEdit("address.state", { required: "State is required" })}
              />
              {editErrors.address?.state && (
                <p className="text-sm text-red-500">{editErrors.address.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.country">Country</Label>
              <Input
                id="edit-address.country"
                {...registerEdit("address.country", { required: "Country is required" })}
              />
              {editErrors.address?.country && (
                <p className="text-sm text-red-500">{editErrors.address.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address.postalCode">Postal Code</Label>
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
                Cancel
              </Button>
              <Button type="submit">Update Branch</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
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
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  {currentUser?.role === "admin" && <TableHead>Actions</TableHead>}
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