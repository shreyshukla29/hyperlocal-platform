import nodemailer from 'nodemailer';
import { logger } from '@hyperlocal/shared/logger';
import { ServerConfig } from '../config/index.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!ServerConfig.SMTP_HOST || !ServerConfig.EMAIL_FROM) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: ServerConfig.SMTP_HOST,
    port: ServerConfig.SMTP_PORT ? parseInt(ServerConfig.SMTP_PORT, 10) : 587,
    secure: ServerConfig.SMTP_SECURE === 'true',
    auth:
      ServerConfig.SMTP_USER && ServerConfig.SMTP_PASS
        ? {
            user: ServerConfig.SMTP_USER,
            pass: ServerConfig.SMTP_PASS,
          }
        : undefined,
  });
  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const trans = getTransporter();
  if (!trans) {
    logger.debug('Email not sent: SMTP not configured');
    return false;
  }
  try {
    await trans.sendMail({
      from: ServerConfig.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (err) {
    logger.error('Failed to send email', { err, to: options.to, subject: options.subject });
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!(ServerConfig.SMTP_HOST && ServerConfig.EMAIL_FROM);
}
