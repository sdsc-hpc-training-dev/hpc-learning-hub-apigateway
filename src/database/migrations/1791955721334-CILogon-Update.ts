import { MigrationInterface, QueryRunner } from 'typeorm';

export class CILogonUpdate1791955721334 implements MigrationInterface {
  name = 'CILogonUpdate1791955721334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "auth_identities" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "issuer" text NOT NULL,
                "subject" text NOT NULL,
                "identity_provider" text,
                "institution" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_auth_identities_issuer_subject" UNIQUE ("issuer", "subject"),
                CONSTRAINT "REL_c06a980d83c42611d27a294e55" UNIQUE ("user_id"),
                CONSTRAINT "PK_63a29aebcddd09448dbeee4666b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "oidc_login_transactions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "state_hash" text NOT NULL,
                "nonce" text NOT NULL,
                "pkce_verifier" text NOT NULL,
                "browser_binding_hash" text NOT NULL,
                "return_to" text,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "consumed_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_oidc_login_transactions_state_hash" UNIQUE ("state_hash"),
                CONSTRAINT "PK_2c473d63012fcff8880ec47f2e4" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_oidc_login_transactions_expires" ON "oidc_login_transactions" ("expires_at")
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "password_hash"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "display_name" text
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "last_login_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "email" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_identities"
            ADD CONSTRAINT "FK_c06a980d83c42611d27a294e55c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_identities" DROP CONSTRAINT "FK_c06a980d83c42611d27a294e55c"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "email"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "last_login_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "display_name"
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "password_hash" text NOT NULL
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_oidc_login_transactions_expires"
        `);
    await queryRunner.query(`
            DROP TABLE "oidc_login_transactions"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_identities"
        `);
  }
}
