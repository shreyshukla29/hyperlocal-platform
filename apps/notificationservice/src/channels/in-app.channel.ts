import type { INotificationChannel, ChannelSendContext } from './types.js';
import type { NotificationService } from '../service/index.js';

const CHANNEL_NAME = 'in_app' as const;

/**
 * In-app channel: persists notification to DB for the user to read in the app.
 * Always "configured" when the service is available.
 */
export function createInAppChannel(
  notificationService: NotificationService,
): INotificationChannel {
  return {
    name: CHANNEL_NAME,
    isConfigured: () => true,
    async send(context: ChannelSendContext): Promise<boolean> {
      await notificationService.create({
        userAuthId: context.userAuthId,
        type: context.type,
        title: context.title,
        body: context.body || undefined,
        metadata: context.metadata ?? undefined,
      });
      return true;
    },
  };
}
