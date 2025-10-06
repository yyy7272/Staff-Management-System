import { apiClient, setAuthToken, clearAuthTokens } from '../lib/apiClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  email: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AvailabilityResponse {
  isAvailable: boolean;
  message: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isAdministrator: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
  };
}

export interface AuthResponse {
  message: string;
  userId?: string;
  email?: string;
  domain?: string;
  emailSent?: boolean;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      // Store the token
      if (response.token) {
        setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      return await apiClient.post<AuthResponse>('/auth/register', data);
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local tokens
    } finally {
      clearAuthTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>('/auth/change-password', data);
    } catch (error) {
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<AuthResponse> {
    try {
      return await apiClient.post<AuthResponse>('/auth/resend-verification', { email });
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>('/auth/forgot-password', data);
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>('/auth/reset-password', data);
    } catch (error) {
      throw error;
    }
  }

  async checkUsernameAvailability(username: string): Promise<AvailabilityResponse> {
    try {
      return await apiClient.post<AvailabilityResponse>('/auth/check-username', { username });
    } catch (error) {
      throw error;
    }
  }

  async checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
    try {
      return await apiClient.post<AvailabilityResponse>('/auth/check-email', { email });
    } catch (error) {
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
  }
}

export const authService = new AuthService();