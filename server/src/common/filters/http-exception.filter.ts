import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, error } = this.extractMessageAndError(exception, status);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${error}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private extractMessageAndError(
    exception: unknown,
    status: number,
  ): { message: string; error: string } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { message: res, error: exception.name };
      }
      if (typeof res === 'object' && res !== null) {
        const obj = res as { message?: unknown; error?: unknown };
        const raw = obj.message;
        const message = Array.isArray(raw)
          ? raw.join(', ')
          : typeof raw === 'string'
            ? raw
            : exception.message;
        const error =
          typeof obj.error === 'string' ? obj.error : exception.name;
        return { message, error };
      }
      return { message: exception.message, error: exception.name };
    }

    return {
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : exception instanceof Error
            ? exception.message
            : 'Unknown error',
      error: 'InternalServerError',
    };
  }
}
