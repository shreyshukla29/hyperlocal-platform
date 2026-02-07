import type {
  NormalizedNotificationPayload,
  NotificationChannelName,
  NotificationRecipients,
} from './types.js';

/** Raw payload from broker (backward compat: channel + emailTo). Extend recipients when adding channels. */
export interface RawNotificationPayload {
  userAuthId: string;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  channel?: 'in_app' | 'email' | 'both';
  /** Explicit channels list (takes precedence over channel) */
  channels?: NotificationChannelName[] | null;
  emailTo?: string | null;
  phone?: string | null;
}

/**
 * Normalize raw broker payload into a single shape. Resolves channel/channels and recipients.
 */
export function normalizePayload(raw: RawNotificationPayload): NormalizedNotificationPayload {
  const channels: NotificationChannelName[] =
    (raw.channels?.length ?? 0) > 0
      ? raw.channels!
      : resolveChannelsFromLegacy(raw.channel);

  const recipients: NotificationRecipients = {
    ...(raw.emailTo && { email: raw.emailTo }),
    ...(raw.phone && { phone: raw.phone }),
  };

  return {
    userAuthId: raw.userAuthId,
    type: raw.type,
    title: raw.title,
    body: raw.body ?? '',
    metadata: raw.metadata ?? null,
    channels,
    recipients,
  };
}

function resolveChannelsFromLegacy(
  channel?: 'in_app' | 'email' | 'both',
): NotificationChannelName[] {
  switch (channel) {
    case 'both':
      return ['in_app', 'email'];
    case 'email':
      return ['email'];
    case 'in_app':
    default:
      return ['in_app'];
  }
}
