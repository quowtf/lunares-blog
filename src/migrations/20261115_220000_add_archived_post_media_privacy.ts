import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Hybrid post-image privacy.
 *
 * Keeps images in `media` while the post is public, adds private
 * counterparts and an internal reference index used by the access gate,
 * the archive task and shared-media cleanup.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── Media visibility metadata ────────────────────────────────────────
    DO $$ BEGIN
      CREATE TYPE "enum_media_visibility" AS ENUM ('public', 'post-window', 'private');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "visibility" "enum_media_visibility" DEFAULT 'private';
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "latest_post_published_at" timestamp(3) with time zone;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "public_until" timestamp(3) with time zone;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "archive_retention_until" timestamp(3) with time zone;

    CREATE INDEX IF NOT EXISTS "media_visibility_idx" ON "media" USING btree ("visibility");
    CREATE INDEX IF NOT EXISTS "media_latest_post_published_at_idx" ON "media" USING btree ("latest_post_published_at");
    CREATE INDEX IF NOT EXISTS "media_public_until_idx" ON "media" USING btree ("public_until");
    CREATE INDEX IF NOT EXISTS "media_archive_retention_until_idx" ON "media" USING btree ("archive_retention_until");

    -- ── Private media archive metadata ───────────────────────────────────
    ALTER TABLE "private_media" ADD COLUMN IF NOT EXISTS "caption" jsonb;
    ALTER TABLE "private_media" ADD COLUMN IF NOT EXISTS "archive_source_id" numeric;
    ALTER TABLE "private_media" ADD COLUMN IF NOT EXISTS "archive_source_updated_at" timestamp(3) with time zone;

    CREATE UNIQUE INDEX IF NOT EXISTS "private_media_archive_source_id_idx" ON "private_media" USING btree ("archive_source_id");

    -- ── Posts: private counterparts + archive state ──────────────────────
    DO $$ BEGIN
      CREATE TYPE "enum_posts_media_archive_state" AS ENUM ('none', 'pending', 'archived', 'needs-promotion');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "private_hero_image_id" integer;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "media_archive_state" "enum_posts_media_archive_state" DEFAULT 'none';

    DO $$ BEGIN
      ALTER TABLE "posts" ADD CONSTRAINT "posts_private_hero_image_id_private_media_id_fk" FOREIGN KEY ("private_hero_image_id") REFERENCES "private_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "posts_private_hero_image_idx" ON "posts" USING btree ("private_hero_image_id");
    CREATE INDEX IF NOT EXISTS "posts_media_archive_state_idx" ON "posts" USING btree ("media_archive_state");

    ALTER TABLE "posts_rels" ADD COLUMN IF NOT EXISTS "private_media_id" integer;
    DO $$ BEGIN
      ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_private_media_id_private_media_id_fk" FOREIGN KEY ("private_media_id") REFERENCES "private_media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "posts_rels_private_media_id_idx" ON "posts_rels" USING btree ("private_media_id");

    -- Versions mirror the new fields.
    DO $$ BEGIN
      CREATE TYPE "enum__posts_v_version_media_archive_state" AS ENUM ('none', 'pending', 'archived', 'needs-promotion');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_private_hero_image_id" integer;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_media_archive_state" "enum__posts_v_version_media_archive_state" DEFAULT 'none';

    DO $$ BEGIN
      ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_private_hero_image_id_private_media_id_fk" FOREIGN KEY ("version_private_hero_image_id") REFERENCES "private_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_private_hero_image_idx" ON "_posts_v" USING btree ("version_private_hero_image_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_media_archive_state_idx" ON "_posts_v" USING btree ("version_media_archive_state");

    ALTER TABLE "_posts_v_rels" ADD COLUMN IF NOT EXISTS "private_media_id" integer;
    DO $$ BEGIN
      ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_private_media_id_private_media_id_fk" FOREIGN KEY ("private_media_id") REFERENCES "private_media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "_posts_v_rels_private_media_id_idx" ON "_posts_v_rels" USING btree ("private_media_id");

    -- ── MediaBlock private counterpart (pages + versions) ─────────────────
    ALTER TABLE "pages_blocks_media_block" ADD COLUMN IF NOT EXISTS "private_media_id" integer;
    DO $$ BEGIN
      ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_private_media_id_private_media_id_fk" FOREIGN KEY ("private_media_id") REFERENCES "private_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "pages_blocks_media_block_private_media_idx" ON "pages_blocks_media_block" USING btree ("private_media_id");

    ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN IF NOT EXISTS "private_media_id" integer;
    DO $$ BEGIN
      ALTER TABLE "_pages_v_blocks_media_block" ADD CONSTRAINT "_pages_v_blocks_media_block_private_media_id_private_media_id_fk" FOREIGN KEY ("private_media_id") REFERENCES "private_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_media_block_private_media_idx" ON "_pages_v_blocks_media_block" USING btree ("private_media_id");

    -- ── Media reference index ────────────────────────────────────────────
    DO $$ BEGIN
      CREATE TYPE "enum_media_references_source_collection" AS ENUM ('posts', 'pages', 'stories');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "media_references" (
      "id" serial PRIMARY KEY NOT NULL,
      "media_id" integer NOT NULL,
      "source_collection" "enum_media_references_source_collection" NOT NULL,
      "source_id" varchar NOT NULL,
      "field_path" varchar NOT NULL,
      "is_public" boolean DEFAULT false,
      "published_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "media_references" ADD CONSTRAINT "media_references_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "media_references_media_idx" ON "media_references" USING btree ("media_id");
    CREATE INDEX IF NOT EXISTS "media_references_source_collection_idx" ON "media_references" USING btree ("source_collection");
    CREATE INDEX IF NOT EXISTS "media_references_source_id_idx" ON "media_references" USING btree ("source_id");
    CREATE INDEX IF NOT EXISTS "media_references_is_public_idx" ON "media_references" USING btree ("is_public");
    CREATE INDEX IF NOT EXISTS "media_references_published_at_idx" ON "media_references" USING btree ("published_at");
    CREATE INDEX IF NOT EXISTS "media_references_expires_at_idx" ON "media_references" USING btree ("expires_at");
    CREATE INDEX IF NOT EXISTS "media_references_created_at_idx" ON "media_references" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "media_references_updated_at_idx" ON "media_references" USING btree ("updated_at");

    CREATE UNIQUE INDEX IF NOT EXISTS "media_references_unique_idx"
      ON "media_references" ("media_id", "source_collection", "source_id", "field_path");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "media_references_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_references_fk" FOREIGN KEY ("media_references_id") REFERENCES "media_references"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_references_id_idx" ON "payload_locked_documents_rels" USING btree ("media_references_id");

    -- ── Jobs task slug ────────────────────────────────────────────────────
    ALTER TYPE "enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'sync-archived-post-media';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_references_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_media_references_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "media_references_id";

    DROP TABLE IF EXISTS "media_references" CASCADE;
    DROP TYPE IF EXISTS "enum_media_references_source_collection";

    ALTER TABLE "_pages_v_blocks_media_block" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_media_block_private_media_id_private_media_id_fk";
    DROP INDEX IF EXISTS "_pages_v_blocks_media_block_private_media_idx";
    ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "private_media_id";

    ALTER TABLE "pages_blocks_media_block" DROP CONSTRAINT IF EXISTS "pages_blocks_media_block_private_media_id_private_media_id_fk";
    DROP INDEX IF EXISTS "pages_blocks_media_block_private_media_idx";
    ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "private_media_id";

    ALTER TABLE "_posts_v_rels" DROP CONSTRAINT IF EXISTS "_posts_v_rels_private_media_id_private_media_id_fk";
    DROP INDEX IF EXISTS "_posts_v_rels_private_media_id_idx";
    ALTER TABLE "_posts_v_rels" DROP COLUMN IF EXISTS "private_media_id";

    ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_private_hero_image_id_private_media_id_fk";
    DROP INDEX IF EXISTS "_posts_v_version_version_private_hero_image_idx";
    DROP INDEX IF EXISTS "_posts_v_version_version_media_archive_state_idx";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_private_hero_image_id";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_media_archive_state";
    DROP TYPE IF EXISTS "enum__posts_v_version_media_archive_state";

    ALTER TABLE "posts_rels" DROP CONSTRAINT IF EXISTS "posts_rels_private_media_id_private_media_id_fk";
    DROP INDEX IF EXISTS "posts_rels_private_media_id_idx";
    ALTER TABLE "posts_rels" DROP COLUMN IF EXISTS "private_media_id";

    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_private_hero_image_id_private_media_id_fk";
    DROP INDEX IF EXISTS "posts_private_hero_image_idx";
    DROP INDEX IF EXISTS "posts_media_archive_state_idx";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "private_hero_image_id";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "media_archive_state";
    DROP TYPE IF EXISTS "enum_posts_media_archive_state";

    DROP INDEX IF EXISTS "private_media_archive_source_id_idx";
    ALTER TABLE "private_media" DROP COLUMN IF EXISTS "caption";
    ALTER TABLE "private_media" DROP COLUMN IF EXISTS "archive_source_id";
    ALTER TABLE "private_media" DROP COLUMN IF EXISTS "archive_source_updated_at";

    DROP INDEX IF EXISTS "media_visibility_idx";
    DROP INDEX IF EXISTS "media_latest_post_published_at_idx";
    DROP INDEX IF EXISTS "media_public_until_idx";
    DROP INDEX IF EXISTS "media_archive_retention_until_idx";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "visibility";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "latest_post_published_at";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "public_until";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "archive_retention_until";
    DROP TYPE IF EXISTS "enum_media_visibility";
  `)
}
