/**
 * Centralized error handling for API routes
 *
 * Features:
 * - Custom error classes with status codes
 * - Detailed logging for debugging
 * - User-friendly error messages
 * - Development mode shows stack traces
 * - Production mode hides sensitive info
 */

import { NextResponse } from "next/server";

/**
 * Custom application error class
 * Use this for operational errors that should be returned to the client
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error types for common scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, true);
  }
}

/**
 * Format error for logging (detailed)
 */
function formatErrorForLogging(error: any, context: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  const errorDetails: any = {
    timestamp,
    name: error.name,
    message: error.message,
    statusCode: error.statusCode || 500,
    stack: error.stack,
    isOperational: error.isOperational || false,
    context,
  };

  // For Prisma errors, include specific details
  if (error.code) {
    errorDetails.prismaCode = error.code;
    errorDetails.meta = error.meta;
  }

  return errorDetails;
}

/**
 * Format error for client response (safe)
 */
function formatErrorForClient(error: any, isDevelopment: boolean) {
  const statusCode = error.statusCode || 500;

  // Base response
  const response: any = {
    error: error.message || 'An unexpected error occurred',
    statusCode,
  };

  // In development, include additional debugging info
  if (isDevelopment) {
    response.debug = {
      name: error.name,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { meta: error.meta }),
    };
  }

  // In production, provide error ID for support reference
  if (!isDevelopment && !error.isOperational) {
    response.error = 'An unexpected error occurred. Please try again later.';
    response.errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  return response;
}

/**
 * Main error handler for API routes
 *
 * Usage in API routes:
 * ```
 * import { handleApiError } from '@/lib/errorHandler';
 *
 * try {
 *   // ... your code
 * } catch (error) {
 *   return handleApiError(error, { route: '/api/add-to-bag', userId: user.id });
 * }
 * ```
 *
 * @param {Error} error - The error to handle
 * @param {Object} context - Additional context for logging (e.g., route, userId)
 * @returns {NextResponse} - Formatted error response
 */
export function handleApiError(error: any, context: Record<string, any> = {}) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log detailed error for debugging (server-side only)
  const logDetails = formatErrorForLogging(error, context);

  if (isDevelopment) {
    // In dev, log to console with full details
    console.error('❌ API Error:', JSON.stringify(logDetails, null, 2));
  } else {
    // In production, log in a format suitable for log aggregation
    console.error(JSON.stringify(logDetails));
  }

  // Handle specific error types
  if (error instanceof AppError) {
    // Known operational errors - safe to send to client
    const clientError = formatErrorForClient(error, isDevelopment);
    return NextResponse.json(clientError, { status: error.statusCode });
  }

  // Handle Prisma errors
  if (error.code?.startsWith('P')) {
    return handlePrismaError(error, isDevelopment);
  }

  // Handle Zod validation errors (shouldn't reach here if using validateData, but just in case)
  if (error.name === 'ZodError') {
    const validationError = new ValidationError(
      error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    );
    const clientError = formatErrorForClient(validationError, isDevelopment);
    return NextResponse.json(clientError, { status: 400 });
  }

  // Unknown errors - don't leak details in production
  const clientError = formatErrorForClient(error, isDevelopment);
  return NextResponse.json(clientError, { status: 500 });
}

/**
 * Handle Prisma-specific errors with friendly messages
 */
function handlePrismaError(error: any, isDevelopment: boolean) {
  let message = 'Database error occurred';
  let statusCode = 500;

  // Map Prisma error codes to user-friendly messages
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target?.[0] || 'field';
      message = `A record with this ${target} already exists`;
      statusCode = 409;
      break;
    case 'P2025':
      // Record not found
      message = 'The requested resource was not found';
      statusCode = 404;
      break;
    case 'P2003':
      // Foreign key constraint failed
      message = 'Cannot perform operation due to related records';
      statusCode = 400;
      break;
    case 'P2014':
      // Required relation violation
      message = 'The operation violates a required relationship';
      statusCode = 400;
      break;
    default:
      message = 'A database error occurred';
      statusCode = 500;
  }

  const clientError: any = {
    error: message,
    statusCode,
  };

  if (isDevelopment) {
    clientError.debug = {
      prismaCode: error.code,
      meta: error.meta,
      message: error.message,
    };
  }

  return NextResponse.json(clientError, { status: statusCode });
}

/**
 * Async error wrapper for API route handlers
 * Automatically catches errors and handles them
 *
 * Usage:
 * ```
 * export const POST = asyncHandler(async (req) => {
 *   // Your code here - errors will be caught automatically
 *   const data = await someAsyncOperation();
 *   return NextResponse.json(data);
 * }, { route: '/api/add-to-bag' });
 * ```
 */
export function asyncHandler(handler: (...args: any[]) => Promise<any>, context: Record<string, any> = {}) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Helper to throw errors easily
 *
 * Usage:
 * ```
 * if (!user) throwError('User not found', 404);
 * ```
 */
export function throwError(message: string, statusCode = 500) {
  throw new AppError(message, statusCode);
}
