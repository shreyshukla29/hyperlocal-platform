export * from './types.js';
export * from './registry.js';
export * from './normalize.js';
export { createInAppChannel } from './in-app.channel.js';
export { createEmailChannel } from './email.channel.js';

import { getChannelRegistry, createDefaultRegistry, ChannelRegistry } from './registry.js';
import { createInAppChannel } from './in-app.channel.js';
import { createEmailChannel } from './email.channel.js';
import { NotificationRepository } from '../repositories/index.js';
import { NotificationService } from '../service/index.js';

/**
 * Build the default registry with in_app and email channels.
 * Call once at consumer startup (or app bootstrap) so dispatch uses these channels.
 */
export function initDefaultChannels(): void {
  const notificationRepository = new NotificationRepository();
  const notificationService = new NotificationService(notificationRepository);

  createDefaultRegistry([
    (registry: ChannelRegistry) => {
      registry.register(createInAppChannel(notificationService));
    },
    (registry: ChannelRegistry) => {
      registry.register(createEmailChannel());
    },
  ]);
}

/**
 * Get the registry (after initDefaultChannels) for dispatch.
 */
export function getRegistry() {
  return getChannelRegistry();
}
