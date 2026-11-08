import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107144837 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "recommendation_consent" drop constraint if exists "recommendation_consent_customer_id_unique";`);
    this.addSql(`create table if not exists "recommendation_consent" ("id" text not null, "customer_id" text not null, "granted" boolean not null default false, "epoch" integer not null default 0, "terms_version" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_consent_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_recommendation_consent_customer_id_unique" ON "recommendation_consent" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_consent_deleted_at" ON "recommendation_consent" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "recommendation_consent" cascade;`);
  }

}
