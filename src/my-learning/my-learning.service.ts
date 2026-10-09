import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PersonalLearningPath } from '../database/entities/personal-learning-path.entity';
import { CreatePersonalLearningPathDto } from './dto/create-personal-learning-path.dto';
import { UpdatePersonalLearningPathDto } from './dto/update-personal-learning-path.dto';
import { PersonalLearningPathResponseDto } from './dto/personal-learning-path-response.dto';
import { MyLearningRepository } from './persistence/my-learning.repository';
import { AddBookmarkDto } from './dto/add-bookmark.dto';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';
import { Bookmark } from '../database/entities/bookmark.entity';

@Injectable()
export class MyLearningService {
  constructor(private readonly repository: MyLearningRepository) {}

  async findBookmarks(userId: string): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.repository.retrieveBookmarks(userId);
    return bookmarks.map((bookmark) => this.toBookmarkResponse(bookmark));
  }

  async addBookmark(
    userId: string,
    input: AddBookmarkDto,
  ): Promise<BookmarkResponseDto> {
    return this.toBookmarkResponse(
      await this.repository.addBookmark(userId, input.materialId),
    );
  }

  deleteBookmark(userId: string, materialId: string): Promise<void> {
    return this.repository.deleteBookmark(userId, materialId);
  }

  private toBookmarkResponse(bookmark: Bookmark): BookmarkResponseDto {
    return {
      id: bookmark.id,
      materialId: bookmark.materialId,
      createdAt: bookmark.createdAt,
    };
  }

  async findAll(
    ownerUserId: string,
  ): Promise<PersonalLearningPathResponseDto[]> {
    const paths = await this.repository.findByOwner(ownerUserId);
    return paths.map((path) => this.toResponse(path));
  }

  async findOne(
    ownerUserId: string,
    id: string,
  ): Promise<PersonalLearningPathResponseDto> {
    const path = await this.repository.findById(ownerUserId, id);
    if (!path) throw new NotFoundException('Learning path not found');
    return this.toResponse(path);
  }

  async create(
    ownerUserId: string,
    input: CreatePersonalLearningPathDto,
  ): Promise<PersonalLearningPathResponseDto> {
    return this.toResponse(await this.repository.create(ownerUserId, input));
  }

  async update(
    ownerUserId: string,
    id: string,
    input: UpdatePersonalLearningPathDto,
  ): Promise<PersonalLearningPathResponseDto> {
    if (
      input.title === undefined &&
      input.description === undefined &&
      input.items === undefined
    ) {
      throw new BadRequestException('Supply title, description, or items');
    }
    const path = await this.repository.update(ownerUserId, id, input);
    if (!path) throw new NotFoundException('Learning path not found');
    return this.toResponse(path);
  }

  async delete(ownerUserId: string, id: string): Promise<void> {
    if (!(await this.repository.delete(ownerUserId, id))) {
      throw new NotFoundException('Learning path not found');
    }
  }

  private toResponse(
    path: PersonalLearningPath,
  ): PersonalLearningPathResponseDto {
    return {
      id: path.id,
      title: path.title,
      description: path.description,
      createdAt: path.createdAt,
      updatedAt: path.updatedAt,
      items: [...path.items]
        .sort((left, right) => left.position - right.position)
        .map((item) => ({
          materialId: item.materialId,
          position: item.position,
        })),
    };
  }
}
