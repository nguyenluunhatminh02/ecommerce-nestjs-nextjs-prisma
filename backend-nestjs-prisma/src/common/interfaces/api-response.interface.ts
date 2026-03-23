export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface IErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: Record<string, string[]>;
  timestamp: string;
  path?: string;
}
