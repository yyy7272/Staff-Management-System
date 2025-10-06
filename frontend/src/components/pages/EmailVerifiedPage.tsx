import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const EmailVerifiedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    
    if (success === 'true') {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900">Verifying your email...</h2>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-green-700">Email Verified Successfully!</CardTitle>
              <CardDescription>
                Your account has been activated and you can now sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Welcome to the Staff Management System! Your email has been verified and your account is now active.
                </p>
                
                <p className="text-sm text-gray-500 mb-6">
                  You will be automatically redirected to the login page in {countdown} seconds...
                </p>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleGoToLogin}
                  >
                    Sign In Now
                  </Button>
                </div>
              </div>

              <div className="text-center border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sign in with your username and password</li>
                  <li>• Complete your profile information</li>
                  <li>• Explore the staff management features</li>
                  <li>• Contact your administrator for role assignments</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-red-700">Email Verification Failed</CardTitle>
            <CardDescription>
              We couldn't verify your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                The verification link may be invalid, expired, or already used. 
                This can happen if the link is older than 24 hours.
              </p>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleGoToRegister}
                >
                  Try Registering Again
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoToLogin}
                >
                  Back to Login
                </Button>
              </div>
            </div>

            <div className="text-center border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600">
                If you continue to have issues, please contact your system administrator 
                or IT support for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerifiedPage;