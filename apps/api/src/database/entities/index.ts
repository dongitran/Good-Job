// Base
export { BaseEntity } from './base.entity';

// Organizations
export {
  Organization,
  OrgPlan,
  Industry,
  CompanySize,
} from './organization.entity';
export type { OrganizationSettings } from './organization.entity';

// Departments
export { Department } from './department.entity';

// Users & Authentication
export { User } from './user.entity';
export { UserRole } from './enums';
export { OrganizationMembership } from './organization-membership.entity';
export { OAuthConnection, OAuthProvider } from './oauth-connection.entity';
export { EmailVerificationToken } from './email-verification-token.entity';
export { PasswordResetToken } from './password-reset-token.entity';
export { Invitation } from './invitation.entity';

// Core Values
export { CoreValue } from './core-value.entity';

// Recognitions
export { Recognition } from './recognition.entity';
export { RecognitionReaction } from './recognition-reaction.entity';
export { RecognitionComment } from './recognition-comment.entity';

// Points (Double-Entry Bookkeeping)
export { PointTransaction } from './point-transaction.entity';
export { PointTransactionEntry } from './point-transaction-entry.entity';
export { PointBalance } from './point-balance.entity';
export { MonthlyPointBudget } from './monthly-point-budget.entity';

// Points Enums
export { TransactionType, AccountType, BalanceType } from './enums';

// Rewards
export { Reward, RewardCategory } from './reward.entity';
export { Redemption, RedemptionStatus } from './redemption.entity';

// Notifications
export { Notification, NotificationType } from './notification.entity';

// User Preferences
export {
  UserPreference,
  ThemePreference,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './user-preference.entity';
export type { NotificationPreferences } from './user-preference.entity';
