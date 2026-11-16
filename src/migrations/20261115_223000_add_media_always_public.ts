import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Static media pinned as public. Reference counting and the archive task must
 * never downgrade or copy these files to `private-media`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "always_public" boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS "media_always_public_idx" ON "media" USING btree ("always_public");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "media_always_public_idx";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "always_public";
  `)
}
