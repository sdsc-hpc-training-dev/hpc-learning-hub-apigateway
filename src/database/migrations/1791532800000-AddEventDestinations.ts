import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventDestinations1791532800000 implements MigrationInterface {
  name = 'AddEventDestinations1791532800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_editions" ADD COLUMN IF NOT EXISTS "event_url" text',
    );
    await queryRunner.query(
      'ALTER TABLE "event_editions" ADD COLUMN IF NOT EXISTS "registration_url" text',
    );
    await queryRunner.query(
      'ALTER TABLE "event_editions" ADD COLUMN IF NOT EXISTS "is_time_displayed" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_editions" DROP COLUMN IF EXISTS "is_time_displayed"',
    );
    await queryRunner.query(
      'ALTER TABLE "event_editions" DROP COLUMN IF EXISTS "registration_url"',
    );
    await queryRunner.query(
      'ALTER TABLE "event_editions" DROP COLUMN IF EXISTS "event_url"',
    );
  }
}
