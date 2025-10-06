import { environment, getApiUrl } from '../config/environment';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Token management
class TokenManager {
  private static instance: TokenManager;
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private getStorage() {
    return environment.TOKEN_STORAGE_TYPE === 'sessionStorage' ? sessionStorage : localStorage;
  }

  getToken(): string | null {
    return this.getStorage().getItem(environment.TOKEN_STORAGE_KEY);
  }

  getRefreshToken(): string | null {
    return this.getStorage().getItem(environment.REFRESH_TOKEN_STORAGE_KEY);
  }

  setToken(token: string): void {
    this.getStorage().setItem(environment.TOKEN_STORAGE_KEY, token);
  }

  setRefreshToken(token: string): void {
    this.getStorage().setItem(environment.REFRESH_TOKEN_STORAGE_KEY, token);
  }

  clearTokens(): void {
    const storage = this.getStorage();
    storage.removeItem(environment.TOKEN_STORAGE_KEY);
    storage.removeItem(environment.REFRESH_TOKEN_STORAGE_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// HTTP Client
class HttpClient {
  private tokenManager = TokenManager.getInstance();
  private refreshPromise: Promise<string | null> | null = null;

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || environment.API_TIMEOUT);

    try {
      const headers: Record<string, string> = {
        ...config.headers,
      };

      // Don't set Content-Type for FormData, let the browser set it with boundary
      const isFormData = data instanceof FormData;
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      // Add authorization header
      const token = await this.getValidToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const requestConfig: RequestInit = {
        method,
        headers,
        signal: config.signal || controller.signal,
      };

      if (data && method !== 'GET') {
        requestConfig.body = isFormData ? data : JSON.stringify(data);
      }

      const response = await fetch(getApiUrl(url), requestConfig);
      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      const contentType = response.headers.get('content-type');
      
      // Handle different response types
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return (await response.text()) as unknown as T;
      } else {
        return (await response.blob()) as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails: any = null;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorDetails = errorData;
    } catch {
      // If response is not JSON, use status text
    }

    // Handle authentication errors
    if (response.status === 401) {
      this.tokenManager.clearTokens();
      // Redirect to login or emit event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    const apiError: ApiError = {
      message: errorMessage,
      status: response.status,
      details: errorDetails,
    };

    throw apiError;
  }

  private async getValidToken(): Promise<string | null> {
    const token = this.tokenManager.getToken();
    
    if (!token) {
      return null;
    }

    // Check if token is expired
    if (this.tokenManager.isTokenExpired(token)) {
      return await this.refreshToken();
    }

    return token;
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple refresh requests
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) {
      this.tokenManager.clearTokens();
      return null;
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newToken = data.token || data.accessToken;
      
      if (newToken) {
        this.tokenManager.setToken(newToken);
        if (data.refreshToken) {
          this.tokenManager.setRefreshToken(data.refreshToken);
        }
        return newToken;
      }

      throw new Error('No token in refresh response');
    } catch (error) {
      this.tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw error;
    }
  }

  // Public methods
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('POST', url, data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('PUT', url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('PATCH', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>('DELETE', url, undefined, config);
  }

  // Query string builder
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Enhanced GET with query parameters
  async getWithParams<T>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<T> {
    const queryString = params ? this.buildQueryString(params) : '';
    const finalUrl = `${url}${queryString}`;
    return this.get<T>(finalUrl, config);
  }

  // File upload method
  async upload<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const token = await this.getValidToken();
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(url), {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return await response.json();
  }

  // File download method
  async downloadFile(url: string, filename?: string, params?: Record<string, any>): Promise<void> {
    try {
      const queryString = params ? this.buildQueryString(params) : '';
      const finalUrl = `${url}${queryString}`;
      
      const blob = await this.getBlob(finalUrl);
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      throw error;
    }
  }

  // Get blob response
  async getBlob(url: string, config?: RequestConfig): Promise<Blob> {
    const token = await this.getValidToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || environment.API_TIMEOUT);

    try {
      const headers: Record<string, string> = {
        ...config?.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(url), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return await response.blob();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Export singleton instance
export const apiClient = new HttpClient();

// Utility functions
export const setAuthToken = (token: string, refreshToken?: string): void => {
  const tokenManager = TokenManager.getInstance();
  tokenManager.setToken(token);
  if (refreshToken) {
    tokenManager.setRefreshToken(refreshToken);
  }
};

export const clearAuthTokens = (): void => {
  TokenManager.getInstance().clearTokens();
};

export const getAuthToken = (): string | null => {
  return TokenManager.getInstance().getToken();
};

// Error handling utilities
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === 'string' && typeof error.status === 'number';
};

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};