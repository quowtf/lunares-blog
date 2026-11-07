import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "private_media" (
      "id" serial PRIMARY KEY NOT NULL,
      "alt" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric,
      "sizes_thumbnail_url" varchar,
      "sizes_thumbnail_width" numeric,
      "sizes_thumbnail_height" numeric,
      "sizes_thumbnail_mime_type" varchar,
      "sizes_thumbnail_filesize" numeric,
      "sizes_thumbnail_filename" varchar,
      "sizes_medium_url" varchar,
      "sizes_medium_width" numeric,
      "sizes_medium_height" numeric,
      "sizes_medium_mime_type" varchar,
      "sizes_medium_filesize" numeric,
      "sizes_medium_filename" varchar
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "private_media_filename_idx" ON "private_media" USING btree ("filename");
    CREATE INDEX IF NOT EXISTS "private_media_created_at_idx" ON "private_media" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "private_media_updated_at_idx" ON "private_media" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "private_media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "private_media" USING btree ("sizes_thumbnail_filename");
    CREATE INDEX IF NOT EXISTS "private_media_sizes_medium_sizes_medium_filename_idx" ON "private_media" USING btree ("sizes_medium_filename");

    ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "private_image_id" integer;
    DO $$ BEGIN
      ALTER TABLE "stories" ADD CONSTRAINT "stories_private_image_id_private_media_id_fk" FOREIGN KEY ("private_image_id") REFERENCES "private_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "stories_private_image_idx" ON "stories" USING btree ("private_image_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "private_media_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_media_fk" FOREIGN KEY ("private_media_id") REFERENCES "private_media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_private_media_id_idx" ON "payload_locked_documents_rels" USING btree ("private_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_private_media_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_private_media_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "private_media_id";
    ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_private_image_id_private_media_id_fk";
    DROP INDEX IF EXISTS "stories_private_image_idx";
    ALTER TABLE "stories" DROP COLUMN IF EXISTS "private_image_id";
    DROP TABLE IF EXISTS "private_media" CASCADE;
  `)
}
