import { Body, Controller, Header, Post } from '@nestjs/common';
import { BugReportsService } from './bug-reports.service';

@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly reports: BugReportsService) {}

  @Post()
  @Header('Cache-Control', 'no-store')
  async create(@Body() body: unknown): Promise<{ accepted: true }> {
    await this.reports.create(body);
    return { accepted: true };
  }
}
