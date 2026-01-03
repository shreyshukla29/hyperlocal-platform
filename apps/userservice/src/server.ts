import { ServerConfig } from "./config/";
import { createApp } from './app';
import { startUserSignedUpConsumer } from './events'

const app = createApp();

async function bootstrap() {
  await startUserSignedUpConsumer();

}

bootstrap();

app.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
});
