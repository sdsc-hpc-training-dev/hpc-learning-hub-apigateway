import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CuratedLearningPath } from '../../database/entities/curated-learning-path.entity';
import { SnapshotStatus } from '../../database/entities/persistence.enums';

@Injectable()
export class LearningPathsRepository {
  constructor(
    @InjectRepository(CuratedLearningPath)
    private readonly paths: Repository<CuratedLearningPath>,
  ) {}

  findPublished(): Promise<CuratedLearningPath[]> {
    return this.publishedPathsQuery().getMany();
  }

  findPublishedById(pathId: string): Promise<CuratedLearningPath | null> {
    return this.publishedPathsQuery()
      .andWhere('path.id = :pathId', { pathId })
      .getOne();
  }

  private publishedPathsQuery(): SelectQueryBuilder<CuratedLearningPath> {
    return this.paths
      .createQueryBuilder('path')
      .innerJoinAndSelect('path.items', 'item')
      .innerJoinAndSelect('item.material', 'material')
      .innerJoin('material.snapshot', 'snapshot')
      .where('path.isPublished = :isPublished', { isPublished: true })
      .andWhere('snapshot.status = :snapshotStatus', {
        snapshotStatus: SnapshotStatus.ACTIVE,
      })
      .orderBy('path.title', 'ASC')
      .addOrderBy('path.id', 'ASC')
      .addOrderBy('item.position', 'ASC');
  }
}
