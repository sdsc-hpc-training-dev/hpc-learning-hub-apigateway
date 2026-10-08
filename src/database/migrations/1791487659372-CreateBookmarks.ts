import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookmarks1791487659372 implements MigrationInterface {
    name = 'CreateBookmarks1791487659372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "bookmarks" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "material_id" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_bookmarks_user_material" UNIQUE ("user_id", "material_id"),
                CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bookmarks_user_created" ON "bookmarks" ("user_id", "created_at")
        `);
        await queryRunner.query(`
            ALTER TABLE "bookmarks"
            ADD CONSTRAINT "FK_58a0fbaee65cd8959a870ee678c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookmarks"
            ADD CONSTRAINT "FK_0972ca239d011d8d93463a4990e" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_0972ca239d011d8d93463a4990e"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_58a0fbaee65cd8959a870ee678c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bookmarks_user_created"
        `);
        await queryRunner.query(`
            DROP TABLE "bookmarks"
        `);
    }

}
