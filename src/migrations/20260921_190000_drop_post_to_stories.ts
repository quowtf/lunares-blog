import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "post_to_stories";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_post_to_stories";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "post_to_stories" boolean DEFAULT false;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_post_to_stories" boolean DEFAULT false;
  `)
}
