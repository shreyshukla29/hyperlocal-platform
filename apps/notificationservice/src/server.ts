import { ServerConfig } from './config/index.js';
import { createApp } from './app.js';
import { startNotificationConsumer } from './events/index.js';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

const port = ServerConfig.PORT ?? 3005;

async function bootstrap() {
  await startNotificationConsumer();
}

bootstrap().catch((err) => {
  logger.error('Notification consumer bootstrap failed (optional)', err);
});

app.listen(port, () => {
  logger.info(`Notification service started on port ${port}`);
});
