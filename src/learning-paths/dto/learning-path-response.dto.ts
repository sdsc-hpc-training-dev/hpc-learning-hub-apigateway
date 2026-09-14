interface LearningPathMaterialResponseDto {
  id: string;
  title: string;
  description: string | null;
}

interface LearningPathItemResponseDto {
  position: number;
  material: LearningPathMaterialResponseDto;
}

export interface LearningPathResponseDto {
  id: string;
  title: string;
  description: string | null;
  audience: string | null;
  prerequisites: string | null;
  estimatedScope: string | null;
  items: LearningPathItemResponseDto[];
}
