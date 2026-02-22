import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsAndUserPreferences1771800000000 implements MigrationInterface {
  name = 'AddNotificationsAndUserPreferences1771800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'kudos_received',
        'redemption_status',
        'points_received',
        'announcement',
        'system'
      )
    `);

    // 2. Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "org_id"          uuid NOT NULL,
        "user_id"         uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type"            "notification_type_enum" NOT NULL,
        "title"           varchar NOT NULL,
        "body"            text,
        "reference_type"  varchar,
        "reference_id"    uuid,
        "is_read"         boolean NOT NULL DEFAULT false,
        "read_at"         timestamptz,
        "created_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 3. Composite index for fast unread queries (bell badge)
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_unread"
        ON "notifications" ("user_id", "is_read", "created_at" DESC)
    `);

    // 4. Create theme_preference enum
    await queryRunner.query(`
      CREATE TYPE "theme_preference_enum" AS ENUM ('light', 'dark', 'system')
    `);

    // 5. Create user_preferences table
    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id"                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id"                 uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "theme"                   "theme_preference_enum" NOT NULL DEFAULT 'system',
        "notification_settings"   jsonb NOT NULL DEFAULT '{"kudosReceived":true,"weeklyDigest":true,"redemptionStatus":true,"newAnnouncements":false}',
        "created_at"              timestamptz NOT NULL DEFAULT now(),
        "updated_at"              timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_preferences"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "theme_preference_enum"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_notifications_user_unread"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
  }
}
