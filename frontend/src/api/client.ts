const API_BASE = '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: Array<{ field: string; message: string }>;
  contrastCheck?: any;
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token);
  }

  public clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    this.setAccessToken(access);
    this.setRefreshToken(refresh);
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const json = await res.json();
      if (json.data?.accessToken) {
        this.setAccessToken(json.data.accessToken);
        if (json.data.refreshToken) {
          this.setRefreshToken(json.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, attempt silent token refresh once
    if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/login')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg) as Error & { details?: any; status: number };
      error.details = data.errors || data.details;
      error.status = response.status;
      throw error;
    }

    return data;
  }

  public get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
