import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { logger } from 'src/utils/logger';

const ERROR_CODES: Record<string, string> = {
  VALIDATION_ERROR: 'VAL001',
  NOT_FOUND: 'NOT001',
  UNAUTHORIZED: 'UNA001',
  FORBIDDEN: 'FOR001',
  INTERNAL_ERROR: 'INT001',
  BAD_REQUEST: 'BAD001',
  CONFLICT: 'CON001',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      this.generateId();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = ERROR_CODES.INTERNAL_ERROR;
    let errors: unknown[] | undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      status = exception.getStatus();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        errors = responseObj.errors as unknown[] | undefined;
      } else {
        message = exception.message;
      }

      if (status === HttpStatus.BAD_REQUEST) {
        errorCode = ERROR_CODES.BAD_REQUEST;
      } else if (status === HttpStatus.UNAUTHORIZED) {
        errorCode = ERROR_CODES.UNAUTHORIZED;
      } else if (status === HttpStatus.FORBIDDEN) {
        errorCode = ERROR_CODES.FORBIDDEN;
      } else if (status === HttpStatus.NOT_FOUND) {
        errorCode = ERROR_CODES.NOT_FOUND;
      } else if (status === HttpStatus.CONFLICT) {
        errorCode = ERROR_CODES.CONFLICT;
      }
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      stack = exception.stack;
    }

    const logMeta = {
      errorCode,
      status,
      method: request.method,
      path: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      errorStack: stack,
      errors,
    };

    logger.error(`[${errorCode}] ${message}`, logMeta, correlationId);

    response.status(status).json({
      errorCode,
      message,
      errors,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
