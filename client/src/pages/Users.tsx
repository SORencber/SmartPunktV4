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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Plus, Search, UserPlus, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { api } from "@/api/api"
import { PageContainer } from '@/components/PageContainer'
import { useSnackbar } from 'notistack'

interface User {
  _id: string
  fullName: string
  email: string
  phone?: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  branch?: {
    _id: string
    name: string
  }
  permissions?: { module: string; actions: string[] }[]
  createdAt: string
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
}

interface CreateUserForm {
  name: string
  email: string
  password: string
  role: string  // Role ID'si
  branchId?: string
  phone?: string
}

interface EditUserForm {
  fullName: string
  email: string
  phone?: string
  role: string  // Role ID'si
  branch?: string
}

const formatPhoneNumber = (value: string) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  
  // If empty, return empty string
  if (!digits) return ''
  
  // If starts with 49, remove it as we'll add +49 prefix
  const number = digits.startsWith('49') ? digits.slice(2) : digits
  
  // Format the number with +49 prefix
  return `+49${number}`
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Array<{ _id: string; name: string }>>([])

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors }, watch, setValue } = useForm<CreateUserForm>()
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue, formState: { errors: editErrors } } = useForm<EditUserForm>()

  useEffect(() => {
    fetchUsers()
    fetchBranches()
    fetchRoles()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/api/branches')
      if (response.data.success) {
        setBranches(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/roles')
      if (response.data.success) {
        // Sadece aktif rolleri filtrele
        const activeRoles = response.data.roles.filter((role: Role) => role.isActive)
        setRoles(activeRoles)
      } else {
        enqueueSnackbar("Error", {
          variant: "error",
        })
      }
    } catch (error) {
      enqueueSnackbar("Error", {
        variant: "error",
      })
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users')
      if (response.data.success) {
        setUsers(response.data.users)
      } else {
        enqueueSnackbar(response.data.message || "Failed to fetch users", {
          variant: "error",
        })
      }
    } catch (error) {
      enqueueSnackbar("Error", {
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CreateUserForm) => {
    try {
      // Transform the data to match backend expectations
      const userData = {
        username: data.email.split('@')[0], // Generate username from email
        email: data.email,
        password: data.password,
        fullName: data.name,
        role: data.role,
        branch: data.branchId, // Map branchId to branch
        phone: data.phone
      }

      const response = await api.post('/api/auth/register', userData)
      if (response.data.success) {
        enqueueSnackbar("User created successfully", {
          variant: "success",
        })
        setIsCreateDialogOpen(false)
        resetCreate()
        fetchUsers()
      } else {
        enqueueSnackbar(response.data.message || "Failed to create user", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Create user error:', error.response?.data || error)
      enqueueSnackbar(error.response?.data?.message || "Failed to create user", {
        variant: "error",
      })
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await api.put(`/api/users/${userId}/toggle-active`);
      
      if (response.data.success) {
        enqueueSnackbar(response.data.message || `User ${currentStatus ? "deactivated" : "activated"} successfully`, {
          variant: "success",
        });
        await fetchUsers();
      } else {
        enqueueSnackbar(response.data.message || "Failed to update user status", {
          variant: "error",
        });
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Failed to update user status", {
        variant: "error",
      });
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setEditValue('fullName', user.fullName)
    setEditValue('email', user.email)
    setEditValue('phone', user.phone || '')
    setEditValue('role', user.role)
    setEditValue('branch', user.branch?._id || '')
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await api.delete(`/api/users/${userId}`)
      if (response.data.success) {
        enqueueSnackbar("User deleted successfully", {
          variant: "success",
        })
        fetchUsers()
      } else {
        enqueueSnackbar(response.data.message || "Failed to delete user", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Delete user error:', error.response?.data || error)
      enqueueSnackbar(error.response?.data?.message || "Failed to delete user", {
        variant: "error",
      })
    }
  }

  const onEditSubmit = async (data: EditUserForm) => {
    if (!selectedUser) return

    try {
      const response = await api.put(`/api/users/${selectedUser._id}`, data)
      if (response.data.success) {
        enqueueSnackbar("User updated successfully", {
          variant: "success",
        })
        setIsEditDialogOpen(false)
        resetEdit()
        fetchUsers()
      } else {
        enqueueSnackbar(response.data.message || "Failed to update user", {
          variant: "error",
        })
      }
    } catch (error: any) {
      console.error('Update user error:', error.response?.data || error)
      enqueueSnackbar(error.response?.data?.message || "Failed to update user", {
        variant: "error",
      })
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setValue: (name: string, value: string) => void, name: string) => {
    const formattedNumber = formatPhoneNumber(e.target.value)
    setValue(name, formattedNumber)
  }

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r._id === roleId)
    return role ? role.name : roleId
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <PageContainer title="Kullanıcı Yönetimi" description="Kullanıcılarınızı ve yetkilerini yönetin.">
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        {currentUser?.role === "admin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...registerCreate("name", { required: "Name is required" })}
                  />
                  {createErrors.name && (
                    <p className="text-sm text-red-500">{createErrors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerCreate("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {createErrors.email && (
                    <p className="text-sm text-red-500">{createErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+49"
                    {...registerCreate("phone", {
                      pattern: {
                        value: /^\+49[0-9]{6,14}$/,
                        message: "Invalid phone number format. Must start with +49 followed by 6-14 digits",
                      },
                      onChange: (e) => handlePhoneChange(e, registerCreate("phone").onChange, "phone")
                    })}
                  />
                  {createErrors.phone && (
                    <p className="text-sm text-red-500">{createErrors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...registerCreate("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {createErrors.password && (
                    <p className="text-sm text-red-500">{createErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("role", value, { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {createErrors.role && (
                    <p className="text-sm text-red-500">{createErrors.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch</Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: {
                          name: "branchId",
                          value,
                        },
                      }
                      registerCreate("branchId", {
                        required: watch('role') === 'branch_staff' || watch('role') === 'central_staff' ? "Branch is required for branch staff and central staff" : false,
                        validate: (value) => {
                          const role = watch('role');
                          if ((role === 'branch_staff' || role === 'central_staff') && !value) {
                            return "Branch is required for branch staff and central staff";
                          }
                          return true;
                        }
                      }).onChange(event)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {createErrors.branchId && (
                    <p className="text-sm text-red-500">{createErrors.branchId.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create User</Button>
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                {...registerEdit("fullName", { required: "Name is required" })}
              />
              {editErrors.fullName && (
                <p className="text-sm text-red-500">{editErrors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...registerEdit("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {editErrors.email && (
                <p className="text-sm text-red-500">{editErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+49"
                {...registerEdit("phone", {
                  pattern: {
                    value: /^\+49[0-9]{6,14}$/,
                    message: "Invalid phone number format. Must start with +49 followed by 6-14 digits",
                  },
                  onChange: (e) => handlePhoneChange(e, registerEdit("phone").onChange, "phone")
                })}
              />
              {editErrors.phone && (
                <p className="text-sm text-red-500">{editErrors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                onValueChange={(value) => {
                  setEditValue("role", value, { shouldValidate: true })
                }}
                defaultValue={selectedUser?.role}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role">
                    {selectedUser && getRoleName(selectedUser.role)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.role && (
                <p className="text-sm text-red-500">{editErrors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Select
                onValueChange={(value) => {
                  const event = {
                    target: {
                      name: "branch",
                      value,
                    },
                  }
                  registerEdit("branch").onChange(event)
                }}
                defaultValue={selectedUser?.branch?._id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {getRoleName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.branch?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={() => handleToggleActive(user._id, user.status === 'active')}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteClick(user._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  )
} 