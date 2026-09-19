import {
  Catch,
  ExceptionFilter,
  HttpException,
  ArgumentsHost,
} from '@nestjs/common';
import { Request, Response } from 'express';

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
          : (exceptionResponse as Record<string, unknown>).error;

      response.status(status).json({
        statusCode: status,
        error: error,
        timestamp: new Date().toISOString(),
        message: message,
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
