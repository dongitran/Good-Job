/**
 * Shared enums used across multiple entities
 * Separated to avoid circular dependencies
 */

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * Transaction Types for Double-Entry Bookkeeping
 *
 * Each transaction type represents a business event that creates balanced journal entries:
 * - recognition: User A gives points to User B (debit giver, credit receiver)
 * - redemption: User redeems points for reward (debit user, credit system)
 * - budget_allocation: Monthly budget reset (debit user, credit system equity)
 * - reversal: Error correction (creates offsetting entries)
 */
export enum TransactionType {
  RECOGNITION = 'recognition',
  REDEMPTION = 'redemption',
  BUDGET_ALLOCATION = 'budget_allocation',
  REVERSAL = 'reversal',
}

/**
 * Account Types for Double-Entry Bookkeeping
 *
 * Follows accounting principles:
 * - Asset accounts (user-owned): giveable, redeemable
 * - Liability accounts (system owes): system_liability
 * - Equity accounts (system owns): system_equity
 *
 * Balance equation: Assets = Liabilities + Equity
 * - (giveable + redeemable) = system_liability + system_equity
 */
export enum AccountType {
  GIVEABLE = 'giveable', // User's monthly giving budget (can give to others)
  REDEEMABLE = 'redeemable', // User's earned points (can redeem for rewards)
  SYSTEM_LIABILITY = 'system_liability', // System owes users (pending redemptions)
  SYSTEM_EQUITY = 'system_equity', // System-owned points (budget allocations)
}

/**
 * Balance Type for Point Balances (User accounts only)
 *
 * Note: This is separate from AccountType because point_balances table
 * only tracks user balances (giveable + redeemable), not system accounts.
 */
export enum BalanceType {
  GIVEABLE = 'giveable',
  REDEEMABLE = 'redeemable',
}
