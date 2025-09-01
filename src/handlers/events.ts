import interactionCreate from '../events/interactionCommand.js';
import ready from '../events/ready.js';
import {
  type AutocompleteInteraction,
  type Client,
  type CommandInteraction,
  Events,
  type Interaction,
} from 'discord.js';
import interactionAutoComplete from '../events/interactionAutoComplete.js';
import i18next from 'i18next';

/**
 * Registers event handlers for the Discord client.
 * @param client
 * @returns {Promise<void>}
 */
export default async (client: Client): Promise<void> => {
  client.on(Events.ClientReady, async (): Promise<void> => {
    await ready(client);
  });
  client.on(
    Events.InteractionCreate,
    async (interaction: Interaction): Promise<void> => {
      await i18next.changeLanguage(interaction.locale ?? 'en');
      if (interaction.isAutocomplete()) {
        await interactionAutoComplete(interaction as AutocompleteInteraction);
      }
      if (interaction.isChatInputCommand()) {
        await interactionCreate(interaction as CommandInteraction);
      }
    }
  );
};
