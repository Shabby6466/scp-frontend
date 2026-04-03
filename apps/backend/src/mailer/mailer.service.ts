import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly client: MailerSend | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY');
    this.fromEmail =
      this.config.get<string>('MAILERSEND_FROM_EMAIL') ??
      'noreply@schoolsystem.com';
    this.fromName =
      this.config.get<string>('MAILERSEND_FROM_NAME') ?? 'School System';

    if (apiKey) {
      this.client = new MailerSend({ apiKey });
    } else {
      this.logger.warn(
        'MAILERSEND_API_KEY not set; emails will be logged only',
      );
    }
  }

  /** MailerSend rejects with a plain { headers, body, statusCode } — avoid bubbling that to Nest as an "exception". */
  private formatMailerSendError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
      const o = err as Record<string, unknown>;
      const body = o.body;
      if (body && typeof body === 'object') {
        const msg = (body as Record<string, unknown>).message;
        if (typeof msg === 'string') return msg;
      }
      if (typeof o.statusCode === 'number') {
        return o.statusCode === 401
          ? 'Unauthenticated (invalid or missing MailerSend API key)'
          : `HTTP ${o.statusCode}`;
      }
    }
    return String(err);
  }

  private async dispatchEmail(
    successLog: string,
    send: (client: MailerSend) => Promise<unknown>,
    devFallback: () => void,
  ): Promise<void> {
    if (!this.client) {
      devFallback();
      return;
    }
    try {
      await send(this.client);
      this.logger.log(successLog);
    } catch (err: unknown) {
      const detail = this.formatMailerSendError(err);
      this.logger.error(`MailerSend request failed: ${detail}`);
      throw new InternalServerErrorException(
        'Email could not be sent. Check MAILERSEND_API_KEY and that the sender domain is verified in MailerSend.',
      );
    }
  }

  async sendVerificationCode(toEmail: string, code: string): Promise<void> {
    const subject = 'Verify your email';
    const html = `
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. Use it to complete your registration.</p>
    `;
    const text = `Your verification code is: ${code}. This code expires in 10 minutes.`;

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.dispatchEmail(
      `Verification email sent to ${toEmail}`,
      (client) => client.email.send(emailParams),
      () => this.logger.log(`[DEV] Verification code for ${toEmail}: ${code}`),
    );
  }

  async sendOtp(toEmail: string, code: string): Promise<void> {
    const subject = 'Your login code';
    const html = `
      <p>Your one-time login code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. Do not share it with anyone.</p>
    `;
    const text = `Your one-time login code is: ${code}. This code expires in 10 minutes.`;

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.dispatchEmail(
      `OTP email sent to ${toEmail}`,
      (client) => client.email.send(emailParams),
      () => this.logger.log(`[DEV] OTP for ${toEmail}: ${code}`),
    );
  }

  async sendInvite(
    toEmail: string,
    code: string,
    inviterName?: string,
  ): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify?email=${encodeURIComponent(toEmail)}&invite=1`;

    const subject = 'You have been invited to School System';
    const html = `
      <p>${inviterName ?? 'Someone'} has invited you to School System.</p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. <a href="${verifyUrl}">Click here to set your password and verify your email</a>.</p>
    `;
    const text = `You have been invited. Your verification code is: ${code}. Go to ${verifyUrl} to set your password. This code expires in 10 minutes.`;

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.dispatchEmail(
      `Invite email sent to ${toEmail}`,
      (client) => client.email.send(emailParams),
      () => this.logger.log(`[DEV] Invite OTP for ${toEmail}: ${code}`),
    );
  }

  async sendDocTypeAssigned(
    toEmail: string,
    documentTypeName: string,
  ): Promise<void> {
    const subject = 'New document assigned';
    const html = `<p>A new required document has been assigned: <strong>${documentTypeName}</strong></p>`;
    const text = `A new required document has been assigned: ${documentTypeName}`;

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.dispatchEmail(
      `Document assignment email sent to ${toEmail}`,
      (client) => client.email.send(emailParams),
      () =>
        this.logger.log(
          `[DEV] Document assigned for ${toEmail}: ${documentTypeName}`,
        ),
    );
  }

  async sendDocumentUploadedNotice(
    toEmail: string,
    documentTypeName: string,
  ): Promise<void> {
    const subject = 'Document uploaded';
    const html = `<p>A document upload was completed for: <strong>${documentTypeName}</strong></p>`;
    const text = `A document upload was completed for: ${documentTypeName}`;

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.dispatchEmail(
      `Document uploaded notification sent to ${toEmail}`,
      (client) => client.email.send(emailParams),
      () =>
        this.logger.log(
          `[DEV] Document uploaded notice for ${toEmail}: ${documentTypeName}`,
        ),
    );
  }

  async sendDocumentDueReminder(
    toEmail: string,
    documentTypeName: string,
    dueDate: string,
  ): Promise<void> {
    const subject = 'Document due reminder';
    const html = `<p>Your document <strong>${documentTypeName}</strong> is due on <strong>${dueDate}</strong>.</p>`;
    const text = `Your document ${documentTypeName} is due on ${dueDate}.`;

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await this.dispatchEmail(
      `Document due reminder sent to ${toEmail}`,
      (client) => client.email.send(emailParams),
      () =>
        this.logger.log(
          `[DEV] Document due reminder for ${toEmail}: ${documentTypeName} due ${dueDate}`,
        ),
    );
  }
}
