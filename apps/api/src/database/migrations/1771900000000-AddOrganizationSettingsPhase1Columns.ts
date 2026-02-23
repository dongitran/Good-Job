import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationSettingsPhase1Columns1771900000000 implements MigrationInterface {
  name = 'AddOrganizationSettingsPhase1Columns1771900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "timezone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "language" character varying NOT NULL DEFAULT 'en'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "company_domain" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "core_values" ADD COLUMN "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "core_values" ADD COLUMN "sort_order" integer NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(`
      WITH ranked_values AS (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at ASC) - 1 AS row_num
        FROM core_values
      )
      UPDATE core_values cv
      SET sort_order = rv.row_num
      FROM ranked_values rv
      WHERE cv.id = rv.id
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core_values" DROP COLUMN "sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core_values" DROP COLUMN "description"`,
    );

    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "company_domain"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "language"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "timezone"`,
    );
  }
}
