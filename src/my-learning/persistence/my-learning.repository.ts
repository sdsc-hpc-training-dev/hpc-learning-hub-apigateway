import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In, QueryFailedError } from 'typeorm';
import { TrainingMaterial } from '../../database/entities/catalog.entity';
import {
  PersonalLearningPath,
  PersonalPathItem,
} from '../../database/entities/personal-learning-path.entity';
import { CreatePersonalLearningPathDto } from '../dto/create-personal-learning-path.dto';
import { PersonalPathItemDto } from '../dto/personal-path-item.dto';
import { UpdatePersonalLearningPathDto } from '../dto/update-personal-learning-path.dto';
import { Bookmark } from '../../database/entities/bookmark.entity';

@Injectable()
export class MyLearningRepository {
  constructor(private readonly dataSource: DataSource) {}

  findByOwner(ownerUserId: string): Promise<PersonalLearningPath[]> {
    return this.dataSource.getRepository(PersonalLearningPath).find({
      where: { ownerUserId },
      relations: { items: true },
      order: { updatedAt: 'DESC', id: 'ASC' },
    });
  }

  findById(
    ownerUserId: string,
    id: string,
  ): Promise<PersonalLearningPath | null> {
    return this.dataSource.getRepository(PersonalLearningPath).findOne({
      where: { id, ownerUserId },
      relations: { items: true },
    });
  }

  create(
    ownerUserId: string,
    input: CreatePersonalLearningPathDto,
  ): Promise<PersonalLearningPath> {
    return this.dataSource.transaction(async (manager) => {
      const items = input.items ?? [];
      await this.validateMaterials(manager, ownerUserId, items);
      const paths = manager.getRepository(PersonalLearningPath);
      const path = await paths.save(
        paths.create({
          ownerUserId,
          title: input.title,
          description: input.description ?? null,
        }),
      );
      path.items = await this.insertItems(manager, path.id, items);
      return path;
    });
  }

  update(
    ownerUserId: string,
    id: string,
    input: UpdatePersonalLearningPathDto,
  ): Promise<PersonalLearningPath | null> {
    return this.dataSource.transaction(async (manager) => {
      const paths = manager.getRepository(PersonalLearningPath);
      const path = await paths.findOne({
        where: { id, ownerUserId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!path) return null;
      if (input.items !== undefined) {
        await this.validateMaterials(manager, ownerUserId, input.items);
        await manager.getRepository(PersonalPathItem).delete({ pathId: id });
        path.items = await this.insertItems(manager, id, input.items);
      } else {
        path.items = await manager
          .getRepository(PersonalPathItem)
          .find({ where: { pathId: id } });
      }
      if (input.title !== undefined) path.title = input.title;
      if (input.description !== undefined) path.description = input.description;
      path.updatedAt = new Date();
      await paths.save(path);
      return path;
    });
  }

  async delete(ownerUserId: string, id: string): Promise<boolean> {
    const result = await this.dataSource
      .getRepository(PersonalLearningPath)
      .delete({ id, ownerUserId });
    return result.affected === 1;
  }

  retrieveBookmarks(userId: string): Promise<Bookmark[]> {
    return this.dataSource.getRepository(Bookmark).find({
      where: { userId },
      order: { createdAt: 'DESC', id: 'ASC' },
    });
  }

  async addBookmark(userId: string, materialId: string): Promise<Bookmark> {
    const material = await this.dataSource
      .getRepository(TrainingMaterial)
      .findOne({ where: { id: materialId }, select: { id: true } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const bookmark = new Bookmark();
    bookmark.materialId = materialId;
    bookmark.userId = userId;
    try {
      return await this.dataSource.getRepository(Bookmark).save(bookmark);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string; constraint?: string }).code ===
          '23505' &&
        (error.driverError as { code?: string; constraint?: string })
          .constraint === 'UQ_bookmarks_user_material'
      ) {
        throw new ConflictException('Material is already saved');
      }
      throw error;
    }
  }

  async deleteBookmark(userId: string, materialId: string): Promise<void> {
    const repository = this.dataSource.getRepository(Bookmark);
    await repository.delete({ userId, materialId });
  }

  private async validateMaterials(
    manager: EntityManager,
    userId: string,
    items: PersonalPathItemDto[],
  ): Promise<void> {
    if (!items.length) return;

    const materialIds = [...new Set(items.map((item) => item.materialId))];
    const bookmarks = await manager.getRepository(Bookmark).find({
      where: {
        userId: userId,
        materialId: In(materialIds),
      },
      select: { materialId: true },
    });

    if (bookmarks.length !== materialIds.length) {
      throw new BadRequestException(
        'Learning paths can only contain your bookmarked materials',
      );
    }
    const materials = await manager.getRepository(TrainingMaterial).find({
      where: { id: In(items.map((item) => item.materialId)) },
      select: { id: true },
    });
    if (materials.length !== items.length) {
      throw new BadRequestException('One or more material IDs are invalid');
    }
  }

  private async insertItems(
    manager: EntityManager,
    pathId: string,
    items: PersonalPathItemDto[],
  ): Promise<PersonalPathItem[]> {
    if (!items.length) return [];
    const repository = manager.getRepository(PersonalPathItem);
    return repository.save(
      items.map((item) =>
        repository.create({
          pathId,
          materialId: item.materialId,
          position: item.position,
        }),
      ),
    );
  }
}
