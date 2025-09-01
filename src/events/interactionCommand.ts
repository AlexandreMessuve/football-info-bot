import {
  CommandInteraction,
  PermissionsBitField,
  MessageFlags,
  ChatInputCommandInteraction,
  type Client,
} from 'discord.js';
import i18next from 'i18next';
import LEAGUE_MAP from '../data/league.js';
import type { Command } from '../types/commands.js';

export default async (interaction: CommandInteraction): Promise<void> => {
  const client = interaction.client as Client;
  const command = client.commands.get(interaction.commandName) as
    | Command
    | undefined;
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
  if (!interaction.guildId) {
    await interaction.editReply({
      content: i18next.t('guildOnlyCommand'),
    });
    return;
  }
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  if (
    !(interaction.member?.permissions as PermissionsBitField).has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    await interaction.editReply({
      content: i18next.t('noPermission'),
    });
    return;
  }

  try {
    if (command.commandType === 'league') {
      const inputInteraction = interaction as ChatInputCommandInteraction;
      const leagueId: string = inputInteraction.options.getString(
        'league',
        true
      );
      const leagueName: string | undefined = LEAGUE_MAP.get(leagueId);

      if (!leagueName || !interaction.guild) {
        await interaction.editReply({
          content: i18next.t('invalidLeagueID', { leagueId }),
        });
        return;
      }
      await command.execute(
        leagueId,
        leagueName,
        interaction.guild,
        interaction as ChatInputCommandInteraction
      );
    } else {
      await command.execute(interaction as ChatInputCommandInteraction);
    }
  } catch (err) {
    console.error(err);
    const content: string = i18next.t('errorMessage');
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply({ content, flags: [MessageFlags.Ephemeral] });
    }
  }
};
