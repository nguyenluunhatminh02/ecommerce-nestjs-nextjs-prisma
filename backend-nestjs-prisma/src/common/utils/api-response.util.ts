export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;

  constructor(success: boolean, message: string, data: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error<T>(message: string, data: T = null): ApiResponse<T> {
    return new ApiResponse(false, message, data);
  }
}
