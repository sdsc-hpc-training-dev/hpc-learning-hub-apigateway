import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateFeedbackDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accepted: true }> {
    await this.feedbackService.create(dto);
    response.setHeader('Cache-Control', 'no-store');
    return { accepted: true };
  }
}
