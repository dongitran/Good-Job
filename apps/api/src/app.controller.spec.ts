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
});
