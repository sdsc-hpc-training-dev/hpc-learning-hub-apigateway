import dataSource from '../data-source';
import {
  CuratedLearningPath,
  CuratedPathItem,
} from '../entities/curated-learning-path.entity';
import { curatedLearningPaths } from './curated-learning-paths.data';

async function seedPaths(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const curatedLearningPathRepository =
        manager.getRepository(CuratedLearningPath);
      const curatedPathItemRepository = manager.getRepository(CuratedPathItem);

      for (const pathSeed of curatedLearningPaths) {
        await curatedLearningPathRepository.upsert(
          {
            id: pathSeed.id,
            title: pathSeed.title,
            description: pathSeed.description,
            audience: pathSeed.audience,
            prerequisites: pathSeed.prerequisites,
            estimatedScope: pathSeed.estimatedScope,
            isPublished: pathSeed.isPublished,
          },
          ['id'],
        );

        await curatedPathItemRepository.delete({ pathId: pathSeed.id });

        await curatedPathItemRepository.insert(
          pathSeed.materialIds.map((materialId, position) => ({
            pathId: pathSeed.id,
            materialId,
            position,
          })),
        );
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

void seedPaths().catch((error: unknown) => {
  console.error('Failed to seed curated learning paths.', error);
  process.exitCode = 1;
});
