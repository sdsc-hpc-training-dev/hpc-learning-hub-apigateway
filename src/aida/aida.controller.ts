import { Controller, Get } from '@nestjs/common';
import { AidaService } from './aida.service';

@Controller('aida')
export class AidaController {
  constructor(private readonly aidaService: AidaService) {}

  @Get()
  findAll(): [] {
    return this.aidaService.findAll();
  }
}
