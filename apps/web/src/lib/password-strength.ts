export interface PasswordStrengthResult {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'Weak' };
  if (score === 2) return { score, label: 'Fair' };
  if (score === 3) return { score, label: 'Good' };
  return { score, label: 'Strong' };
}
