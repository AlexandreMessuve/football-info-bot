import {MessageFlags, SlashCommandBuilder} from 'discord.js';
import LEAGUE_MAP from '../data/league.ts';
import i18next from 'i18next';
import {getServerConfig, removeLeagueDb, removeStandings} from '../db/serverConfig.ts';
import {deleteLeagueMessage} from '../utils/match.js';
import {fetchDailyMatchesByLeague} from '../tasks/scheduledTasks.js';
import {deleteStandingLeague} from "../utils/standing.js";

/**
 * Remove a league from the server's configuration and delete associated messages.
 */
export default {
    data: new SlashCommandBuilder()
        .setName('remove-league')
        .setDescription('remove a league to list')
        .setDescriptionLocalizations(
            {
                'fr': 'Supprimer un championnat de la liste de surveillance',
                'es-ES': 'Eliminar una liga de la lista'
            }
        )
        .addStringOption((option) =>
            option
                .setName('league')
                .setDescription(
                    'The name of the league to remove (e.g., Premier League, La Liga)'
                )
                .setDescriptionLocalizations(
                    {
                        'fr': 'Le nom du championnat à supprimer (ex : Premier League, La Liga)',
                        'es-ES': 'El nombre de la liga a eliminar (ej: Premier League, La Liga)'
                    }
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
                    deleteStandingLeague(guild, leagueId)
                ]);
                await fetchDailyMatchesByLeague();
                await interaction.editReply(
                    i18next.t('removeLeagueSuccess', {leagueName})
                );
            } catch (e) {
                await interaction.editReply({
                    content: i18next.t('errorMessage'),
                });
                console.error('[ERROR] Remove league command failed:', e);
            }
        } else {
            await interaction.editReply({
                content: i18next.t('removeLeagueNotFound', {leagueName}),
            });
        }
    },
};
