import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Boulder rows only need tops and failed attempts. The old `attempts` column
 * duplicated the total, so it is folded into `value` (tops) and `failed`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "activities"
    SET "value" = GREATEST(
      COALESCE("attempts", 0) - COALESCE("failed", 0),
      0
    )
    WHERE "type" = 'boulder' AND "attempts" IS NOT NULL;

    ALTER TABLE "activities" DROP COLUMN IF EXISTS "attempts";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "attempts" numeric;

    UPDATE "activities"
    SET "attempts" = COALESCE("value", 0) + COALESCE("failed", 0)
    WHERE "type" = 'boulder';
  `)
}
