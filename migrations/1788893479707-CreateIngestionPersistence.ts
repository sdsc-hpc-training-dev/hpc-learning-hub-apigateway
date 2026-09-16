/* eslint-disable max-lines-per-function -- Generated schema migration is intentionally linear. */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIngestionPersistence1788893479707 implements MigrationInterface {
  name = 'CreateIngestionPersistence1788893479707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
            CREATE TABLE "snapshot_import_errors" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "import_run_id" uuid NOT NULL,
                "stage" text NOT NULL,
                "entity_type" text,
                "source_record_id" text,
                "source_path" text,
                "error_code" text NOT NULL,
                "message" text NOT NULL,
                "details" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_169a390e9a93951f91797fd9810" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_snapshot_import_errors_import_run_id" ON "snapshot_import_errors" ("import_run_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."import_run_status_enum" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')
        `);
    await queryRunner.query(`
            CREATE TABLE "snapshot_import_runs" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "snapshot_id" text NOT NULL,
                "importer_version" text NOT NULL,
                "mapping_version" text,
                "status" "public"."import_run_status_enum" NOT NULL,
                "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "completed_at" TIMESTAMP WITH TIME ZONE,
                "source_entity_counts" jsonb NOT NULL DEFAULT '{}',
                "imported_entity_counts" jsonb NOT NULL DEFAULT '{}',
                "source_relationship_counts" jsonb NOT NULL DEFAULT '{}',
                "imported_relationship_counts" jsonb NOT NULL DEFAULT '{}',
                "source_chunk_count" integer NOT NULL DEFAULT '0',
                "imported_chunk_count" integer NOT NULL DEFAULT '0',
                "embedding_count" integer NOT NULL DEFAULT '0',
                "error_count" integer NOT NULL DEFAULT '0',
                "validation_passed" boolean NOT NULL DEFAULT false,
                "validation_report_key" text,
                CONSTRAINT "CHK_snapshot_import_runs_counts" CHECK (
                    "source_chunk_count" >= 0
                    AND "imported_chunk_count" >= 0
                    AND "embedding_count" >= 0
                    AND "error_count" >= 0
                ),
                CONSTRAINT "PK_b6b7f2d74f352d9498286e14817" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_snapshot_import_runs_snapshot_id" ON "snapshot_import_runs" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."snapshot_status_enum" AS ENUM(
                'RECEIVED',
                'VALIDATED',
                'ACTIVE',
                'REJECTED',
                'RETIRED'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "catalog_snapshots" (
                "id" text NOT NULL,
                "schema_version" text NOT NULL,
                "code_version" text,
                "pipeline_code_hash" text,
                "configuration_hash" text,
                "curation_version" text,
                "id_registry_version" text,
                "dataset_scope" text,
                "source_tree_dirty" boolean,
                "generated_at" TIMESTAMP WITH TIME ZONE,
                "bucket_object_key" text NOT NULL,
                "object_sha256" text NOT NULL,
                "manifest_sha256" text,
                "file_checksums" jsonb NOT NULL,
                "source_hashes" jsonb,
                "entity_counts" jsonb NOT NULL,
                "relationship_counts" jsonb NOT NULL,
                "projection_manifests" jsonb,
                "vocabulary_versions" jsonb,
                "status" "public"."snapshot_status_enum" NOT NULL,
                "validated_at" TIMESTAMP WITH TIME ZONE,
                "activated_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_d7611c056d6832e2f0dac97ffb7" UNIQUE ("bucket_object_key"),
                CONSTRAINT "CHK_catalog_snapshots_activated_status" CHECK (
                    "activated_at" IS NULL
                    OR "status" IN ('ACTIVE', 'RETIRED')
                ),
                CONSTRAINT "PK_4c8344814fe07b13ada2232d78a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_catalog_snapshots_one_active" ON "catalog_snapshots" ("status")
            WHERE "status" = 'ACTIVE'
        `);
    await queryRunner.query(`
            CREATE TABLE "event_series" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "name" text NOT NULL,
                "review_status" text,
                "source" text,
                CONSTRAINT "PK_9c68540164026e1a070a0a227f8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_series_snapshot_id" ON "event_series" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "event_editions" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "title" text,
                "description" text,
                "start_at" TIMESTAMP WITH TIME ZONE,
                "end_at" TIMESTAMP WITH TIME ZONE,
                "format" text,
                "location" text,
                "source_event_id" text,
                "source_date_text" text,
                "source_time_text" text,
                "source_file" text,
                CONSTRAINT "PK_0f133abe848376b00681176ba87" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_editions_start_at" ON "event_editions" ("start_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_editions_snapshot_id" ON "event_editions" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_editions_search" ON "event_editions" USING GIN (
                to_tsvector('simple'::regconfig, coalesce("title", '') || ' ' || coalesce("description", ''))
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "training_materials" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "title" text,
                "description" text,
                "source_repository" text,
                "source_commit" text,
                "grouping_method" text,
                "grouping_note" text,
                CONSTRAINT "PK_9c5f58bee5ce1af3378a5d3e671" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_training_materials_snapshot_id" ON "training_materials" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_training_materials_search" ON "training_materials" USING GIN (
                to_tsvector('simple'::regconfig, coalesce("title", '') || ' ' || coalesce("description", ''))
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."resource_type_enum" AS ENUM(
                'CATALOG_METADATA',
                'REPOSITORY',
                'REPOSITORY_SESSION',
                'SLIDES',
                'TRANSCRIPT',
                'VIDEO',
                'WEBPAGE'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "content_resources" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "resource_type" "public"."resource_type_enum" NOT NULL,
                "title" text,
                "canonical_url" text,
                "original_url" text,
                "source" text,
                "source_document" text,
                "status" text,
                "verification_status" text,
                "extraction_status" text,
                "content_hash" text,
                "session_key" text,
                "text_selection_policy" jsonb,
                "source_file_count" integer,
                "indexed_file_count" integer,
                "excluded_file_count" integer,
                "excluded_by_reason" jsonb,
                "requires_ocr" boolean,
                CONSTRAINT "CHK_content_resources_file_counts" CHECK (
                    ("source_file_count" IS NULL OR "source_file_count" >= 0)
                    AND ("indexed_file_count" IS NULL OR "indexed_file_count" >= 0)
                    AND ("excluded_file_count" IS NULL OR "excluded_file_count" >= 0)
                ),
                CONSTRAINT "PK_699c5472a2ad007887a236ac66c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_resources_type_status" ON "content_resources" ("resource_type", "status")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_resources_snapshot_id" ON "content_resources" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "people" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "name" text NOT NULL,
                "source" text,
                CONSTRAINT "PK_aa866e71353ee94c6cc51059c5b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_people_snapshot_id" ON "people" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_people_normalized_name" ON "people" (lower(btrim("name")))
        `);
    await queryRunner.query(`
            CREATE TABLE "topics" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "name" text NOT NULL,
                "description" text,
                "review_status" text,
                "source" text,
                CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_topics_snapshot_id" ON "topics" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_topics_normalized_name" ON "topics" (lower(btrim("name")))
        `);
    await queryRunner.query(`
            CREATE TABLE "tools" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "name" text NOT NULL,
                "review_status" text,
                "source" text,
                CONSTRAINT "PK_e23d56734caad471277bad8bf85" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_tools_snapshot_id" ON "tools" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_tools_normalized_name" ON "tools" (lower(btrim("name")))
        `);
    await queryRunner.query(`
            CREATE TABLE "systems" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "name" text NOT NULL,
                "review_status" text,
                "source" text,
                CONSTRAINT "PK_aec3139aedeb09c5ae27f2c94d3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_systems_snapshot_id" ON "systems" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_systems_normalized_name" ON "systems" (lower(btrim("name")))
        `);
    await queryRunner.query(`
            CREATE TABLE "content_resource_files" (
                "resource_id" text NOT NULL,
                "path" text NOT NULL,
                "content_hash" text,
                "position" integer NOT NULL,
                CONSTRAINT "CHK_content_resource_files_position" CHECK ("position" >= 0),
                CONSTRAINT "PK_77b1a418b3cf560d694120e6944" PRIMARY KEY ("resource_id", "path")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_resource_files_resource_id" ON "content_resource_files" ("resource_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "event_series_aliases" (
                "alias" text NOT NULL,
                "review_status" text,
                "source" text,
                "event_series_id" text NOT NULL,
                CONSTRAINT "PK_2158e785794df50752616851913" PRIMARY KEY ("alias", "event_series_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_series_aliases_event_series_id" ON "event_series_aliases" ("event_series_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_event_series_aliases_normalized" ON "event_series_aliases" (
                "event_series_id",
                lower(btrim("alias"))
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "topic_aliases" (
                "alias" text NOT NULL,
                "review_status" text,
                "source" text,
                "topic_id" text NOT NULL,
                CONSTRAINT "PK_7c0829764b7092c81bd1d076ab7" PRIMARY KEY ("alias", "topic_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_topic_aliases_topic_id" ON "topic_aliases" ("topic_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_topic_aliases_normalized" ON "topic_aliases" (
                "topic_id",
                lower(btrim("alias"))
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tool_aliases" (
                "alias" text NOT NULL,
                "review_status" text,
                "source" text,
                "tool_id" text NOT NULL,
                CONSTRAINT "PK_7893c1c952468ce3a0f2ec5e9db" PRIMARY KEY ("alias", "tool_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_tool_aliases_tool_id" ON "tool_aliases" ("tool_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_tool_aliases_normalized" ON "tool_aliases" (
                "tool_id",
                lower(btrim("alias"))
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "system_aliases" (
                "alias" text NOT NULL,
                "review_status" text,
                "source" text,
                "system_id" text NOT NULL,
                CONSTRAINT "PK_4a86c8cac9eb2f1484c979a8421" PRIMARY KEY ("alias", "system_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_system_aliases_system_id" ON "system_aliases" ("system_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_system_aliases_normalized" ON "system_aliases" (
                "system_id",
                lower(btrim("alias"))
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "event_series_editions" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "event_series_id" text NOT NULL,
                "event_edition_id" text NOT NULL,
                CONSTRAINT "UQ_event_series_editions_event_edition_id" UNIQUE ("event_edition_id"),
                CONSTRAINT "UQ_event_series_editions_pair" UNIQUE ("event_series_id", "event_edition_id"),
                CONSTRAINT "PK_bf363eb08184fde23dd6068b636" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_series_editions_event_series_id" ON "event_series_editions" ("event_series_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_series_editions_snapshot_id" ON "event_series_editions" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "event_materials" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "event_edition_id" text NOT NULL,
                "material_id" text NOT NULL,
                CONSTRAINT "UQ_event_materials_pair" UNIQUE ("event_edition_id", "material_id"),
                CONSTRAINT "PK_c9bc48cb6c9895059f1cf2a666e" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_materials_material_id" ON "event_materials" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_materials_event_edition_id" ON "event_materials" ("event_edition_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_materials_snapshot_id" ON "event_materials" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "material_resources" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "material_id" text NOT NULL,
                "resource_id" text NOT NULL,
                CONSTRAINT "UQ_material_resources_pair" UNIQUE ("material_id", "resource_id"),
                CONSTRAINT "PK_d323c064190a42ad4efb2c89399" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_resources_resource_id" ON "material_resources" ("resource_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_resources_material_id" ON "material_resources" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_resources_snapshot_id" ON "material_resources" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "material_topics" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "material_id" text NOT NULL,
                "topic_id" text NOT NULL,
                CONSTRAINT "UQ_material_topics_pair" UNIQUE ("material_id", "topic_id"),
                CONSTRAINT "PK_f9c47029fdd1199920c1987ad4f" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_topics_topic_id" ON "material_topics" ("topic_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_topics_material_id" ON "material_topics" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_topics_snapshot_id" ON "material_topics" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "material_tools" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "material_id" text NOT NULL,
                "tool_id" text NOT NULL,
                CONSTRAINT "UQ_material_tools_pair" UNIQUE ("material_id", "tool_id"),
                CONSTRAINT "PK_b49f397ff62e8fdb730d21e982a" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_tools_tool_id" ON "material_tools" ("tool_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_tools_material_id" ON "material_tools" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_tools_snapshot_id" ON "material_tools" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "material_systems" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "material_id" text NOT NULL,
                "system_id" text NOT NULL,
                CONSTRAINT "UQ_material_systems_pair" UNIQUE ("material_id", "system_id"),
                CONSTRAINT "PK_87cc9f7ddfc86a781d40a342d89" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_systems_system_id" ON "material_systems" ("system_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_systems_material_id" ON "material_systems" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_systems_snapshot_id" ON "material_systems" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "material_instructors" (
                "relationship_id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "evidence" text,
                "extraction_method" text,
                "review_status" text,
                "trust_class" text,
                "source_document" text,
                "material_id" text NOT NULL,
                "person_id" text NOT NULL,
                CONSTRAINT "UQ_material_instructors_pair" UNIQUE ("material_id", "person_id"),
                CONSTRAINT "PK_a63ac5bc349c538dc8c730cd4e0" PRIMARY KEY ("relationship_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_instructors_person_id" ON "material_instructors" ("person_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_instructors_material_id" ON "material_instructors" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_material_instructors_snapshot_id" ON "material_instructors" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."chunk_source_kind_enum" AS ENUM(
                'TRANSCRIPT',
                'CATALOG_METADATA',
                'REPOSITORY_SESSION',
                'SLIDES'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "content_chunks" (
                "id" text NOT NULL,
                "snapshot_id" text NOT NULL,
                "material_id" text NOT NULL,
                "content_resource_id" text NOT NULL,
                "event_edition_id" text,
                "source_kind" "public"."chunk_source_kind_enum" NOT NULL,
                "chunk_index" integer NOT NULL,
                "section" text,
                "text" text NOT NULL,
                "word_start" integer,
                "word_end" integer,
                "text_hash" text NOT NULL,
                "source_hash" text,
                "source_entity_id" text,
                "source_location" text,
                "provenance" jsonb,
                "chunking_version" text NOT NULL,
                "language" text,
                CONSTRAINT "CHK_content_chunks_chunk_index" CHECK ("chunk_index" >= 0),
                CONSTRAINT "CHK_content_chunks_word_positions" CHECK ("word_start" >= 0 AND "word_end" >= 0),
                CONSTRAINT "CHK_content_chunks_word_offsets" CHECK ("word_start" <= "word_end"),
                CONSTRAINT "PK_fe57bc738dc681ac7fb577ec1c0" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_resource_position" ON "content_chunks" (
                "content_resource_id",
                "chunk_index",
                "chunking_version"
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_source_kind" ON "content_chunks" ("source_kind")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_event_edition_id" ON "content_chunks" ("event_edition_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_content_resource_id" ON "content_chunks" ("content_resource_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_material_id" ON "content_chunks" ("material_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_snapshot_id" ON "content_chunks" ("snapshot_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_content_chunks_search" ON "content_chunks" USING GIN (
                to_tsvector('simple'::regconfig, "text")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "chunk_embeddings" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "chunk_id" text NOT NULL,
                "embedding_model" text NOT NULL,
                "embedding_version" text NOT NULL,
                "model_revision" text,
                "dimensions" integer NOT NULL,
                "normalization" text,
                "input_policy" text,
                "content_hash" text NOT NULL,
                "embedding" vector NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_chunk_embeddings_model" UNIQUE (
                    "chunk_id",
                    "embedding_model",
                    "embedding_version"
                ),
                CONSTRAINT "CHK_chunk_embeddings_vector_dimensions" CHECK (vector_dims("embedding") = "dimensions"),
                CONSTRAINT "CHK_chunk_embeddings_dimensions_positive" CHECK ("dimensions" > 0),
                CONSTRAINT "PK_c8fa533ffec12a5343f92f812f0" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_chunk_embeddings_chunk_id" ON "chunk_embeddings" ("chunk_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "snapshot_import_errors"
            ADD CONSTRAINT "FK_0c7501ae49737bc38638f7252d1" FOREIGN KEY ("import_run_id") REFERENCES "snapshot_import_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "snapshot_import_runs"
            ADD CONSTRAINT "FK_5eb96026f75e59cbe82d16ac506" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series"
            ADD CONSTRAINT "FK_884981ee3f4e4c4dcf67a807466" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_editions"
            ADD CONSTRAINT "FK_1f81b7978f36c3abe142a2b9253" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "training_materials"
            ADD CONSTRAINT "FK_031e319eb891ba82bce1bd7978e" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "content_resources"
            ADD CONSTRAINT "FK_c563143f71192a001c13ff00826" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "people"
            ADD CONSTRAINT "FK_ced02f28e9dcea1225c54be346f" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "topics"
            ADD CONSTRAINT "FK_8651bc522e8bb14ac1adef6c8e5" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tools"
            ADD CONSTRAINT "FK_3e730632971cba7e0cb1a91a0ee" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "systems"
            ADD CONSTRAINT "FK_4ad4f50a52f105de8efb8978fce" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "content_resource_files"
            ADD CONSTRAINT "FK_7308d24db11514ea8a323b87ab2" FOREIGN KEY ("resource_id") REFERENCES "content_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_aliases"
            ADD CONSTRAINT "FK_0945a0858d8f0ff37d17419567f" FOREIGN KEY ("event_series_id") REFERENCES "event_series"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "topic_aliases"
            ADD CONSTRAINT "FK_aae6433edc73c0efd2408292f58" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tool_aliases"
            ADD CONSTRAINT "FK_2496f97423ad6ef46fe71f28243" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "system_aliases"
            ADD CONSTRAINT "FK_8eaafe4aa7bc754678203b34bf2" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_editions"
            ADD CONSTRAINT "FK_c7345cad4bd042966c40c36496b" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_editions"
            ADD CONSTRAINT "FK_f9b01ac95d0f76be18570a439f8" FOREIGN KEY ("event_series_id") REFERENCES "event_series"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_editions"
            ADD CONSTRAINT "FK_a7c4e6191a32e969d16c37958ca" FOREIGN KEY ("event_edition_id") REFERENCES "event_editions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_materials"
            ADD CONSTRAINT "FK_3a77cfb7be545e77aff2673985c" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_materials"
            ADD CONSTRAINT "FK_fa261dde7f55d9c885f6527b185" FOREIGN KEY ("event_edition_id") REFERENCES "event_editions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_materials"
            ADD CONSTRAINT "FK_bde7056048d9556911c1fab8557" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_resources"
            ADD CONSTRAINT "FK_f4fd5b9aa96894a273cd15dc916" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_resources"
            ADD CONSTRAINT "FK_3349af6e6b74a041a0b5150c5a7" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_resources"
            ADD CONSTRAINT "FK_dc99e54c1a12d0629ebceafc9ad" FOREIGN KEY ("resource_id") REFERENCES "content_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_topics"
            ADD CONSTRAINT "FK_4d223cdfe4d30b7ebb492f8b96a" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_topics"
            ADD CONSTRAINT "FK_1811bdc7316b018cc4d744c4af2" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_topics"
            ADD CONSTRAINT "FK_ce9b565949d55a372db96d2cbd5" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_tools"
            ADD CONSTRAINT "FK_1702faa602f48bda331629f7f29" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_tools"
            ADD CONSTRAINT "FK_2a817b8e1fc2564ee8eabfee50e" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_tools"
            ADD CONSTRAINT "FK_c2315b60b1ae53e748047cd93c6" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_systems"
            ADD CONSTRAINT "FK_2825b67c167ec6ea16f6f97c94f" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_systems"
            ADD CONSTRAINT "FK_b1c052f43165128f5f4b5269b32" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_systems"
            ADD CONSTRAINT "FK_3279608b93e00e7e2ff1539aa54" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_instructors"
            ADD CONSTRAINT "FK_107b9d8c91e641304bf0147adec" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_instructors"
            ADD CONSTRAINT "FK_74d232c5dc9ae3c1575a919070c" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "material_instructors"
            ADD CONSTRAINT "FK_e2836052171edc16d3320d15955" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks"
            ADD CONSTRAINT "FK_de8e61da00d575b5617e3fc2eaf" FOREIGN KEY ("snapshot_id") REFERENCES "catalog_snapshots"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks"
            ADD CONSTRAINT "FK_39e52d70ebe803b3815ca947259" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks"
            ADD CONSTRAINT "FK_3fa7100b0ed172c6ccd14eb5518" FOREIGN KEY ("content_resource_id") REFERENCES "content_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks"
            ADD CONSTRAINT "FK_37473e8aa01b3903c1eca30f6ed" FOREIGN KEY ("event_edition_id") REFERENCES "event_editions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "chunk_embeddings"
            ADD CONSTRAINT "FK_89eb4842eec02ea7bac89890ceb" FOREIGN KEY ("chunk_id") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "chunk_embeddings" DROP CONSTRAINT "FK_89eb4842eec02ea7bac89890ceb"
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_37473e8aa01b3903c1eca30f6ed"
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_3fa7100b0ed172c6ccd14eb5518"
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_39e52d70ebe803b3815ca947259"
        `);
    await queryRunner.query(`
            ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_de8e61da00d575b5617e3fc2eaf"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_instructors" DROP CONSTRAINT "FK_e2836052171edc16d3320d15955"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_instructors" DROP CONSTRAINT "FK_74d232c5dc9ae3c1575a919070c"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_instructors" DROP CONSTRAINT "FK_107b9d8c91e641304bf0147adec"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_systems" DROP CONSTRAINT "FK_3279608b93e00e7e2ff1539aa54"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_systems" DROP CONSTRAINT "FK_b1c052f43165128f5f4b5269b32"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_systems" DROP CONSTRAINT "FK_2825b67c167ec6ea16f6f97c94f"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_tools" DROP CONSTRAINT "FK_c2315b60b1ae53e748047cd93c6"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_tools" DROP CONSTRAINT "FK_2a817b8e1fc2564ee8eabfee50e"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_tools" DROP CONSTRAINT "FK_1702faa602f48bda331629f7f29"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_topics" DROP CONSTRAINT "FK_ce9b565949d55a372db96d2cbd5"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_topics" DROP CONSTRAINT "FK_1811bdc7316b018cc4d744c4af2"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_topics" DROP CONSTRAINT "FK_4d223cdfe4d30b7ebb492f8b96a"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_resources" DROP CONSTRAINT "FK_dc99e54c1a12d0629ebceafc9ad"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_resources" DROP CONSTRAINT "FK_3349af6e6b74a041a0b5150c5a7"
        `);
    await queryRunner.query(`
            ALTER TABLE "material_resources" DROP CONSTRAINT "FK_f4fd5b9aa96894a273cd15dc916"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_materials" DROP CONSTRAINT "FK_bde7056048d9556911c1fab8557"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_materials" DROP CONSTRAINT "FK_fa261dde7f55d9c885f6527b185"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_materials" DROP CONSTRAINT "FK_3a77cfb7be545e77aff2673985c"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_editions" DROP CONSTRAINT "FK_a7c4e6191a32e969d16c37958ca"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_editions" DROP CONSTRAINT "FK_f9b01ac95d0f76be18570a439f8"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_editions" DROP CONSTRAINT "FK_c7345cad4bd042966c40c36496b"
        `);
    await queryRunner.query(`
            ALTER TABLE "system_aliases" DROP CONSTRAINT "FK_8eaafe4aa7bc754678203b34bf2"
        `);
    await queryRunner.query(`
            ALTER TABLE "tool_aliases" DROP CONSTRAINT "FK_2496f97423ad6ef46fe71f28243"
        `);
    await queryRunner.query(`
            ALTER TABLE "topic_aliases" DROP CONSTRAINT "FK_aae6433edc73c0efd2408292f58"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series_aliases" DROP CONSTRAINT "FK_0945a0858d8f0ff37d17419567f"
        `);
    await queryRunner.query(`
            ALTER TABLE "content_resource_files" DROP CONSTRAINT "FK_7308d24db11514ea8a323b87ab2"
        `);
    await queryRunner.query(`
            ALTER TABLE "systems" DROP CONSTRAINT "FK_4ad4f50a52f105de8efb8978fce"
        `);
    await queryRunner.query(`
            ALTER TABLE "tools" DROP CONSTRAINT "FK_3e730632971cba7e0cb1a91a0ee"
        `);
    await queryRunner.query(`
            ALTER TABLE "topics" DROP CONSTRAINT "FK_8651bc522e8bb14ac1adef6c8e5"
        `);
    await queryRunner.query(`
            ALTER TABLE "people" DROP CONSTRAINT "FK_ced02f28e9dcea1225c54be346f"
        `);
    await queryRunner.query(`
            ALTER TABLE "content_resources" DROP CONSTRAINT "FK_c563143f71192a001c13ff00826"
        `);
    await queryRunner.query(`
            ALTER TABLE "training_materials" DROP CONSTRAINT "FK_031e319eb891ba82bce1bd7978e"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_editions" DROP CONSTRAINT "FK_1f81b7978f36c3abe142a2b9253"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_series" DROP CONSTRAINT "FK_884981ee3f4e4c4dcf67a807466"
        `);
    await queryRunner.query(`
            ALTER TABLE "snapshot_import_runs" DROP CONSTRAINT "FK_5eb96026f75e59cbe82d16ac506"
        `);
    await queryRunner.query(`
            ALTER TABLE "snapshot_import_errors" DROP CONSTRAINT "FK_0c7501ae49737bc38638f7252d1"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_chunk_embeddings_chunk_id"
        `);
    await queryRunner.query(`
            DROP TABLE "chunk_embeddings"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_chunks_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_chunks_material_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_chunks_content_resource_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_chunks_event_edition_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_chunks_source_kind"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_chunks_resource_position"
        `);
    await queryRunner.query(`
            DROP TABLE "content_chunks"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."chunk_source_kind_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_instructors_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_instructors_material_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_instructors_person_id"
        `);
    await queryRunner.query(`
            DROP TABLE "material_instructors"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_systems_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_systems_material_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_systems_system_id"
        `);
    await queryRunner.query(`
            DROP TABLE "material_systems"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_tools_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_tools_material_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_tools_tool_id"
        `);
    await queryRunner.query(`
            DROP TABLE "material_tools"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_topics_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_topics_material_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_topics_topic_id"
        `);
    await queryRunner.query(`
            DROP TABLE "material_topics"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_resources_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_resources_material_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_material_resources_resource_id"
        `);
    await queryRunner.query(`
            DROP TABLE "material_resources"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_materials_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_materials_event_edition_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_materials_material_id"
        `);
    await queryRunner.query(`
            DROP TABLE "event_materials"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_series_editions_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_series_editions_event_series_id"
        `);
    await queryRunner.query(`
            DROP TABLE "event_series_editions"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_system_aliases_system_id"
        `);
    await queryRunner.query(`
            DROP TABLE "system_aliases"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_tool_aliases_tool_id"
        `);
    await queryRunner.query(`
            DROP TABLE "tool_aliases"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_topic_aliases_topic_id"
        `);
    await queryRunner.query(`
            DROP TABLE "topic_aliases"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_series_aliases_event_series_id"
        `);
    await queryRunner.query(`
            DROP TABLE "event_series_aliases"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_resource_files_resource_id"
        `);
    await queryRunner.query(`
            DROP TABLE "content_resource_files"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_systems_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "systems"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_tools_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "tools"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_topics_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "topics"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_people_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "people"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_resources_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_content_resources_type_status"
        `);
    await queryRunner.query(`
            DROP TABLE "content_resources"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."resource_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_training_materials_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "training_materials"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_editions_snapshot_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_editions_start_at"
        `);
    await queryRunner.query(`
            DROP TABLE "event_editions"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_event_series_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "event_series"
        `);
    await queryRunner.query(`
            DROP TABLE "catalog_snapshots"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."snapshot_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_snapshot_import_runs_snapshot_id"
        `);
    await queryRunner.query(`
            DROP TABLE "snapshot_import_runs"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."import_run_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_snapshot_import_errors_import_run_id"
        `);
    await queryRunner.query(`
            DROP TABLE "snapshot_import_errors"
        `);
  }
}
