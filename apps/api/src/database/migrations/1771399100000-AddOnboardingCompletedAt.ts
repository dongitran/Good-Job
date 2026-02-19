import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingCompletedAt1771399100000 implements MigrationInterface {
  name = 'AddOnboardingCompletedAt1771399100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "onboarding_completed_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "onboarding_completed_at"`,
    );
  }
}
