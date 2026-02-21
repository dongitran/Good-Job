import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeOrgIdUuid1771600000000 implements MigrationInterface {
  name = 'NormalizeOrgIdUuid1771600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "org_id" TYPE uuid USING "org_id"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" ALTER COLUMN "org_id" TYPE uuid USING "org_id"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "org_id" TYPE uuid USING "org_id"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ALTER COLUMN "org_id" TYPE uuid USING "org_id"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "monthly_point_budgets" ALTER COLUMN "org_id" TYPE uuid USING "org_id"::uuid`,
    );

    await queryRunner.query(
      `ALTER TABLE "rewards" ADD CONSTRAINT "FK_rewards_org_id_organizations_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" ADD CONSTRAINT "FK_recognitions_org_id_organizations_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_redemptions_org_id_organizations_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_point_transactions_org_id_organizations_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monthly_point_budgets" ADD CONSTRAINT "FK_monthly_point_budgets_org_id_organizations_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "monthly_point_budgets" DROP CONSTRAINT "FK_monthly_point_budgets_org_id_organizations_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_point_transactions_org_id_organizations_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_redemptions_org_id_organizations_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" DROP CONSTRAINT "FK_recognitions_org_id_organizations_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" DROP CONSTRAINT "FK_rewards_org_id_organizations_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "monthly_point_budgets" ALTER COLUMN "org_id" TYPE character varying USING "org_id"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ALTER COLUMN "org_id" TYPE character varying USING "org_id"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ALTER COLUMN "org_id" TYPE character varying USING "org_id"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" ALTER COLUMN "org_id" TYPE character varying USING "org_id"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "rewards" ALTER COLUMN "org_id" TYPE character varying USING "org_id"::text`,
    );
  }
}
