import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.delete(
      Routes.applicationCommand(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_COMMAND_ID
      )
    );
    console.log('Command delete successful');
  } catch (err) {
    console.error(err);
  }
})();
