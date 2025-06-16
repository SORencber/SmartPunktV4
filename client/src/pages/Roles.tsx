import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSnackbar } from 'notistack'
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
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Pencil, Trash2, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { api } from "@/api/api"
import { PageContainer } from '@/components/PageContainer'
import { MODULES, ACTIONS } from '../constants/permissions'

interface Permission {
  module: string;
  actions: string[];
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleForm {
  name: string;
  description?: string;
  permissions: {
    [key: string]: {
      actions: string[];
    };
  };
}

export default function Roles() {
  const { user: currentUser } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm<RoleForm>({
    defaultValues: {
      name: "",
      description: "",
      permissions: MODULES.reduce((acc, module) => ({
        ...acc,
        [module.id]: { actions: [] }
      }), {})
    }
  })
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue, formState: { errors: editErrors }, watch } = useForm<RoleForm>({
    defaultValues: {
      name: "",
      description: "",
      permissions: MODULES.reduce((acc, module) => ({
        ...acc,
        [module.id]: { actions: [] }
      }), {})
    },
    mode: 'onChange'
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log('Form field changed:', { name, type, value });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/roles')
      if (response.data.success) {
        setRoles(response.data.roles)
      } else {
        enqueueSnackbar("Failed to fetch roles", { variant: "error" })
      }
    } catch (error) {
      enqueueSnackbar("Failed to fetch roles", { variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: RoleForm) => {
    try {
      const formattedPermissions = Object.entries(data.permissions)
        .filter(([_, value]) => value.actions.length > 0)
        .map(([module, value]) => ({
          module,
          actions: value.actions
        }));

      const roleData: any = {
        name: data.name,
        description: data.description,
        permissions: formattedPermissions
      };
      delete roleData.parts;

      const response = await api.post('/api/roles', roleData)
      if (response.data.success) {
        enqueueSnackbar("Role created successfully", { variant: "success" })
        setIsCreateDialogOpen(false)
        resetCreate()
        fetchRoles()
      } else {
        enqueueSnackbar(response.data.message || "Failed to create role", { variant: "error" })
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Failed to create role", { variant: "error" })
    }
  }

  const handleEditClick = (role: Role) => {
    console.log('Editing role:', role);
    setSelectedRole(role)
    
    resetEdit();
    
    setEditValue('name', role.name)
    setEditValue('description', role.description || '')
    
    const formPermissions: RoleForm['permissions'] = MODULES.reduce((acc, module) => {
      const modulePermissions = role.permissions.find(p => p.module === module.id)
      return {
        ...acc,
        [module.id]: {
          actions: modulePermissions?.actions || []
        }
      }
    }, {} as RoleForm['permissions'])
    
    console.log('Setting form permissions:', formPermissions);
    setEditValue('permissions', formPermissions)
    setIsEditDialogOpen(true)
  }

  const onEditSubmit = async (data: RoleForm) => {
    if (!selectedRole) return

    try {
      // Log the raw form data
      console.log('Raw form data:', data);

      const formattedPermissions = Object.entries(data.permissions)
        .filter(([_, value]) => value.actions.length > 0)
        .map(([module, value]) => ({
          module,
          actions: value.actions
        }));

      // Create a clean payload with only the required fields and explicitly remove undefined values
      const roleData = {
        name: data.name,
        description: data.description || '',
        permissions: formattedPermissions
      };

      // Remove any undefined fields from the payload
      Object.keys(roleData).forEach(key => {
        if (roleData[key as keyof typeof roleData] === undefined) {
          delete roleData[key as keyof typeof roleData];
        }
      });

      // Log the final payload
      console.log('Final payload:', roleData);

      const response = await api.put(`/api/roles/${selectedRole._id}`, roleData)
      if (response.data.success) {
        enqueueSnackbar("Role updated successfully", { variant: "success" })
        setIsEditDialogOpen(false)
        resetEdit()
        fetchRoles()
      } else {
        enqueueSnackbar(response.data.message || "Failed to update role", { variant: "error" })
      }
    } catch (error: any) {
      console.error('Role update error:', error.response?.data || error);
      enqueueSnackbar(error.response?.data?.message || "Failed to update role", { variant: "error" })
    }
  }

  const handleDeleteClick = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return
    }

    try {
      const response = await api.delete(`/api/roles/${roleId}`)
      if (response.data.success) {
        enqueueSnackbar("Role deleted successfully", { variant: "success" })
        fetchRoles()
      } else {
        enqueueSnackbar(response.data.message || "Failed to delete role", { variant: "error" })
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Failed to delete role", { variant: "error" })
    }
  }

  const handleToggleActive = async (roleId: string, currentStatus: boolean) => {
    try {
      const response = await api.put(`/api/roles/${roleId}/toggle-active`)
      if (response.data.success) {
        enqueueSnackbar(response.data.message, { variant: "success" })
        fetchRoles()
      } else {
        enqueueSnackbar(response.data.message || "Failed to update role status", { variant: "error" })
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Failed to update role status", { variant: "error" })
    }
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <PageContainer title="Rol Yönetimi" description="Kullanıcı rolleri ve yetkilerini yönetin.">
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Role Management</h1>
        {currentUser?.role === "admin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input
                      id="name"
                      {...registerCreate("name", { required: "Role name is required" })}
                    />
                    {createErrors.name && (
                      <p className="text-sm text-red-500">{createErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      {...registerCreate("description")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MODULES.map((module) => (
                      <div key={module.id} className="space-y-2 p-3 border rounded-lg">
                        <div className="font-medium">{module.label}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {ACTIONS.map((action) => (
                            <label key={action.id} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                {...registerCreate(`permissions.${module.id}.actions` as const)}
                                value={action.id}
                                className="rounded border-gray-300"
                              />
                              <span>{action.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Role</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  {...registerEdit("name", { required: "Role name is required" })}
                />
                {editErrors.name && (
                  <p className="text-sm text-red-500">{editErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  {...registerEdit("description")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MODULES.map((module) => (
                  <div key={module.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="font-medium">{module.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {ACTIONS.map((action) => (
                        <label key={action.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            {...registerEdit(`permissions.${module.id}.actions` as const)}
                            value={action.id}
                            className="rounded border-gray-300"
                            defaultChecked={selectedRole?.permissions.some(
                              p => p.module === module.id && p.actions.includes(action.id)
                            )}
                          />
                          <span>{action.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Role</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
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
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Switch
                          checked={role.isActive}
                          onCheckedChange={() => handleToggleActive(role._id, role.isActive)}
                          disabled={role.isSystem}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? "default" : "secondary"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        {!role.isSystem && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(role)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(role._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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