import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261122090701 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "notification_record" drop constraint if exists "notification_record_dedupe_key_unique";`);
    this.addSql(`alter table if exists "notification_attempt" drop constraint if exists "notification_attempt_notification_id_attempt_number_unique";`);
    this.addSql(`create table if not exists "notification_attempt" ("id" text not null, "notification_id" text not null, "attempt_number" integer not null, "outcome" text check ("outcome" in ('success', 'failure')) not null, "error_code" text null, "provider_reference" text null, "attempted_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "notification_attempt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_attempt_deleted_at" ON "notification_attempt" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_attempt_notification_id_attempt_number_unique" ON "notification_attempt" ("notification_id", "attempt_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_attempt_notification_id_attempted_at" ON "notification_attempt" ("notification_id", "attempted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "notification_record" ("id" text not null, "order_id" text not null, "source_event_id" text not null, "source_state_version" integer not null, "notification_type" text check ("notification_type" in ('order_placed', 'order_canceled')) not null, "channel" text not null, "template_version" text not null, "dedupe_key" text not null, "recipient" text not null, "state" text check ("state" in ('pending', 'processing', 'retry_wait', 'sent', 'failed')) not null, "attempt_count" integer not null default 0, "next_attempt_at" timestamptz null, "lease_expires_at" timestamptz null, "provider_reference" text null, "last_error_code" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "notification_record_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_record_dedupe_key_unique" ON "notification_record" ("dedupe_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_record_deleted_at" ON "notification_record" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_record_order_id_source_state_version" ON "notification_record" ("order_id", "source_state_version") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_record_state_next_attempt_at" ON "notification_record" ("state", "next_attempt_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "notification_attempt" cascade;`);

    this.addSql(`drop table if exists "notification_record" cascade;`);
  }

}
