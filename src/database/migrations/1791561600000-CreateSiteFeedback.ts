import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSiteFeedback1791561600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "site_feedback" (
        "id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL,
        "survey_version" integer NOT NULL DEFAULT 1,
        "rating" integer NOT NULL,
        "found_what_needed" text,
        "worked_well" text,
        "improvements" text,
        CONSTRAINT "PK_site_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_site_feedback_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "CHK_site_feedback_found_what_needed" CHECK ("found_what_needed" IS NULL OR "found_what_needed" IN ('yes', 'partly', 'no', 'just_browsing')),
        CONSTRAINT "CHK_site_feedback_worked_well_length" CHECK ("worked_well" IS NULL OR char_length("worked_well") <= 500),
        CONSTRAINT "CHK_site_feedback_improvements_length" CHECK ("improvements" IS NULL OR char_length("improvements") <= 500)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_site_feedback_created_at" ON "site_feedback" ("created_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "site_feedback"');
  }
}
