import { Injectable, NotFoundException } from '@nestjs/common';
import { CuratedLearningPath } from '../database/entities/curated-learning-path.entity';
import { LearningPathResponseDto } from './dto/learning-path-response.dto';
import { LearningPathsRepository } from './persistence/learning-paths.repository';

@Injectable()
export class LearningPathsService {
  constructor(
    private readonly learningPathsRepository: LearningPathsRepository,
  ) {}

  async findAll(): Promise<LearningPathResponseDto[]> {
    const paths = await this.learningPathsRepository.findPublished();

    return paths.map((path) => this.toResponse(path));
  }

  async findOne(pathId: string): Promise<LearningPathResponseDto> {
    const path = await this.learningPathsRepository.findPublishedById(pathId);

    if (!path) {
      throw new NotFoundException(`Learning path "${pathId}" was not found`);
    }

    return this.toResponse(path);
  }

  private toResponse(path: CuratedLearningPath): LearningPathResponseDto {
    return {
      id: path.id,
      title: path.title,
      description: path.description,
      audience: path.audience,
      prerequisites: path.prerequisites,
      estimatedScope: path.estimatedScope,
      items: [...path.items]
        .sort((left, right) => left.position - right.position)
        .map((item) => ({
          position: item.position,
          material: {
            id: item.material.id,
            title: item.material.title,
            description: item.material.description,
          },
        })),
    };
  }
}
