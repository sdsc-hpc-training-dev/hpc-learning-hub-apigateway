/**
 * Curated paths represented by the v1.0.0 Learning Paths design.
 *
 * The design used the slugs `new-to-hpc` and `getting-started-expanse`.
 * CuratedLearningPath is UUID-backed, so each path has a fixed application ID
 * here while its title, metadata, and ordered canonical material references
 * match the design.
 */
export interface CuratedLearningPathSeed {
  id: string;
  title: string;
  description: string;
  audience: string;
  prerequisites: string;
  estimatedScope: string;
  isPublished: boolean;
  materialIds: readonly string[];
}

export const curatedLearningPaths: readonly CuratedLearningPathSeed[] = [
  {
    id: '2c4a593f-6b4c-4e81-8eb7-df4fcecb58f3',
    title: 'New to HPC',
    description:
      'Build a practical foundation before moving into parallel tools or system-specific workflows.',
    audience:
      'Learners with little or no High Performance Computing experience',
    prerequisites:
      'Comfort using a computer; command-line experience is helpful but not required.',
    estimatedScope: '4 guided steps',
    isPublished: true,
    materialIds: ['20000149', '20000013', '20000058', '20000150'],
  },
  {
    id: '7b7c31b0-2c96-4899-b324-5d91b1fc4eab',
    title: 'Getting Started with Expanse',
    description:
      'Learn how to access Expanse, schedule work, use interactive environments, and take the next step toward accelerated computing.',
    audience: 'New Expanse users and SDSC researchers',
    prerequisites:
      'Basic command-line familiarity and an SDSC account when following the material.',
    estimatedScope: '4 guided steps',
    isPublished: true,
    materialIds: ['20000013', '20000085', '20000015', '20000070'],
  },
];
