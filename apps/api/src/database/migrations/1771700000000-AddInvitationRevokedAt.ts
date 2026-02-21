import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitationRevokedAt1771700000000 implements MigrationInterface {
  name = 'AddInvitationRevokedAt1771700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMPTZ NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP COLUMN IF EXISTS "revoked_at"`,
    );
  }
}
