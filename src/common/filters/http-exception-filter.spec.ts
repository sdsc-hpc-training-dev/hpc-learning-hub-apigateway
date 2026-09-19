import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception-filter';

interface CapturedResponse {
  body: unknown;
  statusCode: number;
}

function hostFor(url: string): {
  host: ArgumentsHost;
  response: CapturedResponse;
} {
  const response: CapturedResponse = {
    body: undefined,
    statusCode: 0,
  };
  const httpResponse = {
    status(statusCode: number) {
      response.statusCode = statusCode;
      return {
        json(body: unknown) {
          response.body = body;
        },
      };
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => httpResponse,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

function asErrorResponse(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new Error('Expected an object error response');
  }

  return body as Record<string, unknown>;
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('formats a not-found exception', () => {
    const { host, response } = hostFor('/api/v1/event-editions/missing');

    filter.catch(new NotFoundException('Event "missing" was not found'), host);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Event "missing" was not found',
        path: '/api/v1/event-editions/missing',
      }),
    );
    expect(asErrorResponse(response.body).timestamp).toEqual(
      expect.any(String),
    );
  });

  it('formats a string-based HTTP exception response', () => {
    const { host, response } = hostFor('/api/v1/materials');

    filter.catch(
      new HttpException('A deliberate client error', HttpStatus.I_AM_A_TEAPOT),
      host,
    );

    expect(response.statusCode).toBe(HttpStatus.I_AM_A_TEAPOT);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: HttpStatus.I_AM_A_TEAPOT,
        error: 'Error',
        message: 'A deliberate client error',
        path: '/api/v1/materials',
      }),
    );
  });

  it('preserves validation messages from a bad-request exception', () => {
    const { host, response } = hostFor('/api/v1/materials?page=invalid');

    filter.catch(
      new BadRequestException(['page must be an integer number']),
      host,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['page must be an integer number'],
      }),
    );
  });

  it('hides unexpected error details behind a generic 500 response', () => {
    const { host, response } = hostFor('/api/v1/materials');

    filter.catch(new Error('database password leaked'), host);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain(
      'database password leaked',
    );
    expect(asErrorResponse(response.body).timestamp).toEqual(
      expect.any(String),
    );
  });
});
