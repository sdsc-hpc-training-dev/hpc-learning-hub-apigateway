import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBugReports1794528000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.bug_reports (
        id uuid PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
        title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100 AND char_length(title) <= 100),
        description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 1000 AND char_length(description) <= 1000),
        page_url text CHECK (char_length(page_url) <= 500),
        reproduction_steps text CHECK (char_length(reproduction_steps) <= 1000)
      );
      CREATE INDEX bug_reports_created_at_idx ON public.bug_reports (created_at);
      REVOKE ALL ON TABLE public.bug_reports FROM PUBLIC;
    `);
  }

  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Roll back the application without dropping saved bug reports.',
      ),
    );
  }
}
