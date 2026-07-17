import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "views" numeric DEFAULT 0;
    ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "taps" numeric DEFAULT 0;
    ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "visible" numeric DEFAULT 0;
    ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "skips" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "stories" DROP COLUMN IF EXISTS "views";
    ALTER TABLE "stories" DROP COLUMN IF EXISTS "taps";
    ALTER TABLE "stories" DROP COLUMN IF EXISTS "visible";
    ALTER TABLE "stories" DROP COLUMN IF EXISTS "skips";
  `)
}
