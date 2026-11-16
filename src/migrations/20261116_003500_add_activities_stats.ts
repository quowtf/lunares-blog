import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_activities_type" AS ENUM ('bike', 'coffee', 'boulder', 'code');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "activities" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" "enum_activities_type" NOT NULL,
      "occurred_at" timestamp(3) with time zone NOT NULL,
      "day" varchar NOT NULL,
      "value" numeric,
      "attempts" numeric,
      "failed" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "activities_type_idx" ON "activities" USING btree ("type");
    CREATE INDEX IF NOT EXISTS "activities_occurred_at_idx" ON "activities" USING btree ("occurred_at");
    CREATE INDEX IF NOT EXISTS "activities_day_idx" ON "activities" USING btree ("day");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "activities" CASCADE;
    DROP TYPE IF EXISTS "enum_activities_type";
  `)
}
