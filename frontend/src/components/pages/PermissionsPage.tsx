import { useState, useMemo } from "react";
import { Users, Settings, Edit, Shield, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { useUserData } from "../../hooks";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { toast } from "sonner";

// Page permission definitions
const PAGE_PERMISSIONS = [
  {
    page: "employees",
    name: "Employee Management",
    description: "Access and manage employee records",
    accessKey: "canAccessEmployees",
    manageKey: "canManageEmployees",
    icon: Users
  },
  {
    page: "organization",
    name: "Organization Management",
    description: "Access and manage departments and organizational structure",
    accessKey: "canAccessOrganization",
    manageKey: "canManageOrganization",
    icon: Settings
  },
  {
    page: "payroll",
    name: "Payroll Management",
    description: "Access and manage payroll information and reports",
    accessKey: "canAccessPayroll",
    manageKey: "canManagePayroll",
    icon: Shield
  },
  {
    page: "approvals",
    name: "Approval Management",
    description: "Access and manage approval workflows and requests",
    accessKey: "canAccessApprovals",
    manageKey: "canManageApprovals",
    icon: Edit
  },
  {
    page: "permissions",
    name: "Permission Management",
    description: "Access permission management (admin only)",
    accessKey: "canAccessPermissions",
    manageKey: null,
    icon: Shield
  }
];

export function PermissionsPage() {
  const {
    users,
    totalCount,
    isLoading: usersLoading,
    updateUserPermissions,
    toggleUserStatus
  } = useUserData();
  
  // User permissions dialog state
  const [isEditUserPermissionsDialogOpen, setIsEditUserPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPermissionFormData, setUserPermissionFormData] = useState({
    isAdministrator: false,
    canManageUsers: false,
    canManageRoles: false,
    // Page access permissions
    canAccessEmployees: false,
    canManageEmployees: false,
    canAccessOrganization: false,
    canManageOrganization: false,
    canAccessPayroll: false,
    canManagePayroll: false,
    canAccessApprovals: false,
    canManageApprovals: false,
    canAccessPermissions: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statistics = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(user => user.isActive).length,
    adminUsers: users.filter(user => user.isAdministrator).length,
    usersWithPermissions: users.filter(user => 
      user.canAccessEmployees || user.canAccessOrganization || 
      user.canAccessPayroll || user.canAccessApprovals || user.canAccessPermissions
    ).length
  }), [users]);

  const handleEditUserPermissions = (user: any) => {
    setSelectedUser(user);
    setUserPermissionFormData({
      isAdministrator: user.isAdministrator || false,
      canManageUsers: user.canManageUsers || false,
      canManageRoles: user.canManageRoles || false,
      // Page access permissions
      canAccessEmployees: user.canAccessEmployees || false,
      canManageEmployees: user.canManageEmployees || false,
      canAccessOrganization: user.canAccessOrganization || false,
      canManageOrganization: user.canManageOrganization || false,
      canAccessPayroll: user.canAccessPayroll || false,
      canManagePayroll: user.canManagePayroll || false,
      canAccessApprovals: user.canAccessApprovals || false,
      canManageApprovals: user.canManageApprovals || false,
      canAccessPermissions: user.canAccessPermissions || false
    });
    setIsEditUserPermissionsDialogOpen(true);
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const result = await updateUserPermissions(selectedUser.id, userPermissionFormData);
      if (result.success) {
        setIsEditUserPermissionsDialogOpen(false);
        setSelectedUser(null);
        toast.success('User permissions updated successfully');
      }
    } catch {
      toast.error('Failed to update user permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setUserPermissionFormData(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const getPermissionSummary = (user: any) => {
    let count = 0;
    if (user.canAccessEmployees) count++;
    if (user.canAccessOrganization) count++;
    if (user.canAccessPayroll) count++;
    if (user.canAccessApprovals) count++;
    if (user.canAccessPermissions) count++;
    return count;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge> :
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Permission Management</h2>
          <p className="text-muted-foreground">Manage user access to system pages and features</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statistics.activeUsers}</div>
            <p className="text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statistics.adminUsers}</div>
            <p className="text-muted-foreground">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statistics.usersWithPermissions}</div>
            <p className="text-muted-foreground">Users with Page Access</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All users can login and access the main page by default. Grant additional page access permissions below.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Page Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading users...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.isAdministrator ? "default" : "secondary"} 
                        className={user.isAdministrator ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}
                      >
                        {user.isAdministrator ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getPermissionSummary(user)} of {PAGE_PERMISSIONS.length} pages
                        </Badge>
                        {user.isAdministrator && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            Full Access
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.isActive)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUserPermissions(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Permissions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Permissions Dialog */}
      <Dialog open={isEditUserPermissionsDialogOpen} onOpenChange={setIsEditUserPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Edit Permissions - {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Email:</strong> {selectedUser?.email}
                </div>
                <div>
                  <strong>Name:</strong> {selectedUser?.firstName} {selectedUser?.lastName}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Base Permission: Login and access main dashboard (granted to all users)
              </div>
            </div>

            {/* Administrative Permissions */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Administrative Permissions</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Switch
                    checked={userPermissionFormData.isAdministrator}
                    onCheckedChange={(checked) => handlePermissionChange('isAdministrator', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">System Administrator</div>
                    <div className="text-sm text-muted-foreground">Full system access and control (overrides all other settings)</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Switch
                    checked={userPermissionFormData.canManageUsers}
                    onCheckedChange={(checked) => handlePermissionChange('canManageUsers', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">User Manager</div>
                    <div className="text-sm text-muted-foreground">Can manage user accounts and permissions</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Switch
                    checked={userPermissionFormData.canManageRoles}
                    onCheckedChange={(checked) => handlePermissionChange('canManageRoles', checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">Role Manager</div>
                    <div className="text-sm text-muted-foreground">Can manage system roles (legacy feature)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Access Permissions */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Page Access Permissions</Label>
              <div className="text-sm text-muted-foreground mb-4">
                Grant access to specific system pages. Users without permission will not see these pages in navigation.
              </div>
              
              <div className="grid gap-4">
                {PAGE_PERMISSIONS.map((pagePermission) => {
                  const IconComponent = pagePermission.icon;
                  return (
                    <div key={pagePermission.page} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{pagePermission.name}</div>
                          <div className="text-sm text-muted-foreground mb-3">{pagePermission.description}</div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={userPermissionFormData[pagePermission.accessKey as keyof typeof userPermissionFormData] as boolean}
                                onCheckedChange={(checked) => handlePermissionChange(pagePermission.accessKey, checked)}
                              />
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span className="text-sm">Can Access Page</span>
                              </div>
                            </div>
                            
                            {pagePermission.manageKey && (
                              <div className="flex items-center space-x-3">
                                <Switch
                                  checked={userPermissionFormData[pagePermission.manageKey as keyof typeof userPermissionFormData] as boolean}
                                  onCheckedChange={(checked) => handlePermissionChange(pagePermission.manageKey!, checked)}
                                  disabled={!userPermissionFormData[pagePermission.accessKey as keyof typeof userPermissionFormData]}
                                />
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span className="text-sm">Can Manage (Create/Edit/Delete)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveUserPermissions} 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Permissions"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditUserPermissionsDialogOpen(false)} 
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}