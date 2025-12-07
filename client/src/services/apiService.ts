import { API_ENDPOINTS } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || 'UNKNOWN_ERROR',
          message: data.error?.message || data.message || 'Erro desconhecido',
        },
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  }

  async get<T>(url: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
        },
      };
    }
  }

  async post<T>(url: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
        },
      };
    }
  }

  async put<T>(url: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
        },
      };
    }
  }

  async patch<T>(url: string, body: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
        },
      };
    }
  }

  async delete<T>(url: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
        },
      };
    }
  }
}

export const apiService = new ApiService();

