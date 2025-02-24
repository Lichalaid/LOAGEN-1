import { MemoryDB as Database } from "@builderbot/bot";
import { createBot } from "@builderbot/bot";
import Templates from "./Templates";
import Provider from "./Provider";
import {config} from "./config";



const main = async () => {

  const { httpServer } = await createBot(
    {
      flow: Templates,
      provider: Provider,
      database: new Database(),
    },
    {
      queue: {
        timeout: 20000,
        concurrencyLimit: 50,
      },
    }
  );

  httpServer(+config.PORT);
};

main();
