import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ArgumentsHost,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;

      const error =
        typeof exceptionResponse == 'string'
          ? 'Error'
          : ((exceptionResponse as Record<string, unknown>).error ??
            Object.entries(STATUS_CODES).find(
              ([code]) => Number(code) === status,
            )?.[1] ??
            'Error');

      response.status(status).json({
        statusCode: status,
        error: error,
        timestamp: new Date().toISOString(),
        message: message,
        path: request.url,
      });
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      (exception as { type?: unknown }).type === 'entity.too.large'
    ) {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        timestamp: new Date().toISOString(),
        message: 'Request body is too large',
        path: request.url,
      });
    } else {
      response.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        message: 'Internal server error',
        path: request.url,
      });
    }
  }
}
