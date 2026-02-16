import { registerAs } from '@nestjs/config';
import { requireEnv } from './helpers';

export const pointsConfig = registerAs('points', () => ({
  defaultMonthlyBudget: parseInt(requireEnv('DEFAULT_MONTHLY_BUDGET'), 10), // Required - business rule
  minPoints: parseInt(requireEnv('DEFAULT_MIN_POINTS'), 10), // Required - business rule
  maxPoints: parseInt(requireEnv('DEFAULT_MAX_POINTS'), 10), // Required - business rule
}));
