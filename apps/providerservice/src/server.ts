import { ServerConfig } from './config/';
import { createApp } from './app';
import { startProviderSignedUpConsumer } from './events';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

async function bootstrap() {
  await startProviderSignedUpConsumer();
}

bootstrap().catch((error) => {
  logger.error('Bootstrap failed', error);
  process.exit(1);
});

app.listen(ServerConfig.PORT, () => {
  logger.info(`Provider service started on port ${ServerConfig.PORT}`);
});
