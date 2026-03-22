import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  // Convert Prisma Decimal objects to numbers
  if (typeof obj === 'object' && obj !== null && typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[snakeToCamel(key)] = transformKeys(obj[key]);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Health check endpoints — pass through as-is
        const request = context.switchToHttp().getRequest();
        if (request?.url?.startsWith('/api/v1/health')) {
          return data;
        }

        // Already wrapped by ApiResponse.success() — has { success, data, timestamp }
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return { ...data, data: transformKeys(data.data) };
        }

        // Wrap raw responses and transform keys
        return {
          success: true,
          message: 'Success',
          data: transformKeys(data),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
