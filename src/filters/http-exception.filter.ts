import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from 'src/interfaces/error-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Unexpected error';
    let errors: string[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseBody = exceptionResponse as {
        message?: string | string[];
      };

      if (Array.isArray(responseBody.message)) {
        message = 'Validation failed';
        errors = responseBody.message;
      } else if (responseBody.message) {
        message = responseBody.message;
      }
    }

    this.logger.warn(
      `${request.method} ${request.path} -> ${statusCode}: ${message}`,
    );

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
    };

    response.status(statusCode).json(body);
  }
}
