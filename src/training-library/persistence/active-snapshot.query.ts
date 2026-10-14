import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CatalogSnapshot } from '../../database/entities/catalog-snapshot.entity';
import { SnapshotStatus } from '../../database/entities/persistence.enums';

@Injectable()
export class ActiveSnapshotQuery {
  constructor(private readonly dataSource: DataSource) {}

  async findId(): Promise<string | null> {
    const snapshot = await this.dataSource
      .getRepository(CatalogSnapshot)
      .findOne({
        select: { id: true },
        where: { status: SnapshotStatus.ACTIVE },
      });

    return snapshot?.id ?? null;
  }
}
