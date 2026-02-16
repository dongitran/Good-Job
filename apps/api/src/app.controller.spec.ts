import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return health check response', () => {
      const result = appController.healthCheck();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'Good Job API');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('readinessCheck', () => {
    it('should return ready when optional checks are skipped', async () => {
      const result = await appController.readinessCheck();
      expect(result).toHaveProperty('status', 'ready');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toEqual({
        database: 'skipped',
        redis: 'skipped',
      });
    });

    it('should return not_ready when dependency checks fail', async () => {
      const failingController = new AppController(
        {
          query: jest.fn().mockRejectedValue(new Error('db down')),
        } as any,
        {
          ping: jest.fn().mockResolvedValue('NOPE'),
        } as any,
      );

      const result = await failingController.readinessCheck();
      expect(result).toHaveProperty('status', 'not_ready');
      expect(result.checks).toEqual({
        database: 'down',
        redis: 'down',
      });
    });

    it('should mark redis as down when ping throws', async () => {
      const controllerWithRedisError = new AppController(
        {
          query: jest.fn().mockResolvedValue([{ ok: 1 }]),
        } as any,
        {
          ping: jest.fn().mockRejectedValue(new Error('redis down')),
        } as any,
      );

      const result = await controllerWithRedisError.readinessCheck();
      expect(result).toHaveProperty('status', 'not_ready');
      expect(result.checks).toEqual({
        database: 'up',
        redis: 'down',
      });
    });
  });
});
