import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharityRewardCategory1771500000000 implements MigrationInterface {
  name = 'AddCharityRewardCategory1771500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."rewards_category_enum" ADD VALUE IF NOT EXISTS 'charity'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    void _queryRunner;
    // PostgreSQL does not support removing enum values directly.
    // A full enum recreation would be needed; skip for safety.
  }
}
