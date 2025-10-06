import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle, Check, X } from 'lucide-react';
import { authService, type RegisterData } from '../../services/authService';
import { getErrorMessage } from '../../lib/apiClient';

interface RegisterFormData extends RegisterData {}

interface ValidationState {
  username: {
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
  };
  email: {
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
  };
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    username: {
      isChecking: false,
      isValid: null,
      message: ''
    },
    email: {
      isChecking: false,
      isValid: null,
      message: ''
    }
  });
  const navigate = useNavigate();

  // Debounce function for API calls
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }, []);

  // Username availability check
  const checkUsernameAvailability = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setValidation(prev => ({
          ...prev,
          username: {
            isChecking: false,
            isValid: false,
            message: 'Username must be at least 3 characters long'
          }
        }));
        return;
      }

      setValidation(prev => ({
        ...prev,
        username: { ...prev.username, isChecking: true }
      }));

      try {
        const response = await authService.checkUsernameAvailability(username);
        setValidation(prev => ({
          ...prev,
          username: {
            isChecking: false,
            isValid: response.isAvailable,
            message: response.message
          }
        }));
      } catch (error) {
        setValidation(prev => ({
          ...prev,
          username: {
            isChecking: false,
            isValid: false,
            message: 'Error checking username availability'
          }
        }));
      }
    }, 500),
    []
  );

  // Email availability check
  const checkEmailAvailability = useCallback(
    debounce(async (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        setValidation(prev => ({
          ...prev,
          email: {
            isChecking: false,
            isValid: false,
            message: 'Please enter a valid email address'
          }
        }));
        return;
      }

      setValidation(prev => ({
        ...prev,
        email: { ...prev.email, isChecking: true }
      }));

      try {
        const response = await authService.checkEmailAvailability(email);
        setValidation(prev => ({
          ...prev,
          email: {
            isChecking: false,
            isValid: response.isAvailable,
            message: response.message
          }
        }));
      } catch (error) {
        setValidation(prev => ({
          ...prev,
          email: {
            isChecking: false,
            isValid: false,
            message: 'Error checking email availability'
          }
        }));
      }
    }, 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Trigger availability checks
      if (name === 'username') {
        checkUsernameAvailability(value);
      } else if (name === 'email') {
        checkEmailAvailability(value);
      }
    }

    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!validation.username.isValid) {
      setError('Please choose a valid username');
      return false;
    }

    if (!validation.email.isValid) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register(formData);
      setSuccess(true);
      setEmailSent(response.emailSent || false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await authService.resendVerificationEmail(formData.email);
      alert('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getValidationIcon = (field: 'username' | 'email') => {
    const fieldValidation = validation[field];
    
    if (fieldValidation.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    
    if (fieldValidation.isValid === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    
    if (fieldValidation.isValid === false) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  const getValidationMessage = (field: 'username' | 'email') => {
    const fieldValidation = validation[field];
    const value = formData[field];
    
    if (!value) return null;
    
    if (fieldValidation.isChecking) {
      return <p className="text-xs text-gray-500">Checking availability...</p>;
    }
    
    if (fieldValidation.message) {
      return (
        <p className={`text-xs ${fieldValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
          {fieldValidation.message}
        </p>
      );
    }
    
    return null;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-700">Registration Successful!</CardTitle>
              <CardDescription>
                Your account has been created successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {emailSent 
                    ? "A verification email has been sent to your email address. Please check your inbox and click the verification link to activate your account."
                    : "There was an issue sending the verification email, but your account has been created. Please contact support or try resending the verification email."
                  }
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {!emailSent && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendEmail}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                )}

                <Button
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  Back to Login
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Once you verify your email, you'll be able to sign in to the system.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Staff Management System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a unique username"
                    disabled={loading}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getValidationIcon('username')}
                  </div>
                </div>
                {getValidationMessage('username')}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Company Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@company.com"
                    disabled={loading}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getValidationIcon('email')}
                  </div>
                </div>
                {getValidationMessage('email')}
                <p className="text-xs text-gray-500">
                  Use your company email address. Only company domains are allowed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Must be 8+ characters with uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                {confirmPassword && formData.password !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || validation.username.isChecking || validation.email.isChecking || !validation.username.isValid || !validation.email.isValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={handleBackToLogin}
                disabled={loading}
              >
                Already have an account? Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;