import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_media_block" ADD COLUMN IF NOT EXISTS "size" varchar DEFAULT 'full';
    ALTER TABLE "pages_blocks_media_block" ADD COLUMN IF NOT EXISTS "alignment" varchar DEFAULT 'center';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "size";
    ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "alignment";
  `)
}
