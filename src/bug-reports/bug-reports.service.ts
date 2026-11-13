import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

const fields = new Set(['title', 'description', 'pageUrl', 'steps']);
// eslint-disable-next-line no-control-regex -- Reject non-text controls before writing to PostgreSQL.
const controlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

function boundedText(value: unknown, maximum: number): string | null {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== 'string' ||
    value.length > maximum ||
    controlCharacters.test(value)
  ) {
    throw new BadRequestException();
  }
  return value.trim() || null;
}

function publicPageUrl(value: unknown): string | null {
  const text = boundedText(value, 500);
  if (!text) return null;
  const url = URL.parse(text);
  if (
    !url ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new BadRequestException();
  }
  url.search = '';
  url.hash = '';
  return boundedText(url.href, 500);
}

export function normalizeReport(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException();
  }
  if (Object.keys(body).some((key) => !fields.has(key))) {
    throw new BadRequestException();
  }
  const { title, description, pageUrl, steps } = body as Record<
    string,
    unknown
  >;
  const summary = boundedText(title, 100);
  const details = boundedText(description, 1000);
  if (!summary || !details) throw new BadRequestException();
  return [summary, details, publicPageUrl(pageUrl), boundedText(steps, 1000)];
}

@Injectable()
export class BugReportsService {
  private window = Math.floor(Date.now() / 60_000);
  private submissions = 0;

  constructor(private readonly database: DataSource) {}

  async create(body: unknown): Promise<void> {
    const values = normalizeReport(body);
    const minute = Math.floor(Date.now() / 60_000);
    if (minute !== this.window) {
      this.window = minute;
      this.submissions = 0;
    }
    if (this.submissions >= 30) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.submissions += 1;

    await this.database.query(
      `INSERT INTO public.bug_reports
        (id, title, description, page_url, reproduction_steps)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), ...values],
    );
  }
}
