import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create badge_tags table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "badge_tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "color" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "badge_tags_updated_at_idx" ON "badge_tags" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "badge_tags_created_at_idx" ON "badge_tags" USING btree ("created_at");
  `)

  // Add café fields to posts table
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_name" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_origin" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_process" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_roast" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_altitude" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_score" numeric;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_finca" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_tostador" varchar;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coffee_tienda" varchar;
  `)

  // Add café fields to posts version table
  await db.execute(sql`
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_name" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_origin" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_process" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_roast" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_altitude" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_score" numeric;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_finca" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_tostador" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_coffee_tienda" varchar;
  `)

  // Create relationship table for posts <-> badge_tags (hasMany)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "posts_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "badge_tags_id" integer
    );

    CREATE INDEX IF NOT EXISTS "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "posts_rels_badge_tags_id_idx" ON "posts_rels" USING btree ("badge_tags_id");

    DO $$ BEGIN
      ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "posts"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_badge_tags_fk" FOREIGN KEY ("badge_tags_id") REFERENCES "badge_tags"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "posts_rels";
    DROP TABLE IF EXISTS "badge_tags";

    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_name";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_origin";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_process";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_roast";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_altitude";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_score";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_finca";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_tostador";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "coffee_tienda";

    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_name";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_origin";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_process";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_roast";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_altitude";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_score";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_finca";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_tostador";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_coffee_tienda";
  `)
}
