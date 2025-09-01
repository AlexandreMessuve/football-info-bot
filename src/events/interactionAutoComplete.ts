import { type AutocompleteInteraction } from 'discord.js';
import { getChoice } from '../utils/util.js';

export default async (interaction: AutocompleteInteraction): Promise<void> => {
  if (!interaction.guildId) return;
  if (
    interaction.commandName === 'add-league' ||
    interaction.commandName === 'remove-league'
  ) {
    const type: 'add' | 'remove' =
      interaction.commandName === 'add-league' ? 'add' : 'remove';
    try {
      const choices = await getChoice(interaction.guildId, type);
      await interaction.respond(choices);
    } catch (err) {
      console.error(err);
      await interaction.respond([]);
    }
  }
};
