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
import dataSource from '../database/data-source';

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

    expect(new AdminService()).toBeDefined();
    expect(new FeedService()).toBeDefined();
    expect(new KudosService()).toBeDefined();
    expect(new OrganizationsService()).toBeDefined();
    expect(new PointsService()).toBeDefined();
    expect(new RewardsService()).toBeDefined();
    expect(new UsersService()).toBeDefined();
    expect(new AiService()).toBeDefined();
  });

  it('loads controllers', () => {
    expect(new AdminController().healthCheck()).toEqual({
      status: 'ok',
      scope: 'admin',
    });
    expect(new FeedController()).toBeDefined();
    expect(new KudosController()).toBeDefined();
    expect(new OrganizationsController()).toBeDefined();
    expect(new PointsController()).toBeDefined();
    expect(new RewardsController()).toBeDefined();
    expect(new UsersController()).toBeDefined();
    expect(new AiController()).toBeDefined();
  });

  it('loads entities and enums', () => {
    expect(Entities.UserRole.ADMIN).toBe('admin');
    expect(Entities.OrgPlan.PRO).toBe('pro');
    expect(Entities.RewardCategory.SWAG).toBe('swag');
    expect(Entities.RedemptionStatus.PENDING).toBe('pending');
    expect(Entities.LedgerType.GIVE).toBe('give');
    expect(Entities.BalanceType.GIVEABLE).toBe('giveable');
    expect(Entities).toHaveProperty('User');
    expect(Entities).toHaveProperty('Kudo');
    expect(dataSource).toBeDefined();
  });
});
