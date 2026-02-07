import { logger } from '@hyperlocal/shared/logger';
import type {
  INotificationChannel,
  NormalizedNotificationPayload,
  NotificationChannelName,
} from './types.js';

/**
 * Registry of notification channels. Add channels via register(); dispatch sends to all requested channels in parallel.
 */
class ChannelRegistry {
  private readonly channels = new Map<NotificationChannelName, INotificationChannel>();

  register(channel: INotificationChannel): this {
    if (this.channels.has(channel.name)) {
      logger.warn('Notification channel re-registered', { name: channel.name });
    }
    this.channels.set(channel.name, channel);
    return this;
  }

  get(name: NotificationChannelName): INotificationChannel | undefined {
    return this.channels.get(name);
  }

  /** Returns channels that are requested in payload and configured. */
  getRequestedChannels(payload: NormalizedNotificationPayload): INotificationChannel[] {
    const out: INotificationChannel[] = [];
    for (const name of payload.channels) {
      const ch = this.channels.get(name);
      if (ch?.isConfigured()) out.push(ch);
    }
    return out;
  }

  /**
   * Send to all requested and configured channels in parallel. Optimized: only invokes channels that are both requested and configured.
   */
  async dispatch(payload: NormalizedNotificationPayload): Promise<void> {
    const toRun = this.getRequestedChannels(payload);
    if (toRun.length === 0) return;

    const context = {
      userAuthId: payload.userAuthId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata,
      recipients: payload.recipients,
    };

    const results = await Promise.allSettled(
      toRun.map((ch) => ch.send(context)),
    );

    for (let i = 0; i < toRun.length; i++) {
      const r = results[i];
      const ch = toRun[i];
      if (r.status === 'rejected') {
        logger.error('Notification channel send failed', {
          channel: ch.name,
          err: r.reason,
        });
      }
    }
  }
}

/** Singleton registry. Must call createDefaultRegistry() (or initDefaultChannels) before getChannelRegistry(). */
let defaultRegistry: ChannelRegistry | null = null;

export function getChannelRegistry(): ChannelRegistry {
  const r = defaultRegistry;
  if (!r) {
    throw new Error(
      'Channel registry not initialized. Call initDefaultChannels() (or createDefaultRegistry) first.',
    );
  }
  return r;
}

export function createDefaultRegistry(
  registerFns: Array<(registry: ChannelRegistry) => void>,
): ChannelRegistry {
  const registry = new ChannelRegistry();
  for (const fn of registerFns) {
    fn(registry);
  }
  defaultRegistry = registry;
  return registry;
}

export { ChannelRegistry };
