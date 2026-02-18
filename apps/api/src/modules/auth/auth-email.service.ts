import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to: email,
      subject: 'Verify your Good Job account',
      html: `<p>Hi ${escapeHtml(fullName || 'there')},</p><p>Please verify your email to activate your account:</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you did not request this, ignore this email.</p>`,
      text: `Hi ${fullName || 'there'},\n\nVerify your email: ${verifyUrl}\n\nIf you did not request this, ignore this email.`,
      fallbackLogLabel: 'Email verification',
      fallbackLink: verifyUrl,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset your Good Job password',
      html: `<p>Hi ${escapeHtml(fullName || 'there')},</p><p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
      text: `Hi ${fullName || 'there'},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
      fallbackLogLabel: 'Password reset',
      fallbackLink: resetUrl,
    });
  }

  private async sendEmail(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
    fallbackLogLabel: string;
    fallbackLink: string;
  }): Promise<void> {
    const token = process.env.RESEND_TOKEN?.trim() || '';
    const from = process.env.ADMIN_EMAIL?.trim() || '';

    if (!token) {
      this.logger.warn(
        `${input.fallbackLogLabel} email skipped (RESEND_TOKEN missing). Link: ${input.fallbackLink}`,
      );
      return;
    }

    if (!from) {
      this.logger.warn(
        `${input.fallbackLogLabel} email skipped (ADMIN_EMAIL missing). Link: ${input.fallbackLink}`,
      );
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Resend API error (${response.status}): ${body}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email via Resend: ${message}`);
    }
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
