import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { connectDB } from './db/mongoConfig.js';
import 'dotenv/config';
import i18next from 'i18next';
import FsBackend from 'i18next-fs-backend';
import path from 'path';
import type { Command } from './types/commands.js';

// Extend the Client interface to include the 'commands' property
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const __filename: string = new URL('', import.meta.url).pathname;
const __dirname: string = path.join(__filename, '..');
// Initialize i18next with filesystem backend
const localesPath: string = path.join(
  __dirname,
  '..',
  'locales',
  '{{lng}}.json'
);
await i18next.use(FsBackend).init({
  fallbackLng: 'en',
  preload: ['en', 'fr'],
  backend: {
    loadPath: localesPath,
  },
});
// Create a new client instance
const client: Client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection<string, Command>();
const handlers: string[] = ['events', 'commands', 'errors'];

// Dynamically import and execute each handler
for (const handler of handlers) {
  const handlerImport = await import(`./handlers/${handler}.js`);
  const handlerFunction = handlerImport.default;
  if (typeof handlerFunction === 'function') {
    await handlerFunction(client);
  } else {
    console.error(`[ERROR]: Invalid handler function in ./handlers/${handler}`);
  }
}
/**
 * * Login to Discord with your client's token
 */
(async () => {
  try {
    console.log('[INFO] Connecting to database...');
    await connectDB();
    console.log('[INFO] Database connected');

    console.log('[INFO] Logging in...');
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[INFO] Bot logged in');
  } catch (error) {
    console.error('[ERROR] Bot failed to start', error);
  }
})();
