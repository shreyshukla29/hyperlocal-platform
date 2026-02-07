import { logger } from '@hyperlocal/shared/logger';
import type { INotificationChannel, ChannelSendContext } from './types.js';
import { sendEmail, getEmailSubjectAndHtml, isEmailConfigured } from '../utils/index.js';

const CHANNEL_NAME = 'email' as const;

/**
 * Email channel: sends HTML email via SMTP. Configured when SMTP env vars are set.
 * Requires recipients.email to be set.
 */
export function createEmailChannel(): INotificationChannel {
  return {
    name: CHANNEL_NAME,
    isConfigured: () => isEmailConfigured(),
    async send(context: ChannelSendContext): Promise<boolean> {
      const to = context.recipients?.email;
      if (!to) {
        logger.debug('Email channel skipped: no recipients.email');
        return false;
      }
      const { subject, html } = getEmailSubjectAndHtml({
        title: context.title,
        body: context.body,
        type: context.type,
        metadata: context.metadata ?? null,
      });
      return sendEmail({
        to,
        subject,
        html,
        text: context.body || undefined,
      });
    },
  };
}
