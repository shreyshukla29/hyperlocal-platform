import express, { type Application } from 'express';
import { ServerConfig } from './config/';
const app: Application = express();

app.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
});
