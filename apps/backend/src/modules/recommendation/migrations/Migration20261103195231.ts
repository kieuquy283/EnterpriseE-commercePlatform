import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261103195231 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "recommendation_run" drop constraint if exists "recommendation_run_version_unique";`);
    this.addSql(`alter table if exists "recommendation_candidate" drop constraint if exists "recommendation_candidate_run_id_placement_context_key_rank_unique";`);
    this.addSql(`alter table if exists "recommendation_candidate" drop constraint if exists "recommendation_candidate_run_id_placement_context_key_target_product_id_unique";`);
    this.addSql(`create table if not exists "recommendation_active" ("id" text not null, "run_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_active_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_active_deleted_at" ON "recommendation_active" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "recommendation_candidate" ("id" text not null, "run_id" text not null, "placement" text check ("placement" in ('home', 'product_detail')) not null, "context_key" text not null, "target_product_id" text not null, "score" real not null, "rank" integer not null, "strategy" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_candidate_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_candidate_deleted_at" ON "recommendation_candidate" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_recommendation_candidate_run_id_placement_context_key_target_product_id_unique" ON "recommendation_candidate" ("run_id", "placement", "context_key", "target_product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_recommendation_candidate_run_id_placement_context_key_rank_unique" ON "recommendation_candidate" ("run_id", "placement", "context_key", "rank") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "recommendation_run" ("id" text not null, "version" text not null, "checksum" text not null, "status" text check ("status" in ('staging', 'ready', 'failed')) not null default 'staging', "manifest" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recommendation_run_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_recommendation_run_version_unique" ON "recommendation_run" ("version") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recommendation_run_deleted_at" ON "recommendation_run" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "recommendation_active" cascade;`);

    this.addSql(`drop table if exists "recommendation_candidate" cascade;`);

    this.addSql(`drop table if exists "recommendation_run" cascade;`);
  }

}
