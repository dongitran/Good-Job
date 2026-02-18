import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1771399046701 implements MigrationInterface {
  name = 'InitSchema1771399046701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."rewards_category_enum" AS ENUM('swag', 'gift_card', 'time_off', 'experience')`,
    );
    await queryRunner.query(
      `CREATE TABLE "rewards" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "points_cost" integer NOT NULL, "category" "public"."rewards_category_enum" NOT NULL DEFAULT 'swag', "image_url" character varying, "stock" integer NOT NULL DEFAULT '-1', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "core_values" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" uuid NOT NULL, "name" character varying NOT NULL, "emoji" character varying, "color" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e803f3be84355938068923708dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_industry_enum" AS ENUM('tech', 'gaming', 'agency', 'finance', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_company_size_enum" AS ENUM('1-10', '11-50', '51-200', '201-500', '500+')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_plan_enum" AS ENUM('free', 'pro_trial', 'pro')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "industry" "public"."organizations_industry_enum", "company_size" "public"."organizations_company_size_enum", "logo_url" character varying, "settings" jsonb NOT NULL DEFAULT '{}', "plan" "public"."organizations_plan_enum" NOT NULL DEFAULT 'pro_trial', "trial_ends_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "departments" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" uuid NOT NULL, "name" character varying NOT NULL, CONSTRAINT "idx_department_org_name" UNIQUE ("org_id", "name"), CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3cfef557719b71f778c7e8ce7a" ON "departments" ("org_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_memberships_role_enum" AS ENUM('member', 'admin', 'owner')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_memberships" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "org_id" uuid NOT NULL, "role" "public"."organization_memberships_role_enum" NOT NULL, "department_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "idx_membership_user_org" UNIQUE ("user_id", "org_id"), CONSTRAINT "PK_cd7be805730a4c778a5f45364af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5352fc550034d507d6c76dd290" ON "organization_memberships" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6a9d3ebbd32942b394831138e" ON "organization_memberships" ("org_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying, "email_verified_at" TIMESTAMP WITH TIME ZONE, "full_name" character varying NOT NULL, "avatar_url" character varying, "is_active" boolean NOT NULL DEFAULT true, "refresh_token_version" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."redemptions_status_enum" AS ENUM('pending', 'approved', 'fulfilled', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" character varying NOT NULL, "reward_id" uuid NOT NULL, "user_id" uuid NOT NULL, "points_spent" integer NOT NULL, "status" "public"."redemptions_status_enum" NOT NULL DEFAULT 'pending', "idempotency_key" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "fulfilled_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_bdc3c1e23f4c013580487ec7486" UNIQUE ("idempotency_key"), CONSTRAINT "PK_def143ab94376fea5985bb04219" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_redemptions_user" ON "redemptions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "recognition_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recognition_id" uuid NOT NULL, "user_id" uuid NOT NULL, "emoji" character varying(10) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "idx_reaction_unique" UNIQUE ("recognition_id", "user_id", "emoji"), CONSTRAINT "PK_b06b0d24a8c2160994864859724" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recognition_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recognition_id" uuid NOT NULL, "user_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc8d7e3599783b5ff985b59c5f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recognitions" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "deleted_at" TIMESTAMP, "deleted_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" character varying NOT NULL, "giver_id" uuid NOT NULL, "receiver_id" uuid NOT NULL, "points" integer NOT NULL, "message" text NOT NULL, "value_id" uuid NOT NULL, "is_private" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9532d42e21bb1fa80a5001f0c20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recognitions_giver" ON "recognitions" ("giver_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recognitions_receiver" ON "recognitions" ("receiver_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recognitions_org_created" ON "recognitions" ("org_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_transaction_entries_account_type_enum" AS ENUM('giveable', 'redeemable', 'system_liability', 'system_equity')`,
    );
    await queryRunner.query(
      `CREATE TABLE "point_transaction_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" uuid NOT NULL, "user_id" uuid, "account_type" "public"."point_transaction_entries_account_type_enum" NOT NULL, "amount" integer NOT NULL, "description" text, CONSTRAINT "PK_b5e93963c2ed3c64bfdb11ffe69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entry_account" ON "point_transaction_entries" ("account_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entry_user_account" ON "point_transaction_entries" ("user_id", "account_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entry_transaction" ON "point_transaction_entries" ("transaction_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_transactions_transaction_type_enum" AS ENUM('recognition', 'redemption', 'budget_allocation', 'reversal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "point_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" character varying NOT NULL, "transaction_type" "public"."point_transactions_transaction_type_enum" NOT NULL, "reference_type" character varying, "reference_id" character varying, "description" text, "created_by" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ceb5185b63f070e23d65509b0a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_point_tx_created" ON "point_transactions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_point_tx_reference" ON "point_transactions" ("reference_type", "reference_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_point_tx_org" ON "point_transactions" ("org_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_balances_balance_type_enum" AS ENUM('giveable', 'redeemable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "point_balances" ("user_id" uuid NOT NULL, "balance_type" "public"."point_balances_balance_type_enum" NOT NULL, "current_balance" integer NOT NULL DEFAULT '0', "last_entry_id" uuid, "version" integer NOT NULL DEFAULT '0', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_716529d55f73d8a44c696af74e2" PRIMARY KEY ("user_id", "balance_type"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_point_balance_pk" ON "point_balances" ("user_id", "balance_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_password_reset_token" ON "password_reset_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."oauth_connections_provider_enum" AS ENUM('google', 'microsoft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" "public"."oauth_connections_provider_enum" NOT NULL, "provider_user_id" character varying NOT NULL, "access_token" text NOT NULL, "refresh_token" text, "token_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "idx_oauth_user_provider" UNIQUE ("user_id", "provider"), CONSTRAINT "PK_dd75e97352734560c9e585c057d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f913611cd8bd88464c5f5ce63" ON "oauth_connections" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_oauth_provider_user" ON "oauth_connections" ("provider_user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "monthly_point_budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" character varying NOT NULL, "user_id" uuid NOT NULL, "month" date NOT NULL, "total_budget" integer NOT NULL, "spent" integer NOT NULL DEFAULT '0', "version" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "idx_budget_user_month" UNIQUE ("user_id", "month"), CONSTRAINT "PK_bb6743f6b577e1b35c59bb707b9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('member', 'admin', 'owner')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "org_id" uuid NOT NULL, "email" character varying NOT NULL, "role" "public"."invitations_role_enum" NOT NULL, "department_id" uuid, "invited_by" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "idx_invitation_org_email" UNIQUE ("org_id", "email"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5267611dcc50f78999dbf54f46" ON "invitations" ("org_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_invitation_token" ON "invitations" ("token") `,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_email_verification_token" ON "email_verification_tokens" ("token") `,
    );
    await queryRunner.query(
      `ALTER TABLE "core_values" ADD CONSTRAINT "FK_74242bef0bf734ede0823187c13" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "FK_3cfef557719b71f778c7e8ce7a2" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_5352fc550034d507d6c76dd2901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_d6a9d3ebbd32942b394831138e6" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_65933e070e5dfa5490d0865e81f" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_c59b27ed1a764e578add290572c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" ADD CONSTRAINT "FK_e845e4dbdf77458f29473e5e0cf" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_reactions" ADD CONSTRAINT "FK_dce242866ceb905f3317b41c93e" FOREIGN KEY ("recognition_id") REFERENCES "recognitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_reactions" ADD CONSTRAINT "FK_aac62d214de0959e9cc11f3ce80" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_comments" ADD CONSTRAINT "FK_6958dfa8e4af1cf16b7b4f8e373" FOREIGN KEY ("recognition_id") REFERENCES "recognitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_comments" ADD CONSTRAINT "FK_cb284a91ef146283d7ed36754b2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" ADD CONSTRAINT "FK_0ad726fecc490808f3643f45158" FOREIGN KEY ("giver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" ADD CONSTRAINT "FK_8c72bdbbad8bfe7a7477621e807" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" ADD CONSTRAINT "FK_06ae36bc92315c22d6eeeaba48f" FOREIGN KEY ("value_id") REFERENCES "core_values"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transaction_entries" ADD CONSTRAINT "FK_35e0859fbb973ac017e53da0751" FOREIGN KEY ("transaction_id") REFERENCES "point_transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transaction_entries" ADD CONSTRAINT "FK_c76bf7648e97a6846ba68428fc7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_balances" ADD CONSTRAINT "FK_f0bb5976e8f21e3bf7a05bce25b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_balances" ADD CONSTRAINT "FK_d7dfe30071d6e42045a80c951a0" FOREIGN KEY ("last_entry_id") REFERENCES "point_transaction_entries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_connections" ADD CONSTRAINT "FK_3f913611cd8bd88464c5f5ce632" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monthly_point_budgets" ADD CONSTRAINT "FK_20d4832dab3986179a42922eeb6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_5267611dcc50f78999dbf54f461" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_29b1cef6891d9b9d4e35f793b81" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_91654c8f2b648b742f15ce63c35" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_91654c8f2b648b742f15ce63c35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_29b1cef6891d9b9d4e35f793b81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_5267611dcc50f78999dbf54f461"`,
    );
    await queryRunner.query(
      `ALTER TABLE "monthly_point_budgets" DROP CONSTRAINT "FK_20d4832dab3986179a42922eeb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_connections" DROP CONSTRAINT "FK_3f913611cd8bd88464c5f5ce632"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_balances" DROP CONSTRAINT "FK_d7dfe30071d6e42045a80c951a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_balances" DROP CONSTRAINT "FK_f0bb5976e8f21e3bf7a05bce25b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transaction_entries" DROP CONSTRAINT "FK_c76bf7648e97a6846ba68428fc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transaction_entries" DROP CONSTRAINT "FK_35e0859fbb973ac017e53da0751"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" DROP CONSTRAINT "FK_06ae36bc92315c22d6eeeaba48f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" DROP CONSTRAINT "FK_8c72bdbbad8bfe7a7477621e807"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognitions" DROP CONSTRAINT "FK_0ad726fecc490808f3643f45158"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_comments" DROP CONSTRAINT "FK_cb284a91ef146283d7ed36754b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_comments" DROP CONSTRAINT "FK_6958dfa8e4af1cf16b7b4f8e373"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_reactions" DROP CONSTRAINT "FK_aac62d214de0959e9cc11f3ce80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recognition_reactions" DROP CONSTRAINT "FK_dce242866ceb905f3317b41c93e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_e845e4dbdf77458f29473e5e0cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "redemptions" DROP CONSTRAINT "FK_c59b27ed1a764e578add290572c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_65933e070e5dfa5490d0865e81f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_d6a9d3ebbd32942b394831138e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_5352fc550034d507d6c76dd2901"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "FK_3cfef557719b71f778c7e8ce7a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core_values" DROP CONSTRAINT "FK_74242bef0bf734ede0823187c13"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_email_verification_token"`,
    );
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_invitation_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5267611dcc50f78999dbf54f46"`,
    );
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    await queryRunner.query(`DROP TABLE "monthly_point_budgets"`);
    await queryRunner.query(`DROP INDEX "public"."idx_oauth_provider_user"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f913611cd8bd88464c5f5ce63"`,
    );
    await queryRunner.query(`DROP TABLE "oauth_connections"`);
    await queryRunner.query(
      `DROP TYPE "public"."oauth_connections_provider_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_password_reset_token"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_point_balance_pk"`);
    await queryRunner.query(`DROP TABLE "point_balances"`);
    await queryRunner.query(
      `DROP TYPE "public"."point_balances_balance_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_point_tx_org"`);
    await queryRunner.query(`DROP INDEX "public"."idx_point_tx_reference"`);
    await queryRunner.query(`DROP INDEX "public"."idx_point_tx_created"`);
    await queryRunner.query(`DROP TABLE "point_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."point_transactions_transaction_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_entry_transaction"`);
    await queryRunner.query(`DROP INDEX "public"."idx_entry_user_account"`);
    await queryRunner.query(`DROP INDEX "public"."idx_entry_account"`);
    await queryRunner.query(`DROP TABLE "point_transaction_entries"`);
    await queryRunner.query(
      `DROP TYPE "public"."point_transaction_entries_account_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_recognitions_org_created"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_recognitions_receiver"`);
    await queryRunner.query(`DROP INDEX "public"."idx_recognitions_giver"`);
    await queryRunner.query(`DROP TABLE "recognitions"`);
    await queryRunner.query(`DROP TABLE "recognition_comments"`);
    await queryRunner.query(`DROP TABLE "recognition_reactions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_redemptions_user"`);
    await queryRunner.query(`DROP TABLE "redemptions"`);
    await queryRunner.query(`DROP TYPE "public"."redemptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6a9d3ebbd32942b394831138e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5352fc550034d507d6c76dd290"`,
    );
    await queryRunner.query(`DROP TABLE "organization_memberships"`);
    await queryRunner.query(
      `DROP TYPE "public"."organization_memberships_role_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cfef557719b71f778c7e8ce7a"`,
    );
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_plan_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."organizations_company_size_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."organizations_industry_enum"`);
    await queryRunner.query(`DROP TABLE "core_values"`);
    await queryRunner.query(`DROP TABLE "rewards"`);
    await queryRunner.query(`DROP TYPE "public"."rewards_category_enum"`);
  }
}
