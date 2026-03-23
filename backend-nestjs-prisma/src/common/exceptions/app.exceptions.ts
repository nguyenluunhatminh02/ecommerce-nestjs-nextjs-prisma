import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super(message, HttpStatus.CONFLICT);
  }
}

export class InsufficientStockException extends HttpException {
  constructor(productName?: string) {
    const message = productName
      ? `Insufficient stock for product: ${productName}`
      : 'Insufficient stock';
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid email or password') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends HttpException {
  constructor(message = 'Account is locked due to too many failed login attempts') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class EmailNotVerifiedException extends HttpException {
  constructor(message = 'Please verify your email address before logging in') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ForbiddenResourceException extends HttpException {
  constructor(message = 'You do not have permission to access this resource') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message = 'Invalid or expired token') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class BusinessRuleException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
