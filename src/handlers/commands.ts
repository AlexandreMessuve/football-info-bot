import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';
import {
  type Client,
  Collection,
  REST,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import type { Command } from '../types/commands.js';

// Define the structure of an imported command file
interface CommandModule {
  default: Command;
}

// Augment the Client type to include the commands collection
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

// This is the correct, simpler way to get __dirname
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

/**
 * Loads command files and registers them with the Discord API.
 */
export default async (client: Client): Promise<void> => {
  const commandsForApi: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  const commandsPath: string = path.join(__dirname, '../commands');

  try {
    const commandFiles: string[] = await fs.readdir(commandsPath);

    for (const file of commandFiles.filter((f) => f.endsWith('.js' ))) {
      const filePath: string = path.join(commandsPath, file);
      const fileUrl: string = pathToFileURL(filePath).href;
      const commandModule: CommandModule = await import(fileUrl);
      const command: Command = commandModule.default;

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command); // For local execution
        commandsForApi.push(command.data.toJSON()); // For API registration
      } else {
        console.warn(
          `[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`
        );
      }
    }
  } catch (error) {
    console.error('Error reading commands:', error);
  }

  // Register the commands with the API once the client is ready
  client.once('ready', async () => {
    const token: string | undefined = process.env.DISCORD_TOKEN;
    const clientId: string | undefined = process.env.DISCORD_CLIENT_ID;

    if (!token || !clientId) {
      console.error(
        'Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment variables.'
      );
      return;
    }

    const rest: REST = new REST().setToken(token);

    try {
      console.log(
        `Started refreshing ${commandsForApi.length} application (/) commands.`
      );

      const data = (await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsForApi } // Use the dedicated array here
      )) as unknown[];

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      console.error('Failed to refresh application commands:', error);
    }
  });
};
