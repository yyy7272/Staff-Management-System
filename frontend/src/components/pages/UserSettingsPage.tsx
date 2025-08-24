import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Loader2, User, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { authService, ChangePasswordData } from '../../services/authService';
import { getErrorMessage } from '../../lib/apiClient';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdministrator: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
}

interface ChangePasswordFormData extends ChangePasswordData {}

const UserSettingsPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    // Load user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const validatePasswordForm = (): string | null => {
    if (!passwordForm.currentPassword) {
      return 'Current password is required.';
    }

    if (!passwordForm.newPassword) {
      return 'New password is required.';
    }

    if (passwordForm.newPassword.length < 8) {
      return 'New password must be at least 8 characters long.';
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      return 'New password must be different from current password.';
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      return 'New password and confirmation do not match.';
    }

    return null;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Validate form
    const validationError = validatePasswordForm();
    if (validationError) {
      setPasswordError(validationError);
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordForm);
      setPasswordSuccess('Password changed successfully!');
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setPasswordLoading(false);
    }
  };

  const getUserRoleDisplay = () => {
    if (!user) return 'User';
    
    if (user.isAdministrator) return 'Administrator';
    if (user.canManageUsers) return 'User Manager';
    if (user.canManageRoles) return 'Role Manager';
    return 'User';
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View your account information and profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
                    {user.username}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
                    {user.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>First Name</Label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
                    {user.firstName || 'Not set'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
                    {user.lastName || 'Not set'}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Account Role</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your current role and permissions in the system.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {getUserRoleDisplay()}
                  </div>
                </div>

                {user.isAdministrator && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Full administrative access
                  </div>
                )}

                {(user.canManageUsers || user.canManageRoles) && !user.isAdministrator && (
                  <div className="space-y-1">
                    {user.canManageUsers && (
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="h-4 w-4" />
                        Can manage users
                      </div>
                    )}
                    {user.canManageRoles && (
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="h-4 w-4" />
                        Can manage roles
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {passwordSuccess}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your current password"
                    disabled={passwordLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your new password"
                    disabled={passwordLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm your new password"
                    disabled={passwordLoading}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full md:w-auto"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Tips</CardTitle>
              <CardDescription>
                Keep your account secure with these best practices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use a strong password with at least 8 characters</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Include a mix of uppercase, lowercase, numbers, and special characters</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Don't reuse passwords from other accounts</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Change your password regularly</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettingsPage;