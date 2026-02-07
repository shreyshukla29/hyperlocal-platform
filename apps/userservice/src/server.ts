import { ServerConfig } from './config/index.js';
import { createApp } from './app.js';
import { startUserSignedUpConsumer } from './events/index.js';
import { logger } from '@hyperlocal/shared/logger';

const app = createApp();

async function bootstrap() {
  await startUserSignedUpConsumer();
}


bootstrap().catch((error) => {
  logger.error('Bootstrap failed', error);
  process.exit(1);
});

app.listen(ServerConfig.PORT, () => {
  logger.info(`User service started on port ${ServerConfig.PORT}`);
});
