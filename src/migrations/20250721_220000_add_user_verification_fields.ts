import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_code" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_expiry" timestamp(3) with time zone;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_attempts" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_code";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_expiry";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_attempts";
  `)
}
