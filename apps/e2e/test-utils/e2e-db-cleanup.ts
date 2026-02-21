import { Client } from 'pg';

const DEFAULT_EMAIL_PATTERN = 'e2e.%@example.com';

interface CleanupSummary {
  targetUserCount: number;
  targetOrgCount: number;
  deletedRowCount: number;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function deleteAndCount(
  client: Client,
  query: string,
  params: unknown[],
): Promise<number> {
  const result = await client.query(query, params);
  return result.rowCount ?? 0;
}

async function cleanupByPattern(
  client: Client,
  emailPattern: string,
): Promise<CleanupSummary> {
  await client.query('BEGIN');

  try {
    const targetUsersResult = await client.query<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE email LIKE $1
      `,
      [emailPattern],
    );

    const userIds = unique(targetUsersResult.rows.map((row) => row.id));

    const targetOrgsResult = await client.query<{ id: string }>(
      `
        SELECT DISTINCT org.id::text AS id
        FROM organizations org
        WHERE org.slug LIKE 'e2e-%'
          OR org.id IN (
            SELECT membership.org_id
            FROM organization_memberships membership
            WHERE membership.user_id = ANY($1::uuid[])
          )
      `,
      [userIds],
    );

    const orgIds = unique(targetOrgsResult.rows.map((row) => row.id));

    if (userIds.length === 0 && orgIds.length === 0) {
      await client.query('COMMIT');
      return { targetUserCount: 0, targetOrgCount: 0, deletedRowCount: 0 };
    }

    let deletedRowCount = 0;

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM recognition_reactions reaction
        WHERE reaction.recognition_id IN (
          SELECT recognition.id
          FROM recognitions recognition
          WHERE recognition.org_id = ANY($1::uuid[])
        )
          OR reaction.user_id = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM recognition_comments comment
        WHERE comment.recognition_id IN (
          SELECT recognition.id
          FROM recognitions recognition
          WHERE recognition.org_id = ANY($1::uuid[])
        )
          OR comment.user_id = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM redemptions redemption
        WHERE redemption.org_id = ANY($1::uuid[])
          OR redemption.user_id = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM point_balances balance
        WHERE balance.user_id = ANY($1::uuid[])
      `,
      [userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM point_transaction_entries entry
        WHERE entry.user_id = ANY($2::uuid[])
          OR entry.transaction_id IN (
            SELECT tx.id
            FROM point_transactions tx
            WHERE tx.org_id = ANY($1::uuid[])
          )
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM point_transactions tx
        WHERE tx.org_id = ANY($1::uuid[])
          OR tx.created_by = ANY($2::text[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM monthly_point_budgets budget
        WHERE budget.org_id = ANY($1::uuid[])
          OR budget.user_id = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM recognitions recognition
        WHERE recognition.org_id = ANY($1::uuid[])
          OR recognition.giver_id = ANY($2::uuid[])
          OR recognition.receiver_id = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM rewards reward
        WHERE reward.org_id = ANY($1::uuid[])
      `,
      [orgIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM core_values core_value
        WHERE core_value.org_id = ANY($1::uuid[])
      `,
      [orgIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM invitations invitation
        WHERE invitation.org_id = ANY($1::uuid[])
          OR invitation.invited_by = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM organization_memberships membership
        WHERE membership.org_id = ANY($1::uuid[])
          OR membership.user_id = ANY($2::uuid[])
      `,
      [orgIds, userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM departments department
        WHERE department.org_id = ANY($1::uuid[])
      `,
      [orgIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM oauth_connections oauth
        WHERE oauth.user_id = ANY($1::uuid[])
      `,
      [userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM password_reset_tokens reset_token
        WHERE reset_token.user_id = ANY($1::uuid[])
      `,
      [userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM email_verification_tokens verify_token
        WHERE verify_token.user_id = ANY($1::uuid[])
      `,
      [userIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM organizations org
        WHERE org.id = ANY($1::uuid[])
      `,
      [orgIds],
    );

    deletedRowCount += await deleteAndCount(
      client,
      `
        DELETE FROM users account
        WHERE account.id = ANY($1::uuid[])
      `,
      [userIds],
    );

    await client.query('COMMIT');

    return {
      targetUserCount: userIds.length,
      targetOrgCount: orgIds.length,
      deletedRowCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function cleanupE2eDatabase(label: string): Promise<void> {
  if (process.env.E2E_SKIP_DB_CLEANUP === 'true') {
    console.info(`[e2e-db-cleanup] ${label}: skipped (E2E_SKIP_DB_CLEANUP=true).`);
    return;
  }

  const databaseUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.info(
      `[e2e-db-cleanup] ${label}: skipped (missing E2E_DATABASE_URL or DATABASE_URL).`,
    );
    return;
  }

  const emailPattern =
    process.env.E2E_CLEANUP_EMAIL_PATTERN || DEFAULT_EMAIL_PATTERN;
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  try {
    const summary = await cleanupByPattern(client, emailPattern);
    console.info(
      `[e2e-db-cleanup] ${label}: matched users=${summary.targetUserCount}, orgs=${summary.targetOrgCount}, deleted rows=${summary.deletedRowCount}.`,
    );
  } finally {
    await client.end();
  }
}
