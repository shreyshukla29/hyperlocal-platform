/**
 * Supported delivery channels. Add new channel names here and implement INotificationChannel.
 */
export type NotificationChannelName = 'in_app' | 'email';

/**
 * Recipients per channel. Extend when adding channels (e.g. phone for SMS, deviceId for push).
 */
export interface NotificationRecipients {
  email?: string;
  phone?: string;
  /** Future: deviceIds for push */
  deviceIds?: string[];
}

/**
 * Normalized payload after parsing broker message. Single shape for all channels.
 */
export interface NormalizedNotificationPayload {
  userAuthId: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  /** Channels to send to (resolved from channel/channels) */
  channels: NotificationChannelName[];
  recipients: NotificationRecipients;
}

/**
 * Context passed to channel send(). Subset of payload + any precomputed content.
 */
export interface ChannelSendContext {
  userAuthId: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  recipients: NotificationRecipients;
}

/**
 * Implement this interface to add a new notification channel (SMS, push, Slack, etc.).
 * Register the implementation in the channel registry.
 */
export interface INotificationChannel {
  readonly name: NotificationChannelName;
  /** Whether this channel is configured and can send (e.g. SMTP set for email). */
  isConfigured(): boolean;
  /**
   * Send the notification. Return true if sent (or queued), false if skipped (e.g. not configured).
   * Throw only on unrecoverable errors.
   */
  send(context: ChannelSendContext): Promise<boolean>;
}
