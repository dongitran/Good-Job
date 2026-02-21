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
      html: renderEmailTemplate({
        preheader: 'Verify your email to activate your Good Job account.',
        title: 'Verify your email',
        subtitle: `Hi ${escapeHtml(fullName || 'there')}, welcome to Good Job.`,
        lines: [
          'Please verify your email address to activate your account and start recognizing your team.',
          'This verification link expires in 24 hours.',
        ],
        ctaLabel: 'Verify Email',
        ctaUrl: verifyUrl,
        footer:
          'If you did not create this account, you can safely ignore this email.',
      }),
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
      html: renderEmailTemplate({
        preheader: 'Reset your Good Job password.',
        title: 'Reset your password',
        subtitle: `Hi ${escapeHtml(fullName || 'there')}, we received a password reset request.`,
        lines: [
          'Use the button below to set a new password for your Good Job account.',
          'This reset link expires in 1 hour.',
        ],
        ctaLabel: 'Reset Password',
        ctaUrl: resetUrl,
        footer:
          'If you did not request a password reset, you can safely ignore this email.',
      }),
      text: `Hi ${fullName || 'there'},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
      fallbackLogLabel: 'Password reset',
      fallbackLink: resetUrl,
    });
  }

  async sendInvitationEmail(
    email: string,
    orgName: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');
    const inviteUrl = `${appUrl}/register?invite=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to: email,
      subject: `You've been invited to join ${orgName} on Good Job`,
      html: renderEmailTemplate({
        preheader: `You have been invited to join ${orgName} on Good Job.`,
        title: "You're invited!",
        subtitle: `Hi there, you've been invited to join <strong>${escapeHtml(orgName)}</strong> on Good Job.`,
        lines: [
          'Good Job helps teams recognize each other and celebrate great work.',
          'Click the button below to accept your invitation and create your account.',
          'This invitation link expires in 7 days.',
        ],
        ctaLabel: 'Accept Invitation',
        ctaUrl: inviteUrl,
        footer:
          'If you were not expecting this invitation, you can safely ignore this email.',
      }),
      text: `You've been invited to join ${orgName} on Good Job.\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
      fallbackLogLabel: 'Invitation',
      fallbackLink: inviteUrl,
    });
  }

  async sendInvitationCancelledEmail(
    email: string,
    orgName: string,
  ): Promise<void> {
    const appUrl = this.configService
      .getOrThrow<string>('app.url')
      .replace(/\/$/, '');

    await this.sendEmail({
      to: email,
      subject: `Your invitation to ${orgName} on Good Job has been cancelled`,
      html: renderEmailTemplate({
        preheader: `Your invitation to join ${orgName} has been cancelled.`,
        title: 'Invitation Cancelled',
        subtitle: `Hi there, your invitation to join <strong>${escapeHtml(orgName)}</strong> on Good Job has been cancelled.`,
        lines: [
          'The invitation link you received is no longer valid.',
          'If you believe this was a mistake, please contact the organization admin and ask them to send a new invitation.',
        ],
        ctaLabel: 'Visit Good Job',
        ctaUrl: appUrl,
        footer:
          'If you were not expecting this email, you can safely ignore it.',
      }),
      text: `Your invitation to join ${orgName} on Good Job has been cancelled.\n\nThe invitation link you received is no longer valid.\n\nIf you believe this was a mistake, please contact the organization admin.`,
      fallbackLogLabel: 'Invitation cancellation',
      fallbackLink: appUrl,
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
    const skipDomains = (process.env.EMAIL_SKIP_DOMAINS ?? '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const emailDomain = input.to.split('@')[1];
    if (skipDomains.includes(emailDomain)) {
      this.logger.log(
        `${input.fallbackLogLabel} email skipped (domain "${emailDomain}" in EMAIL_SKIP_DOMAINS). Link: ${input.fallbackLink}`,
      );
      return;
    }

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

function renderEmailTemplate(input: {
  preheader: string;
  title: string;
  subtitle: string;
  lines: string[];
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}): string {
  const escapedLines = input.lines
    .map((line) => `<p style="margin:0 0 12px 0;">${line}</p>`)
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(input.preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#f8fafc;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:linear-gradient(135deg,#6d28d9,#2563eb);padding:26px 24px;color:#ffffff;">
                <div style="font-size:14px;letter-spacing:0.12em;opacity:0.9;">GOOD JOB</div>
                <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.2;">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#334155;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 14px 0;">${input.subtitle}</p>
                ${escapedLines}
                <p style="margin:20px 0 0 0;">
                  <a href="${input.ctaUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:linear-gradient(90deg,#7c3aed,#3b82f6);color:#ffffff;text-decoration:none;font-weight:700;">
                    ${escapeHtml(input.ctaLabel)}
                  </a>
                </p>
                <p style="margin:14px 0 0 0;font-size:12px;word-break:break-all;color:#64748b;">
                  If the button does not work, paste this link into your browser:<br />
                  ${escapeHtml(input.ctaUrl)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
                ${escapeHtml(input.footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
