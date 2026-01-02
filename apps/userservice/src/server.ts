import { ServerConfig } from "./config/";
import { createApp } from './app';

const app = createApp();


app.listen(ServerConfig.PORT, () => {
  console.log(`Successfully started the server on PORT : ${ServerConfig.PORT}`);
});
