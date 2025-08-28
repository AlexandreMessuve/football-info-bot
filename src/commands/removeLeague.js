import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import LEAGUE_MAP from '../data/league.js';
import i18next from 'i18next';
import { getServerConfig, removeLeagueDb } from '../db/serverConfig.js';
import { deleteLeagueMessage } from '../utils/match.js';
import { fetchDailyMatchesByLeague } from '../tasks/scheduledTasks.js';

/**
 * Remove a league from the server's configuration and delete associated messages.
 */
export default {
  data: new SlashCommandBuilder()
    .setName('remove-league')
    .setDescription('remove a league to list')
    .setDescriptionLocalization(
      'fr',
      'Supprimer un championnat de la liste de surveillance'
    )
    .addStringOption((option) =>
      option
        .setName('league')
        .setDescription(
          'The name of the league to remove (e.g., Premier League, La Liga)'
        )
        .setDescriptionLocalization(
          'fr',
          'Le nom du championnat à supprimer (ex : Premier League, La Liga)'
        )
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(leagueId, leagueName, guild, interaction) {
    const server = await getServerConfig(guild.id);
    if (server.leagues && server.leagues.some((l) => l.id === leagueId)) {
      try {
        await Promise.all([
          deleteLeagueMessage(guild, leagueId),
          removeLeagueDb(guild.id, leagueId),
          fetchDailyMatchesByLeague(),
        ]);
        await interaction.editReply(
          i18next.t('removeLeagueSuccess', { leagueName })
        );
      } catch (e) {
        await interaction.editReply({
          content: i18next.t('errorMessage'),
        });
        console.error('[ERROR] Remove league command failed:', e);
      }
    } else {
      await interaction.editReply({
        content: i18next.t('removeLeagueNotFound', { leagueName }),
      });
    }
  },
};
