import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCuratedLearningPaths1789142400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "curated_learning_paths" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "description" text,
        "audience" text,
        "prerequisites" text,
        "estimated_scope" text,
        "is_published" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_curated_learning_paths" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_curated_learning_paths_public_order"
      ON "curated_learning_paths" ("is_published", "title", "id")
    `);
    await queryRunner.query(`
      CREATE TABLE "curated_path_items" (
        "path_id" uuid NOT NULL,
        "material_id" text NOT NULL,
        "position" integer NOT NULL,
        CONSTRAINT "PK_curated_path_items" PRIMARY KEY ("path_id", "material_id"),
        CONSTRAINT "UQ_curated_path_items_position" UNIQUE ("path_id", "position"),
        CONSTRAINT "CHK_curated_path_items_position" CHECK ("position" >= 0),
        CONSTRAINT "FK_curated_path_items_path" FOREIGN KEY ("path_id")
          REFERENCES "curated_learning_paths"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_curated_path_items_material" FOREIGN KEY ("material_id")
          REFERENCES "training_materials"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_curated_path_items_material_id"
      ON "curated_path_items" ("material_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "curated_path_items"');
    await queryRunner.query('DROP TABLE "curated_learning_paths"');
  }
}
