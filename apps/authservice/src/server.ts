import express, { type Application } from 'express';
import { ServerConfig } from './config';
import { router } from './routes';
const app: Application = express();

app.use(router);
app.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
});
