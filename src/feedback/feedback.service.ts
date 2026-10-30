import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { CreateFeedbackDto } from './dto/create-feedback.dto';

const SURVEY_VERSION = 1;
const MAX_TEXT_CODE_UNITS = 500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAXIMUM = 60;

@Injectable()
export class FeedbackService {
  private windowStartedAt = Date.now();
  private acceptedInWindow = 0;

  constructor(private readonly dataSource: DataSource) {}

  async create(dto: CreateFeedbackDto): Promise<void> {
    this.checkRateLimit();
    const workedWell = this.optionalText(dto.workedWell, 'workedWell');
    const improvements = this.optionalText(dto.improvements, 'improvements');

    // Deliberately use INSERT only: the public Gateway role is not granted SELECT.
    await this.dataSource.query(
      `INSERT INTO site_feedback
        (id, created_at, survey_version, rating, found_what_needed, worked_well, improvements)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        new Date(),
        SURVEY_VERSION,
        dto.rating,
        dto.foundWhatNeeded ?? null,
        workedWell,
        improvements,
      ],
    );
  }

  private checkRateLimit(): void {
    const now = Date.now();
    if (now - this.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
      this.windowStartedAt = now;
      this.acceptedInWindow = 0;
    }
    if (this.acceptedInWindow >= RATE_LIMIT_MAXIMUM) {
      throw new HttpException(
        'Feedback is temporarily rate limited',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.acceptedInWindow += 1;
  }

  private optionalText(value: string | null | undefined, field: string): string | null {
    if (value === undefined || value === null) return null;
    if (value.length > MAX_TEXT_CODE_UNITS) {
      throw new BadRequestException(`${field} must be at most 500 characters`);
    }
    return value.trim() ? value : null;
  }
}
