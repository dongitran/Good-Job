import { registerAs } from '@nestjs/config';
import { getEnvInt } from './helpers';

export const pointsConfig = registerAs('points', () => ({
  defaultMonthlyBudget: getEnvInt('DEFAULT_MONTHLY_BUDGET', 1000),
  minPoints: getEnvInt('DEFAULT_MIN_POINTS', 1),
  maxPoints: getEnvInt('DEFAULT_MAX_POINTS', 100),
}));
