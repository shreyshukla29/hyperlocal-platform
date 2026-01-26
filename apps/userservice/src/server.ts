import { ServerConfig } from './config/';
import { createApp } from './app';
import { startUserSignedUpConsumer } from './events';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

async function bootstrap() {
  try {
    await startUserSignedUpConsumer();
  } catch (error: any) {
    logger.error('Failed to start event consumer', error);
    setTimeout(() => bootstrap(), 10000);
  }
}

bootstrap().catch((error) => {
  logger.error('Bootstrap failed', error);
  process.exit(1);
});

app.listen(ServerConfig.PORT, () => {
  logger.info(`User service started on port ${ServerConfig.PORT}`);
});
