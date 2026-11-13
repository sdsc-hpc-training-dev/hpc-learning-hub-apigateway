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

    if (/^\/api\/v1\/bug-reports\/?$/i.test(request.path)) {
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : parserErrorStatus(exception);
      response
        .set('Cache-Control', 'no-store')
        .status(status)
        .json({ statusCode: status, message: 'Report could not be accepted' });
      return;
    }

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

function parserErrorStatus(exception: unknown): number {
  if (typeof exception !== 'object' || exception === null) return 500;
  const { type } = exception as { type?: unknown };
  if (type === 'entity.too.large') return 413;
  if (type === 'encoding.unsupported' || type === 'charset.unsupported') {
    return 415;
  }
  if (type === 'entity.parse.failed' || type === 'request.size.invalid') {
    return 400;
  }
  return 500;
}
