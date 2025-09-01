import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const DISCORD_CLIENT_ID: string | undefined = process.env.DISCORD_CLIENT_ID;
const DISCORD_COMMAND_ID: string | undefined = process.env.DISCORD_COMMAND_ID;
const DISCORD_TOKEN: string | undefined = process.env.DISCORD_TOKEN;
if (!DISCORD_CLIENT_ID || !DISCORD_COMMAND_ID || !DISCORD_TOKEN) {
  throw new Error(
    'Missing DISCORD_CLIENT_ID, DISCORD_COMMAND_ID, or DISCORD_TOKEN in environment variables'
  );
}
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    await rest.delete(
      Routes.applicationCommand(DISCORD_CLIENT_ID, DISCORD_COMMAND_ID)
    );
    console.log('Command delete successful');
  } catch (err) {
    console.error(err);
  }
})();
