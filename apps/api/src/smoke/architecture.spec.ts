import { AppModule } from '../app.module';
import { AppE2eModule } from '../app.e2e.module';
import { AppService } from '../app.service';
import { AdminController } from '../modules/admin/admin.controller';
import { AdminModule } from '../modules/admin/admin.module';
import { AdminService } from '../modules/admin/admin.service';
import { AiController } from '../modules/ai/ai.controller';
import { AiModule } from '../modules/ai/ai.module';
import { AiService } from '../modules/ai/ai.service';
import { FeedController } from '../modules/feed/feed.controller';
import { FeedModule } from '../modules/feed/feed.module';
import { FeedService } from '../modules/feed/feed.service';
import { KudosController } from '../modules/kudos/kudos.controller';
import { KudosModule } from '../modules/kudos/kudos.module';
import { KudosService } from '../modules/kudos/kudos.service';
import { OrganizationsController } from '../modules/organizations/organizations.controller';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { OrganizationsService } from '../modules/organizations/organizations.service';
import { PointsController } from '../modules/points/points.controller';
import { PointsModule } from '../modules/points/points.module';
import { PointsService } from '../modules/points/points.service';
import { RewardsController } from '../modules/rewards/rewards.controller';
import { RewardsModule } from '../modules/rewards/rewards.module';
import { RewardsService } from '../modules/rewards/rewards.service';
import { UsersController } from '../modules/users/users.controller';
import { UsersModule } from '../modules/users/users.module';
import { UsersService } from '../modules/users/users.service';
import * as Entities from '../database/entities';

describe('Architecture Smoke', () => {
  it('loads top-level modules and services', () => {
    expect(AppModule).toBeDefined();
    expect(AppE2eModule).toBeDefined();
    expect(new AppService().getHello()).toBe('Hello World!');

    expect(AdminModule).toBeDefined();
    expect(FeedModule).toBeDefined();
    expect(KudosModule).toBeDefined();
    expect(OrganizationsModule).toBeDefined();
    expect(PointsModule).toBeDefined();
    expect(RewardsModule).toBeDefined();
    expect(UsersModule).toBeDefined();
    expect(AiModule).toBeDefined();

    // Simple services with no DI deps: instantiate to verify they work
    expect(new AdminService()).toBeDefined();
    expect(new RewardsService()).toBeDefined();
    expect(new UsersService()).toBeDefined();
    expect(new AiService()).toBeDefined();

    // DI-heavy services: verifying the class reference is sufficient —
    // the successful import proves the module is properly structured.
    // Instantiation belongs in unit/integration tests with TestingModule.
    expect(FeedService).toBeDefined();
    expect(KudosService).toBeDefined();
    expect(OrganizationsService).toBeDefined();
    expect(PointsService).toBeDefined();
  });

  it('loads controllers', () => {
    expect(new AdminController().healthCheck()).toEqual({
      status: 'ok',
      scope: 'admin',
    });
    // DI-injected controllers: verify class reference only
    expect(FeedController).toBeDefined();
    expect(KudosController).toBeDefined();
    expect(OrganizationsController).toBeDefined();
    expect(PointsController).toBeDefined();
    expect(RewardsController).toBeDefined();
    expect(UsersController).toBeDefined();
    expect(AiController).toBeDefined();
  });

  it('loads entities and enums', () => {
    // User & Auth Enums
    expect(Entities.UserRole.ADMIN).toBe('admin');
    expect(Entities.OAuthProvider.GOOGLE).toBe('google');

    // Organization Enums
    expect(Entities.OrgPlan.PRO).toBe('pro');

    // Points Enums (Double-Entry Bookkeeping)
    expect(Entities.TransactionType.RECOGNITION).toBe('recognition');
    expect(Entities.TransactionType.REDEMPTION).toBe('redemption');
    expect(Entities.TransactionType.BUDGET_ALLOCATION).toBe(
      'budget_allocation',
    );
    expect(Entities.TransactionType.REVERSAL).toBe('reversal');
    expect(Entities.AccountType.GIVEABLE).toBe('giveable');
    expect(Entities.AccountType.REDEEMABLE).toBe('redeemable');
    expect(Entities.AccountType.SYSTEM_LIABILITY).toBe('system_liability');
    expect(Entities.AccountType.SYSTEM_EQUITY).toBe('system_equity');
    expect(Entities.BalanceType.GIVEABLE).toBe('giveable');
    expect(Entities.BalanceType.REDEEMABLE).toBe('redeemable');

    // Rewards Enums
    expect(Entities.RewardCategory.SWAG).toBe('swag');
    expect(Entities.RedemptionStatus.PENDING).toBe('pending');

    // Core Entities
    expect(Entities).toHaveProperty('User');
    expect(Entities).toHaveProperty('Organization');
    expect(Entities).toHaveProperty('Department');
    expect(Entities).toHaveProperty('OrganizationMembership');

    // Auth Entities
    expect(Entities).toHaveProperty('OAuthConnection');
    expect(Entities).toHaveProperty('EmailVerificationToken');
    expect(Entities).toHaveProperty('PasswordResetToken');
    expect(Entities).toHaveProperty('Invitation');

    // Recognition Entities
    expect(Entities).toHaveProperty('Recognition');
    expect(Entities).toHaveProperty('RecognitionReaction');
    expect(Entities).toHaveProperty('RecognitionComment');

    // Points Entities (Double-Entry)
    expect(Entities).toHaveProperty('PointTransaction');
    expect(Entities).toHaveProperty('PointTransactionEntry');
    expect(Entities).toHaveProperty('PointBalance');
    expect(Entities).toHaveProperty('MonthlyPointBudget');

    // Rewards Entities
    expect(Entities).toHaveProperty('Reward');
    expect(Entities).toHaveProperty('Redemption');
  });
});
