import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ?? 587,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('SMTP not configured — email notifications disabled');
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Email skipped (no transporter): ${subject} -> ${to}`);
      return;
    }

    try {
      const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@schoolcompliance.com';
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent: ${subject} -> ${to}`);
    } catch (error) {
      this.logger.error(`Email failed: ${subject} -> ${to}`, error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async sendExpiryNotifications() {
    const thresholds = [30, 60, 90];
    const now = new Date();

    for (const days of thresholds) {
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const dayBefore = new Date(futureDate.getTime() - 24 * 60 * 60 * 1000);

      const documents = await this.prisma.document.findMany({
        where: {
          status: DocumentStatus.VALID,
          expiresAt: { gt: dayBefore, lte: futureDate },
        },
        include: { documentType: true },
      });

      for (const doc of documents) {
        const uploaderEmail = await this.getUploaderEmail(doc.uploadedBy);
        if (!uploaderEmail) continue;

        const subject = `[${days}-Day Warning] ${doc.documentType.name} expires soon`;
        const html = this.buildExpiryWarningHtml(doc.documentType.name, doc.expiresAt!, days);

        await this.sendEmail(uploaderEmail, subject, html);

        await this.auditService.log({
          action: 'EMAIL_EXPIRY_WARNING',
          entityId: doc.id,
          userId: doc.uploadedBy,
          details: { daysUntilExpiry: days, email: uploaderEmail },
        });
      }
    }
  }

  private async getUploaderEmail(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  private buildExpiryWarningHtml(docTypeName: string, expiresAt: Date, daysLeft: number): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Document Expiry Warning</h2>
        <p>Your document <strong>${docTypeName}</strong> will expire in approximately <strong>${daysLeft} days</strong>.</p>
        <p>Expiry date: <strong>${expiresAt.toLocaleDateString()}</strong></p>
        <p>Please upload a renewed version to maintain compliance.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #6b7280;">
          School Compliance Platform — automated notification
        </p>
      </div>
    `;
  }
}
