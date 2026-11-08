import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107150232 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "recommendation_profile" drop constraint if exists "recommendation_profile_customer_id_unique";`);
    this.addSql(`alter table if exists "recommendation_event" drop constraint if exists "recommendation_event_event_key_unique";`);
    this.addSql(`create table if not exists "recommendation_event" ("id" text not null, "event_key" text not null, "customer_id" text not null, "consent_epoch" integer not null, "event_type" text check ("event_type" in ('product_view', 'recommendation_click')) not null, "product_id" text not null, "placement" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_recommendation_event_event_key_unique" ON "recommendation_event" ("event_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_event_deleted_at" ON "recommendation_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_event_customer_id_created_at" ON "recommendation_event" ("customer_id", "created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "recommendation_profile" ("id" text not null, "customer_id" text not null, "consent_epoch" integer not null, "profile_version" text not null, "interests" jsonb not null, "recent_product_ids" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_recommendation_profile_customer_id_unique" ON "recommendation_profile" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_profile_deleted_at" ON "recommendation_profile" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "recommendation_event" cascade;`);

    this.addSql(`drop table if exists "recommendation_profile" cascade;`);
  }

}
