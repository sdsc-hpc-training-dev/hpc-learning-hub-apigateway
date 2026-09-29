import { MigrationInterface, QueryRunner } from 'typeorm';

const authenticationUpStatements = [
  `ALTER TABLE "curated_path_items" DROP CONSTRAINT "FK_curated_path_items_path"`,
  `ALTER TABLE "curated_path_items" DROP CONSTRAINT "FK_curated_path_items_material"`,
  `CREATE TABLE "auth_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_seen_at" TIMESTAMP WITH TIME ZONE, "revoked_at" TIMESTAMP WITH TIME ZONE, "ip_address" inet, "user_agent" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fc7c8b01bebb6839399c494d68a" UNIQUE ("token_hash"), CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id"))`,
  `CREATE INDEX "IDX_auth_sessions_active_user" ON "auth_sessions" ("user_id", "expires_at")`,
  `CREATE TABLE "personal_learning_paths" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner_user_id" uuid NOT NULL, "title" text NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d7f00572169e838973b5a515293" PRIMARY KEY ("id"))`,
  `CREATE INDEX "IDX_personal_learning_paths_owner_updated" ON "personal_learning_paths" ("owner_user_id", "updated_at")`,
  `CREATE TABLE "personal_path_items" ("path_id" uuid NOT NULL, "material_id" text NOT NULL, "position" integer NOT NULL, CONSTRAINT "UQ_personal_path_items_position" UNIQUE ("path_id", "position"), CONSTRAINT "CHK_personal_path_items_position" CHECK ("position" >= 0), CONSTRAINT "PK_8152750ffac76d09b272d906015" PRIMARY KEY ("path_id", "material_id"))`,
  `CREATE TYPE "public"."user_role_enum" AS ENUM('LEARNER', 'MAINTAINER', 'ADMIN')`,
  `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" text NOT NULL, "username" text NOT NULL, "password_hash" text NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'LEARNER', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_username" UNIQUE ("username"), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
  `CREATE TYPE "public"."auth_challenge_purpose_enum" AS ENUM('LOGIN')`,
  `CREATE TABLE "auth_challenges" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "purpose" "public"."auth_challenge_purpose_enum" NOT NULL, "code_hash" text NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6993bc9c45bbf5948e4118de560" PRIMARY KEY ("id"))`,
  `CREATE INDEX "IDX_auth_challenges_user_purpose" ON "auth_challenges" ("user_id", "purpose", "expires_at")`,
  `ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
  `ALTER TABLE "personal_learning_paths" ADD CONSTRAINT "FK_fd3964e22a1e48c55a3a048bb1d" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
  `ALTER TABLE "personal_path_items" ADD CONSTRAINT "FK_c8136f656ca99482a7847eb9a80" FOREIGN KEY ("path_id") REFERENCES "personal_learning_paths"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
  `ALTER TABLE "personal_path_items" ADD CONSTRAINT "FK_c928da8057b245a1549836a38f2" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
  `ALTER TABLE "auth_challenges" ADD CONSTRAINT "FK_ce2bfa62e2ffd702457bc39b7eb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
  `ALTER TABLE "curated_path_items" ADD CONSTRAINT "FK_c0e78f17e2d1c980fc14bb54ad2" FOREIGN KEY ("path_id") REFERENCES "curated_learning_paths"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
  `ALTER TABLE "curated_path_items" ADD CONSTRAINT "FK_a1e338a5a1c7a016a2e4c6dcfd0" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
] as const;

export class CreateAuthenticationTables1790723644950 implements MigrationInterface {
  name = 'CreateAuthenticationTables1790723644950';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.executeStatements(queryRunner, authenticationUpStatements);
  }

  private async executeStatements(
    queryRunner: QueryRunner,
    statements: readonly string[],
  ): Promise<void> {
    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "curated_path_items" DROP CONSTRAINT "FK_a1e338a5a1c7a016a2e4c6dcfd0"
        `);
    await queryRunner.query(`
            ALTER TABLE "curated_path_items" DROP CONSTRAINT "FK_c0e78f17e2d1c980fc14bb54ad2"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_challenges" DROP CONSTRAINT "FK_ce2bfa62e2ffd702457bc39b7eb"
        `);
    await queryRunner.query(`
            ALTER TABLE "personal_path_items" DROP CONSTRAINT "FK_c928da8057b245a1549836a38f2"
        `);
    await queryRunner.query(`
            ALTER TABLE "personal_path_items" DROP CONSTRAINT "FK_c8136f656ca99482a7847eb9a80"
        `);
    await queryRunner.query(`
            ALTER TABLE "personal_learning_paths" DROP CONSTRAINT "FK_fd3964e22a1e48c55a3a048bb1d"
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_challenges_user_purpose"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_challenges"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."auth_challenge_purpose_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."user_role_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "personal_path_items"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_personal_learning_paths_owner_updated"
        `);
    await queryRunner.query(`
            DROP TABLE "personal_learning_paths"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_sessions_active_user"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_sessions"
        `);
    await queryRunner.query(`
            ALTER TABLE "curated_path_items"
            ADD CONSTRAINT "FK_curated_path_items_material" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "curated_path_items"
            ADD CONSTRAINT "FK_curated_path_items_path" FOREIGN KEY ("path_id") REFERENCES "curated_learning_paths"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
