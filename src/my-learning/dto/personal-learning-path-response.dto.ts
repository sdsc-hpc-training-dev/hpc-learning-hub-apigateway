export class PersonalLearningPathResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  items!: { materialId: string; position: number }[];
}
