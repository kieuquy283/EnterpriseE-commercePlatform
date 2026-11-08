import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261107151743 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "recommendation_event" drop constraint if exists "recommendation_event_event_type_check";`);

    this.addSql(`alter table if exists "recommendation_event" add column if not exists "occurred_at" timestamptz null, add column if not exists "order_line_key" text null;`);
    this.addSql(`update "recommendation_event" set "occurred_at" = "created_at" where "occurred_at" is null;`);
    this.addSql(`alter table "recommendation_event" alter column "occurred_at" set not null;`);
    this.addSql(`alter table if exists "recommendation_event" add constraint "recommendation_event_event_type_check" check("event_type" in ('product_view', 'recommendation_click', 'order_placed', 'order_canceled'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "recommendation_event" drop constraint if exists "recommendation_event_event_type_check";`);

    this.addSql(`alter table if exists "recommendation_event" drop column if exists "occurred_at", drop column if exists "order_line_key";`);

    this.addSql(`alter table if exists "recommendation_event" add constraint "recommendation_event_event_type_check" check("event_type" in ('product_view', 'recommendation_click'));`);
  }

}
